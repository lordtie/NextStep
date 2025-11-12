// backend/server.js
const express = require("express");
const fs = require("fs");
const fsp = fs.promises;
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { randomUUID } = require("crypto");

const { FE_URL } = require("../config");

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(
  cors({
    origin: FE_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

// collapse double slashes in URLs
app.use((req, _res, next) => {
  req.url = req.url.replace(/\/+/g, "/");
  next();
});

// simple log
app.use((req, _res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});

// ------------------ FS helpers ------------------
async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}
async function readJson(file, fallback) {
  try {
    const buf = await fsp.readFile(file, "utf8");
    return JSON.parse(buf);
  } catch (e) {
    return fallback;
  }
}
async function writeJson(file, data) {
  const tmp = file + ".tmp";
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fsp.rename(tmp, file);
}

// ------------------ Paths ------------------
const USERS_FILE = path.join(__dirname, "users.json");
const USERDATA_DIR = path.join(__dirname, "userdata");

// ensure storage exists & normalize keys
(async () => {
  await ensureDir(USERDATA_DIR);
  const users = await readJson(USERS_FILE, []);
  if (!Array.isArray(users)) await writeJson(USERS_FILE, []);

  // normalize existing per-user files: calender -> calendar
  const files = await fsp.readdir(USERDATA_DIR).catch(() => []);
  for (const name of files) {
    if (!name.endsWith(".json")) continue;
    const p = path.join(USERDATA_DIR, name);
    const data = await readJson(p, {});
    if (data && data.calender && !data.calendar) {
      data.calendar = data.calender;
      delete data.calender;
      await writeJson(p, data);
      console.log("Normalized 'calender' -> 'calendar' in", name);
    }
  }
})();

// ------------------ Per-user data helpers ------------------
function userDataPath(userId) {
  return path.join(USERDATA_DIR, `${userId}.json`);
}
async function ensureUserFile(userId, base = {}) {
  await ensureDir(USERDATA_DIR);
  const p = userDataPath(userId);
  const exists = await fsp.access(p).then(() => true).catch(() => false);
  if (!exists) {
    const initial = {
      userId,
      createdAt: new Date().toISOString(),
      profile: { location: null, timezone: null },
      tasks: [],
      calendar: [],
      reminders: [],
      ...base,
    };
    await writeJson(p, initial);
  }
  return p;
}
async function loadUserData(userId) {
  const p = await ensureUserFile(userId);
  return readJson(p, { tasks: [], calendar: [], reminders: [] });
}
async function saveUserData(userId, data) {
  const p = userDataPath(userId);
  await writeJson(p, data);
}

// ------------------ USERS ------------------

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const users = await readJson(USERS_FILE, []);
    if (users.find((u) => u.email?.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const user = { id, username, email, password, createdAt };

    users.push(user);
    await writeJson(USERS_FILE, users);

    // create per-user file
    const userDataPath = await ensureUserFile(id, {
      username,
      email,
      createdAt,
    });

    console.log("Created user data:", userDataPath);
    const safe = { id, username, email, createdAt };
    return res.status(201).json(safe);
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login (simple JSON check)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  const users = await readJson(USERS_FILE, []);
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });
  res.json({ id: user.id, username: user.username, email: user.email });
});

// ------------------ TASKS (per user) ------------------

// GET tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const data = await loadUserData(userId);
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    return res.json(tasks);
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST create task (default status: Not Started)
app.post("/api/tasks", async (req, res) => {
  try {
    const { userId, title, dueDate, notes, status } = req.body || {};
    if (!userId || !title) {
      return res.status(400).json({ message: "userId and title are required" });
    }

    const data = await loadUserData(userId);
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];

    const task = {
      id: randomUUID(),
      title: title.trim(),
      notes: notes || "",
      dueDate: dueDate || null,
      status: ["Not Started", "In Progress", "Completed"].includes(status)
        ? status
        : "Not Started",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tasks.unshift(task);
    data.tasks = tasks;
    await saveUserData(userId, data);

    return res.status(201).json(task);
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT update task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = String(req.params.id);
    const { userId, title, notes, dueDate, status } = req.body || {};
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const data = await loadUserData(userId);
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const idx = tasks.findIndex((t) => String(t.id) === taskId);
    if (idx === -1) return res.status(404).json({ message: "Task not found" });

    const updated = {
      ...tasks[idx],
      ...(title !== undefined ? { title } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(status !== undefined ? { status } : {}),
      updatedAt: new Date().toISOString(),
    };

    tasks[idx] = updated;
    data.tasks = tasks;
    await saveUserData(userId, data);

    return res.json(updated);
  } catch (err) {
    console.error("PUT /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE remove task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = String(req.params.id);
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const data = await loadUserData(userId);
    const tasks = Array.isArray(data.tasks) ? data.tasks : [];
    const next = tasks.filter((t) => String(t.id) !== taskId);
    if (next.length === tasks.length) {
      return res.status(404).json({ message: "Task not found" });
    }
    data.tasks = next;
    await saveUserData(userId, data);
    return res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("DELETE /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ------------------ START ------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

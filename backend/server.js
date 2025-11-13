// backend/server.js 
// Express server for NextStep with real auth (email+password), settings, tasks, events.

const express = require("express");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// ---------- Config ----------
const PORT = process.env.PORT || 5000;
const FRONTEND_BUILD_DIR = path.join(__dirname, "..", "frontend", "build");
const USERS_DIR = path.join(__dirname, "users");

// ---------- Middleware ----------
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// ---------- Auth store ----------
const {
  register,
  login,
  getUserByUsername,
  updateProfileUsername,
  readUserFile,
  writeUserFile,
} = require("./lib/authStore");

// ---------- Auth helpers ----------
function requireAuth(req, res, next) {
  const username = req.cookies?.username;
  if (!username) return res.status(401).json({ error: "Unauthorized" });
  req.username = String(username);
  next();
}

// ---------- AUTH ROUTES ----------

// POST /api/auth/register { email, name, password }
// If email already exists and password matches, log in instead.
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    try {
      const user = await register({ email, name, password });
      res.cookie("username", user.username, {
        httpOnly: false,
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
      return res.json({ user, registered: true, loggedIn: true });
    } catch (e) {
      const msg = String(e.message || e);
      if (!/email already in use/i.test(msg)) {
        return res.status(400).json({ error: msg || "Registration failed" });
      }
      try {
        const user = await login({ identifier: email, password });
        res.cookie("username", user.username, {
          httpOnly: false,
          sameSite: "lax",
          maxAge: 365 * 24 * 60 * 60 * 1000,
        });
        return res.json({ user, registered: false, loggedIn: true });
      } catch {
        return res
          .status(401)
          .json({ error: "Email already registered, but password is incorrect" });
      }
    }
  } catch (e) {
    res.status(400).json({ error: e.message || "Registration failed" });
  }
});

// POST /api/auth/login { identifier, password }  // identifier = email OR username
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    const user = await login({ identifier, password });
    res.cookie("username", user.username, {
      httpOnly: false,
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    res.json({ user });
  } catch (e) {
    res.status(401).json({ error: e.message || "Invalid credentials" });
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("username", { sameSite: "lax" });
  res.json({ ok: true });
});

// GET /api/me
app.get("/api/me", requireAuth, async (req, res) => {
  const user = await getUserByUsername(req.username);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { data } = await readUserFile(req.username);
  res.json({ user, settings: data.settings });
});

// ---------- SETTINGS ROUTES ----------
app.get("/api/settings", requireAuth, async (req, res) => {
  try {
    const { data } = await readUserFile(req.username);
    res.json({
      name: data.settings.name,
      email: data.settings.email || "",
      timezone: data.settings.timezone,
      theme: data.settings.theme,
      username: req.username,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to load settings", detail: String(e.message || e) });
  }
});

app.put("/api/settings", requireAuth, async (req, res) => {
  try {
    const { data, file } = await readUserFile(req.username);
    const next = { ...data.settings };

    if (typeof req.body?.name === "string") next.name = req.body.name.trim() || next.name;
    if (typeof req.body?.email === "string") next.email = req.body.email.trim();
    if (typeof req.body?.timezone === "string") next.timezone = req.body.timezone;
    if (typeof req.body?.theme === "string") next.theme = req.body.theme;

    // Do NOT rename usernames automatically. Only update display name.
    const updatedUser = await updateProfileUsername(req.username, next.name);

    const merged = { ...data, settings: next };
    await writeUserFile(file, merged);

    res.json({
      user: updatedUser || { username: req.username, name: next.name, email: next.email || "" },
      settings: next,
      renamed: false,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to save settings", detail: String(e.message || e) });
  }
});

// ---------- EVENTS ROUTES ----------
const {
  listEvents,
  createEvent,
  updateEvent,
  removeEvent,
} = require("./lib/eventsStore");

app.get("/api/events", requireAuth, async (req, res) => {
  try {
    const events = await listEvents(req);
    res.json(events);
  } catch (e) {
    res.status(500).json({ error: "Failed to list events", detail: String(e.message || e) });
  }
});

app.post("/api/events", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.start || !body.end) {
      return res.status(400).json({ error: "start and end are required" });
    }
    // Normalize optional fields on create if you need to later
    const created = await createEvent(req, body);
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: "Failed to create event", detail: String(e.message || e) });
  }
});

app.put("/api/events/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const updated = await updateEvent(req, id, req.body || {});
    if (!updated) return res.status(404).json({ error: "Event not found" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Failed to update event", detail: String(e.message || e) });
  }
});

app.delete("/api/events/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const result = await removeEvent(req, id);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete event", detail: String(e.message || e) });
  }
});

// ---------- TASKS ROUTES ----------
const {
  listTasks,
  createTask,
  updateTask,
  removeTask,
} = require("./lib/tasksStore");

app.get("/api/tasks", requireAuth, async (req, res) => {
  try {
    const tasks = await listTasks(req);
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: "Failed to list tasks", detail: String(e.message || e) });
  }
});

app.post("/api/tasks", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    // Title required guard (prevents creating empty tasks)
    if (!body.title || typeof body.title !== "string") {
      return res.status(400).json({ error: "title is required" });
    }

    // Normalize dueAt to ISO or null (so store gets a clean value)
    const normalizedDue = normalizeISOorNull(body.dueAt);

    // Sensible defaults
    const payload = {
      title: String(body.title).trim(),
      status: body.status || "Open",
      completed: body.status === "Done" ? true : !!body.completed,
      dueAt: normalizedDue, // ✅ ensure it's in ISO or null
    };

    const created = await createTask(req, payload);
    res.json(created);
  } catch (e) {
    res.status(500).json({ error: "Failed to create task", detail: String(e.message || e) });
  }
});

app.put("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const patch = { ...(req.body || {}) };

    // Normalize dueAt if present on patch
    if (Object.prototype.hasOwnProperty.call(patch, "dueAt")) {
      patch.dueAt = normalizeISOorNull(patch.dueAt);
    }
    // Keep completed in sync with status "Done"
    if (patch.status === "Done") {
      patch.completed = true;
    }

    const updated = await updateTask(req, id, patch);
    if (!updated) return res.status(404).json({ error: "Task not found" });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: "Failed to update task", detail: String(e.message || e) });
  }
});

app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const result = await removeTask(req, req.params.id);
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete task", detail: String(e.message || e) });
  }
});

// ---------- Health ----------
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// ---------- Static frontend (optional prod serve) ----------
if (fs.existsSync(FRONTEND_BUILD_DIR)) {
  app.use(express.static(FRONTEND_BUILD_DIR));
  app.get("*", (req, res) => {
    res.sendFile(path.join(FRONTEND_BUILD_DIR, "index.html"));
  });
}

// ---------- Start ----------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`NextStep server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;

// ---------- Helpers ----------
function normalizeISOorNull(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

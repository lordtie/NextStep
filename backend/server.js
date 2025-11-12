// backend/server.js
const express = require("express");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());
app.use(
  cookieSession({
    name: "nsess",
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  })
);

const USERS_DIR = path.join(__dirname, "users");
const AUTH_FILE = path.join(USERS_DIR, "index.json");

async function ensureUsersDir() {
  await fsp.mkdir(USERS_DIR, { recursive: true });
  try { await fsp.access(AUTH_FILE); }
  catch { await fsp.writeFile(AUTH_FILE, JSON.stringify({ users: [] }, null, 2)); }
}

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const slugifyEmail = (email) => slugify(email);

function userDataFile(uid) {
  return path.join(USERS_DIR, `${uid}.json`);
}

async function readAuth() {
  await ensureUsersDir();
  const raw = await fsp.readFile(AUTH_FILE, "utf8");
  return JSON.parse(raw);
}
async function writeAuth(obj) {
  await ensureUsersDir();
  return fsp.writeFile(AUTH_FILE, JSON.stringify(obj, null, 2));
}
async function readUserData(uid) {
  await ensureUsersDir();
  const file = userDataFile(uid);
  try {
    const raw = await fsp.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    const init = {
      tasks: [],
      events: [],
      settings: { name: "User", timezone: "America/Chicago", theme: "dark" },
    };
    await fsp.writeFile(file, JSON.stringify(init, null, 2));
    return init;
  }
}
async function writeUserData(uid, data) {
  await ensureUsersDir();
  const file = userDataFile(uid);
  await fsp.writeFile(file, JSON.stringify(data, null, 2));
}
function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function requireAuth(req, res, next) {
  if (req.session && req.session.uid) return next();
  res.status(401).json({ error: "Unauthorized" });
}

/** Ensure a UID is unique by adding -2, -3, ... if needed */
async function uniqueUid(baseUid) {
  let uid = baseUid;
  let n = 2;
  while (true) {
    try {
      await fsp.access(userDataFile(uid));
      // file exists -> try a new suffix
      uid = `${baseUid}-${n++}`;
    } catch {
      // not found -> good to use
      return uid;
    }
  }
}

// --- Health / Me / Auth ---
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/me", async (req, res) => {
  if (!req.session?.uid) return res.json(null);
  const auth = await readAuth();
  const u = auth.users.find((x) => x.uid === req.session.uid);
  if (!u) return res.json(null);
  res.json({ uid: u.uid, email: u.email, name: u.name });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const auth = await readAuth();
  const exists = auth.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ error: "Email already registered" });

  // initial UID was email-based; that's fine for first login
  const uid = slugifyEmail(email);
  const passwordHash = await bcrypt.hash(password, 10);
  const displayName = name || email.split("@")[0];

  auth.users.push({
    uid,
    email,
    name: displayName,
    passwordHash,
    createdAt: new Date().toISOString(),
  });
  await writeAuth(auth);

  await writeUserData(uid, {
    tasks: [],
    events: [],
    settings: { name: displayName, timezone: "America/Chicago", theme: "dark" },
  });

  req.session.uid = uid;
  res.status(201).json({ uid, email, name: displayName });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const auth = await readAuth();
  const u = auth.users.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  req.session.uid = u.uid;
  res.json({ uid: u.uid, email: u.email, name: u.name });
});

app.post("/api/auth/logout", (req, res) => {
  req.session = null;
  res.status(204).end();
});

// --- Settings (name / timezone / theme) ---
// Now also RENAMES the data file + updates auth.uid if display name changes
app.get("/api/settings", requireAuth, async (req, res) => {
  const data = await readUserData(req.session.uid);
  res.json(data.settings || {});
});

app.put("/api/settings", requireAuth, async (req, res) => {
  const incoming = req.body || {};
  const oldUid = req.session.uid;

  const [auth, data] = await Promise.all([readAuth(), readUserData(oldUid)]);
  const authIdx = auth.users.findIndex((u) => u.uid === oldUid);
  if (authIdx === -1) return res.status(401).json({ error: "Unauthorized" });

  // figure out desired name/theme/tz
  const newName = incoming.name ?? data.settings?.name ?? "User";
  const newTZ = incoming.timezone ?? data.settings?.timezone ?? "America/Chicago";
  const newTheme = incoming.theme ?? data.settings?.theme ?? "dark";

  // If the name changed, rename UID & data file, update auth, refresh session
  let finalUid = oldUid;
  if (newName && newName.trim() && newName.trim() !== (data.settings?.name || "")) {
    // derive username-based UID
    const baseUid = slugify(newName.trim());
    let targetUid = baseUid || oldUid;
    if (targetUid !== oldUid) {
      targetUid = await uniqueUid(targetUid);

      // try to rename the data file (if old exists)
      try {
        await fsp.rename(userDataFile(oldUid), userDataFile(targetUid));
      } catch (e) {
        // If old file doesn't exist (fresh user), just continue — write will create.
        // If something else went wrong, bubble up.
        if (e && e.code !== "ENOENT") throw e;
      }

      // update auth index
      const u = auth.users[authIdx];
      auth.users[authIdx] = { ...u, uid: targetUid, name: newName };
      await writeAuth(auth);

      // refresh session UID
      req.session.uid = targetUid;
      finalUid = targetUid;
    } else {
      // name changed but uid would be identical; still update display name in auth
      const u = auth.users[authIdx];
      auth.users[authIdx] = { ...u, name: newName };
      await writeAuth(auth);
    }
  } else {
    // name did not change; still ensure auth name matches incoming (if provided)
    if (incoming.name != null) {
      const u = auth.users[authIdx];
      auth.users[authIdx] = { ...u, name: newName };
      await writeAuth(auth);
    }
  }

  // Write settings into the (possibly new) data file
  const updatedData = await readUserData(finalUid);
  updatedData.settings = {
    ...updatedData.settings,
    name: newName,
    timezone: newTZ,
    theme: newTheme,
  };
  await writeUserData(finalUid, updatedData);

  // also return fresh user info so the client can update UI immediately
  const freshUser = auth.users.find((x) => x.uid === finalUid);
  res.json({
    settings: updatedData.settings,
    user: freshUser ? { uid: freshUser.uid, email: freshUser.email, name: freshUser.name } : null,
  });
});

// --- Tasks
app.get("/api/tasks", requireAuth, async (req, res) => {
  const data = await readUserData(req.session.uid);
  res.json(data.tasks || []);
});
app.post("/api/tasks", requireAuth, async (req, res) => {
  const data = await readUserData(req.session.uid);
  const t = {
    id: newId(),
    title: req.body?.title ?? "Untitled",
    due: req.body?.due ?? null,
    status: req.body?.status ?? "todo",
    done: req.body?.done ?? false,
    notes: req.body?.notes ?? "",
    color: req.body?.color ?? "slate",
    priority: req.body?.priority ?? "normal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  t.done = t.status === "done" ? true : !!t.done;
  if (t.done && t.status !== "done") t.status = "done";
  data.tasks.unshift(t);
  await writeUserData(req.session.uid, data);
  res.status(201).json(t);
});
app.put("/api/tasks/:id", requireAuth, async (req, res) => {
  const data = await readUserData(req.session.uid);
  const idx = (data.tasks || []).findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const prev = data.tasks[idx];
  const next = { ...prev, ...req.body, updatedAt: new Date().toISOString() };
  if (typeof req.body?.done === "boolean") {
    next.status = req.body.done ? "done" : prev.status === "done" ? "todo" : (req.body.status ?? prev.status);
  }
  if (typeof req.body?.status === "string") next.done = req.body.status === "done";
  data.tasks[idx] = next;
  await writeUserData(req.session.uid, data);
  res.json(next);
});
app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
  const data = await readUserData(req.session.uid);
  const before = data.tasks.length;
  data.tasks = (data.tasks || []).filter((t) => t.id !== req.params.id);
  if (data.tasks.length === before) return res.status(404).json({ error: "Not found" });
  await writeUserData(req.session.uid, data);
  res.status(204).end();
});

// --- Events
app.get("/api/events", requireAuth, async (req, res) => {
  const data = await readUserData(req.session.uid);
  res.json(data.events || []);
});
app.post("/api/events", requireAuth, async (req, res) => {
  const data = await readUserData(req.session.uid);
  const ev = {
    id: newId(),
    title: req.body?.title ?? "Untitled",
    when: req.body?.when ?? new Date().toISOString(),
    where: req.body?.where ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.events.unshift(ev);
  await writeUserData(req.session.uid, data);
  res.status(201).json(ev);
});
app.put("/api/events/:id", requireAuth, async (req, res) => {
  const data = await readUserData(req.session.uid);
  const idx = (data.events || []).findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const prev = data.events[idx];
  const next = { ...prev, ...req.body, updatedAt: new Date().toISOString() };
  data.events[idx] = next;
  await writeUserData(req.session.uid, data);
  res.json(next);
});
app.delete("/api/events/:id", requireAuth, async (req, res) => {
  const data = await readUserData(req.session.uid);
  const before = data.events.length;
  data.events = (data.events || []).filter((e) => e.id !== req.params.id);
  if (data.events.length === before) return res.status(404).json({ error: "Not found" });
  await writeUserData(req.session.uid, data);
  res.status(204).end();
});

// Optional static
const CLIENT_BUILD = path.join(__dirname, "..", "frontend", "build");
if (fs.existsSync(CLIENT_BUILD)) {
  app.use(express.static(CLIENT_BUILD));
  app.get("*", (_req, res) => res.sendFile(path.join(CLIENT_BUILD, "index.html")));
}

app.listen(PORT, () => console.log(`NextStep backend on http://localhost:${PORT}`));

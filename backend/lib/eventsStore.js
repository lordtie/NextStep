// backend/lib/eventsStore.js
// Simple per-user JSON store for calendar events.
// Assumes your project keeps per-user files at: backend/users/<username>.json

const fsp = require("fs").promises;
const path = require("path");

const USERS_DIR = path.join(__dirname, "..", "users");

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true }).catch(() => {});
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

// Basic way to figure out who's making the request.
// If you already have auth, replace this with your actual user lookup.
// Tries: req.user?.username, cookie "username", header "x-user-id", fallback "demo".
function resolveUsername(req) {
  const u =
    (req.user && (req.user.username || req.user.name || req.user.id)) ||
    req.cookies?.username ||
    req.headers["x-user-id"] ||
    "demo";
  return String(u).replace(/[^\w.-]/g, "_");
}

async function readUserFile(username) {
  const userFile = path.join(USERS_DIR, `${username}.json`);
  try {
    const raw = await fsp.readFile(userFile, "utf8");
    const json = JSON.parse(raw || "{}");
    if (!json.events) json.events = [];
    return { file: userFile, data: json };
  } catch (e) {
    // create a fresh file if it doesn't exist or is invalid
    await ensureDir(USERS_DIR);
    return { file: userFile, data: { events: [] } };
  }
}

async function writeUserFile(file, data) {
  const text = JSON.stringify(data, null, 2);
  await fsp.writeFile(file, text, "utf8");
}

async function listEvents(req) {
  const username = resolveUsername(req);
  const { data } = await readUserFile(username);
  return data.events || [];
}

async function createEvent(req, evt) {
  const username = resolveUsername(req);
  const { file, data } = await readUserFile(username);
  const newEvt = {
    id: evt.id || uid(),
    title: evt.title || "Untitled event",
    description: evt.description || "",
    location: evt.location || "",
    start: new Date(evt.start).toISOString(),
    end: new Date(evt.end).toISOString(),
    allDay: !!evt.allDay,
  };
  data.events = Array.isArray(data.events) ? data.events : [];
  data.events.push(newEvt);
  await writeUserFile(file, data);
  return newEvt;
}

async function updateEvent(req, id, patch) {
  const username = resolveUsername(req);
  const { file, data } = await readUserFile(username);
  const idx = (data.events || []).findIndex((e) => e.id === id);
  if (idx === -1) return null;

  const current = data.events[idx];
  const updated = {
    ...current,
    ...patch,
  };

  // Normalize times if present
  if (patch.start) updated.start = new Date(patch.start).toISOString();
  if (patch.end) updated.end = new Date(patch.end).toISOString();
  if (typeof patch.allDay !== "undefined") updated.allDay = !!patch.allDay;

  data.events[idx] = updated;
  await writeUserFile(file, data);
  return updated;
}

async function removeEvent(req, id) {
  const username = resolveUsername(req);
  const { file, data } = await readUserFile(username);
  const before = data.events?.length || 0;
  data.events = (data.events || []).filter((e) => e.id !== id);
  await writeUserFile(file, data);
  return { removed: before - (data.events?.length || 0) };
}

module.exports = {
  listEvents,
  createEvent,
  updateEvent,
  removeEvent,
};

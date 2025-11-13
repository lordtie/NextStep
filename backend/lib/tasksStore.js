// backend/lib/tasksStore.js
// Per-user JSON storage for tasks, using helpers from authStore.

const crypto = require("crypto");
const { readUserFile, writeUserFile } = require("./authStore");

function randomId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(12).toString("hex");
}

function nowISO() {
  return new Date().toISOString();
}

function normalizeISOorNull(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * List all tasks for the authenticated user (req.username),
 * newest first by updatedAt/createdAt.
 */
async function listTasks(req) {
  const username = req.username;
  const { data } = await readUserFile(username);
  const list = Array.isArray(data.tasks) ? data.tasks.slice() : [];

  // Sort by updatedAt (fallback createdAt), descending
  list.sort((a, b) => {
    const aa = a.updatedAt || a.createdAt || "";
    const bb = b.updatedAt || b.createdAt || "";
    return bb.localeCompare(aa);
  });

  return list;
}

/**
 * Create a task for req.username
 * body: { title: string, status?: "Open"|"In Progress"|"Done", completed?: bool, dueAt?: ISO|null }
 */
async function createTask(req, body) {
  const username = req.username;
  const { data, file } = await readUserFile(username);

  const when = nowISO();
  const status = body.status || "Open";
  const completed = status === "Done" ? true : !!body.completed;

  const task = {
    id: randomId(),
    title: String(body.title || "").trim(),
    status,
    completed,
    dueAt: normalizeISOorNull(body.dueAt), // ✅ persist dueAt
    createdAt: when,
    updatedAt: when,
  };

  if (!Array.isArray(data.tasks)) data.tasks = [];
  data.tasks.unshift(task);

  await writeUserFile(file, data);
  return task;
}

/**
 * Update a task by id for req.username
 * patch can include: title, status, completed, dueAt
 */
async function updateTask(req, id, patch = {}) {
  const username = req.username;
  const { data, file } = await readUserFile(username);

  if (!Array.isArray(data.tasks)) data.tasks = [];
  const idx = data.tasks.findIndex((t) => String(t.id) === String(id));
  if (idx === -1) return null;

  const prev = data.tasks[idx];

  // Build next with allowed fields
  const next = { ...prev };

  if (patch.title !== undefined) next.title = String(patch.title).trim();
  if (patch.status !== undefined) next.status = patch.status;
  if (patch.completed !== undefined) next.completed = !!patch.completed;

  if (patch.dueAt !== undefined) {
    next.dueAt = normalizeISOorNull(patch.dueAt); // ✅ update dueAt
  }

  // Keep status/completed consistent
  if (next.status === "Done") next.completed = true;

  next.updatedAt = nowISO();

  data.tasks[idx] = next;
  await writeUserFile(file, data);
  return next;
}

/**
 * Remove a task by id for req.username
 */
async function removeTask(req, id) {
  const username = req.username;
  const { data, file } = await readUserFile(username);

  if (!Array.isArray(data.tasks)) data.tasks = [];
  const before = data.tasks.length;
  data.tasks = data.tasks.filter((t) => String(t.id) !== String(id));
  const after = data.tasks.length;

  await writeUserFile(file, data);
  return { removed: before - after };
}

module.exports = {
  listTasks,
  createTask,
  updateTask,
  removeTask,
};

// frontend/src/lib/api.js
let base = "/api";
try {
  // eslint-disable-next-line import/no-unresolved, global-require
  const cfg = require("../config");
  if (cfg?.apiBase) base = cfg.apiBase;
} catch {}

async function request(path, opts = {}) {
  const res = await fetch(base + path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  // Auth
  me:        () => request("/me"),
  register:  (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login:     (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout:    () => request("/auth/logout", { method: "POST" }),

  // Settings
  getSettings: () => request("/settings"),
  saveSettings: (data) => request("/settings", { method: "PUT", body: JSON.stringify(data) }),

  // Tasks
  listTasks:   () => request("/tasks"),
  createTask:  (data) => request("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask:  (id, data) => request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask:  (id) => request(`/tasks/${id}`, { method: "DELETE" }),

  // Events
  listEvents:  () => request("/events"),
  createEvent: (data) => request("/events", { method: "POST", body: JSON.stringify(data) }),
  updateEvent: (id, data) => request(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: "DELETE" }),
};

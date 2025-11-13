// frontend/src/lib/api.js
const JSON_HEADERS = { "Content-Type": "application/json" };

async function jsonFetch(url, opts = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { ...JSON_HEADERS, ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  // --- Auth ---
  async register({ email, name, password }) {
    return jsonFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    });
  },
  async login({ identifier, password }) {
    return jsonFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
  },
  async logout() {
    return jsonFetch("/api/auth/logout", { method: "POST" });
  },
  async me() {
    return jsonFetch("/api/me", { method: "GET" });
  },

  // --- Settings ---
  async getSettings() {
    return jsonFetch("/api/settings");
  },
  async saveSettings(payload) {
    return jsonFetch("/api/settings", { method: "PUT", body: JSON.stringify(payload) });
  },

  // --- Tasks ---
  async listTasks() { return jsonFetch("/api/tasks"); },
  async createTask(t) { return jsonFetch("/api/tasks", { method: "POST", body: JSON.stringify(t) }); },
  async updateTask(id, patch) {
    return jsonFetch(`/api/tasks/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(patch) });
  },
  async removeTask(id) {
    return jsonFetch(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
  // ✅ Alias for code paths that call deleteTask()
  async deleteTask(id) {
    return jsonFetch(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  // --- Events ---
  async listEvents() { return jsonFetch("/api/events"); },
  async createEvent(e) { return jsonFetch("/api/events", { method: "POST", body: JSON.stringify(e) }); },
  async updateEvent(id, patch) {
    return jsonFetch(`/api/events/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(patch) });
  },
  async removeEvent(id) { return jsonFetch(`/api/events/${encodeURIComponent(id)}`, { method: "DELETE" }); },
};

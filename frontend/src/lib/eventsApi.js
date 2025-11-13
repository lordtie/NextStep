// frontend/src/lib/eventsApi.js
// Tries /api/events; falls back to localStorage for instant dev.

const STORAGE_KEY = "nextstep.events.v1";

// Helper: try a fetch, but don't throw if the route doesn't exist.
async function tryFetch(url, options) {
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      // If 404, treat as "no backend"
      if (res.status === 404) return null;
      // For other errors, surface them
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    return null;
  }
}

function loadLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveLocal(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const eventsApi = {
  async list() {
    const api = await tryFetch("/api/events", { method: "GET" });
    if (api) return api;

    // fallback
    return loadLocal();
  },

  async create(event) {
    const api = await tryFetch("/api/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
    if (api) return api;

    // fallback
    const all = loadLocal();
    const e = { id: uid(), ...event };
    all.push(e);
    saveLocal(all);
    return e;
  },

  async update(id, patch) {
    const api = await tryFetch(`/api/events/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    if (api) return api;

    // fallback
    const all = loadLocal();
    const idx = all.findIndex((e) => e.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...patch };
      saveLocal(all);
      return all[idx];
    }
    return null;
  },

  async remove(id) {
    const api = await tryFetch(`/api/events/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (api) return api;

    // fallback
    const all = loadLocal().filter((e) => e.id !== id);
    saveLocal(all);
    return { ok: true };
  },
};

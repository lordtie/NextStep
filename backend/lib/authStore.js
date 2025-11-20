// backend/lib/authStore.js
// Minimal user store with password hashing (bcryptjs), kept in backend/users.json
// Also manages per-user files at backend/users/<username>.json

const path = require("path");
const fsp = require("fs").promises;
const bcrypt = require("bcryptjs");

const USERS_DIR = path.join(__dirname, "..", "users");
const USERS_INDEX = path.join(__dirname, "..", "users.json");

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true }).catch(() => {});
}

async function readUsersIndex() {
  try {
    const raw = await fsp.readFile(USERS_INDEX, "utf8");
    const data = JSON.parse(raw || "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

async function writeUsersIndex(indexObj) {
  await fsp.writeFile(USERS_INDEX, JSON.stringify(indexObj || {}, null, 2), "utf8");
}

function slugifyName(name = "") {
  const base = String(name).trim().toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "user";
}

async function ensureUniqueUsername(base, idx) {
  let u = slugifyName(base);
  if (!idx[u]) return u;
  let n = 2;
  while (idx[`${u}-${n}`]) n++;
  return `${u}-${n}`;
}

async function readUserFile(username) {
  await ensureDir(USERS_DIR);
  const file = path.join(USERS_DIR, `${username}.json`);
  try {
    const raw = await fsp.readFile(file, "utf8");
    const data = JSON.parse(raw || "{}");
    if (!data.settings) {
      data.settings = { name: username, email: "", timezone: "America/Chicago", theme: "dark" };
    } else {
      if (typeof data.settings.email !== "string") data.settings.email = "";
      if (typeof data.settings.timezone !== "string") data.settings.timezone = "America/Chicago";
      if (typeof data.settings.theme !== "string") data.settings.theme = "dark";
    }
    if (!Array.isArray(data.events)) data.events = [];
    if (!Array.isArray(data.tasks)) data.tasks = [];
    return { file, data };
  } catch {
    const data = {
      settings: { name: username, email: "", timezone: "America/Chicago", theme: "dark" },
      events: [],
      tasks: [],
      notes: [],
    };
    await fsp.writeFile(file, JSON.stringify(data, null, 2), "utf8");
    return { file, data };
  }
}

async function writeUserFile(file, data) {
  await fsp.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

// ---------- Public API ----------
async function register({ email, name, password }) {
  if (!email || !password) throw new Error("email and password are required");
  const idx = await readUsersIndex();

  // Ensure uniqueness by email
  for (const u of Object.keys(idx)) {
    if ((idx[u].email || "").toLowerCase() === String(email).toLowerCase()) {
      throw new Error("Email already in use");
    }
  }

  const base = name?.trim() || email.split("@")[0] || "user";
  const username = await ensureUniqueUsername(base, idx);
  const passwordHash = await bcrypt.hash(String(password), 10);

  idx[username] = {
    username,
    name: name?.trim() || username,
    email: String(email),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  await writeUsersIndex(idx);

  // Ensure user file exists and sync settings
  const { file, data } = await readUserFile(username);
  data.settings.name = idx[username].name;
  data.settings.email = idx[username].email;
  await writeUserFile(file, data);

  return { username, name: idx[username].name, email: idx[username].email };
}

async function login({ identifier, password }) {
  if (!identifier || !password) throw new Error("identifier and password are required");
  const idx = await readUsersIndex();
  // Find by email OR username (case-insensitive for email)
  let hitUsername = null;
  for (const u of Object.keys(idx)) {
    const rec = idx[u];
    if (
      u === identifier ||
      (rec.email && rec.email.toLowerCase() === String(identifier).toLowerCase())
    ) {
      hitUsername = u;
      break;
    }
  }
  if (!hitUsername) throw new Error("Invalid credentials");

  const rec = idx[hitUsername];
  const ok = await bcrypt.compare(String(password), rec.passwordHash || "");
  if (!ok) throw new Error("Invalid credentials");

  // Ensure user file exists and settings are synced
  const { file, data } = await readUserFile(hitUsername);
  if (data.settings.name !== rec.name || data.settings.email !== rec.email) {
    data.settings.name = rec.name;
    data.settings.email = rec.email;
    await writeUserFile(file, data);
  }

  return { username: rec.username, name: rec.name, email: rec.email };
}

async function getUserByUsername(username) {
  const idx = await readUsersIndex();
  const rec = idx[username];
  if (!rec) return null;
  return { username: rec.username, name: rec.name, email: rec.email };
}

async function updateProfileUsername(oldUsername, newDisplayName) {
  // Called when changing the display name from settings (optional).
  // We *do not* rename usernames automatically anymore to avoid breaking auth.
  // Instead, just update the display name.
  const idx = await readUsersIndex();
  const rec = idx[oldUsername];
  if (!rec) return null;
  rec.name = newDisplayName;
  await writeUsersIndex(idx);

  const { file, data } = await readUserFile(oldUsername);
  data.settings.name = newDisplayName;
  await writeUserFile(file, data);

  return { username: oldUsername, name: newDisplayName, email: rec.email };
}

module.exports = {
  register,
  login,
  getUserByUsername,
  updateProfileUsername,

  // exported for server.js helpers:
  readUserFile,
  writeUserFile,
};

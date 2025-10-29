const express = require("express");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(express.json());

// ✅ Allow requests from your frontend
app.use(
  cors({
    origin: "https://repulsive-goblin-4pq9qrg5p6q354g-3000.app.github.dev", // your frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  req.url = req.url.replace(/\/+/g, '/'); // remove double slashes
  next();
});

app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  next();
});


// Middleware

app.use(bodyParser.json());

// Paths to JSON files
const usersFile = path.join(__dirname, "tempjsons", "users.json");
const tasksFile = path.join(__dirname, "tempjsons", "tasks.json");

// Helper functions to load and save JSON
function loadJSON(file) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "[]");
  }
  const data = fs.readFileSync(file);
  return JSON.parse(data);
}

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ======================
// ====== USERS =========
// ======================

// Register
app.post("/api/register", (req, res) => {
      console.log("Received registration:", req.body);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  let users = loadJSON(usersFile);

  // Check if email exists
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "Email already exists" });
  }
  const newUser = { id: Date.now(), username, email, password };
  users.push(newUser);
  saveJSON(usersFile, users);

  res.json(newUser);
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  const users = loadJSON(usersFile);
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  res.json({ id: user.id, username: user.username, email: user.email });
});

// ======================
// ====== TASKS =========
// ======================

// Get tasks
app.get("/tasks", (req, res) => {
  const tasks = loadJSON(tasksFile);
  res.json(tasks);
});

// Add task
app.post("/tasks", (req, res) => {
  const { title, status, dueDate } = req.body;

  if (!title) return res.status(400).json({ message: "Task title required" });

  const tasks = loadJSON(tasksFile);
  const newTask = { id: Date.now(), title, status: status || "pending", dueDate };
  tasks.push(newTask);
  saveJSON(tasksFile, tasks);

  res.json(newTask);
});

// Update task
app.put("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const { title, status, dueDate } = req.body;

  const tasks = loadJSON(tasksFile);
  const index = tasks.findIndex((t) => t.id === taskId);

  if (index === -1) return res.status(404).json({ message: "Task not found" });

  tasks[index] = { ...tasks[index], title, status, dueDate };
  saveJSON(tasksFile, tasks);

  res.json(tasks[index]);
});

// Delete task
app.delete("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);

  let tasks = loadJSON(tasksFile);
  tasks = tasks.filter((t) => t.id !== taskId);
  saveJSON(tasksFile, tasks);

  res.json({ message: "Task deleted" });
});

// ======================
// ===== START SERVER ===
// ======================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

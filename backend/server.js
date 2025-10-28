const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Folder where JSON files are stored
const dataFolder = path.join(__dirname, 'tempjsons');

// Helper function to load JSON or create empty file
const loadJSON = (filename) => {
  const filePath = path.join(dataFolder, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]'); // create empty array file
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

// Load data
let users = loadJSON('users.json');
let tasks = loadJSON('tasks.json');
let notes = loadJSON('notes.json');

// Helper to save JSON files
const saveJSON = (filename, data) => {
  fs.writeFileSync(path.join(dataFolder, filename), JSON.stringify(data, null, 2));
};

// ----------------------
// User Routes
// ----------------------

// Register
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).send('Email already registered');
  }
  const newUser = { id: Date.now(), username, email, password };
  users.push(newUser);
  saveJSON('users.json', users);
  res.json(newUser);
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(400).send('Invalid credentials');
  res.json(user);
});

// ----------------------
// Task Routes
// ----------------------

// Get tasks for a user
app.get('/api/tasks/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userTasks = tasks.filter(t => t.userId === userId);
  res.json(userTasks);
});

// Add a task
app.post('/api/tasks', (req, res) => {
  const { userId, title, description, dueDate, priority, status } = req.body;
  const newTask = {
    id: Date.now(),
    userId,
    title,
    description,
    dueDate,
    priority: priority || 3,
    status: status || 'pending'
  };
  tasks.push(newTask);
  saveJSON('tasks.json', tasks);
  res.json(newTask);
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) return res.status(404).send('Task not found');
  tasks[taskIndex] = { ...tasks[taskIndex], ...req.body };
  saveJSON('tasks.json', tasks);
  res.json(tasks[taskIndex]);
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  tasks = tasks.filter(t => t.id !== taskId);
  saveJSON('tasks.json', tasks);
  res.json({ message: 'Task deleted' });
});

// ----------------------
app.listen(5000, () => console.log('Server running on port 5000'));

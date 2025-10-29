import React, { useState, useEffect } from "react";
import TaskList from "./components/TaskList";
import AddTaskForm from "./components/AddTaskForm";
import CalendarView from "./components/CalendarView";
import Login from "./components/Login";
import Register from "./components/Register";
import { API_URL } from "./config";

function App() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // Stay logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Load tasks for logged-in user
  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/tasks`.replace(/\/\/+/g, '/').replace('https:/', 'https://'))
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error("Error loading tasks:", err));
  }, [user]);

  // Handlers
  const handleTaskAdded = (newTask) => setTasks([...tasks, newTask]);
  const handleTaskUpdated = (updatedTask) =>
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  const handleTaskDeleted = (deletedId) =>
    setTasks(tasks.filter((t) => t.id !== deletedId));
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Show login or register if no user
  if (!user) {
    return showRegister ? (
      <Register onRegister={setUser} />
    ) : (
      <Login
        onLogin={setUser}
        onShowRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div className="app">
      <h1>NextStep Tasks</h1>
      <p>Welcome, {user.username}!</p>
      <button onClick={handleLogout}>Logout</button>

      <AddTaskForm onTaskAdded={handleTaskAdded} />

      <TaskList
        tasks={tasks}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />

      <CalendarView tasks={tasks} />
    </div>
  );
}

export default App;

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

  // stay logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // initial load for logged-in user
  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setTasks([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/tasks?userId=${encodeURIComponent(user.id)}`);
        if (!res.ok) {
          setTasks([]);
          return;
        }
        const data = await res.json();
        setTasks(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error loading tasks:", e);
        setTasks([]);
      }
    };
    load();
  }, [user]);

  // child callbacks → instant UI updates here (keeps TaskList & Calendar in sync)
  const handleTaskAdded = (createdTask) => {
    setTasks((prev) => [createdTask, ...prev]);
  };
  const handleTaskUpdated = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };
  const handleTaskDeleted = (deletedId) => {
    setTasks((prev) => prev.filter((t) => t.id !== deletedId));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setTasks([]);
  };

  // auth gate
  if (!user) {
    return showRegister ? (
      <Register onRegister={setUser} />
    ) : (
      <Login onLogin={setUser} onShowRegister={() => setShowRegister(true)} />
    );
  }

  return (
    <div className="app">
      <h1>NextStep Tasks</h1>
      <p>Welcome, {user.username}!</p>
      <button onClick={handleLogout}>Logout</button>

      <AddTaskForm onAdd={handleTaskAdded} />

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

import React, { useState } from "react";
import { API_URL } from "../config";
export default function AddTaskForm({ onTaskAdded }) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title) return;
    onTaskAdded({ id: Date.now(), title, status: "pending" });
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit">Add Task</button>
    </form>
  );
}

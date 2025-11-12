import React, { useState } from "react";
import { API_URL } from "../config";

export default function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user?.id) {
      setError("You must be logged in.");
      return;
    }
    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: title.trim(),
          dueDate: dueDate || null,
          notes,
          status: "Not Started",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.message || "Could not create task");
        setSubmitting(false);
        return;
      }

      const created = await res.json();
      // instant UI update through App
      onAdd && onAdd(created);

      // reset form
      setTitle("");
      setDueDate("");
      setNotes("");
    } catch (err) {
      console.error(err);
      setError("Network error creating task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
      <h3 style={{ margin: 0 }}>Add Task</h3>

      <input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={submitting}
        required
      />

      <input
        type="datetime-local"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        disabled={submitting}
      />

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        disabled={submitting}
      />

      <button type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add Task"}
      </button>

      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}

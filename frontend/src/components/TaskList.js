import React, { useMemo, useState } from "react";
import { API_URL } from "../config";

export default function TaskList({ tasks, onTaskUpdated, onTaskDeleted }) {
  if (!Array.isArray(tasks)) return <div>No tasks yet.</div>;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
      {tasks.map((t) => (
        <TaskRow
          key={t.id}
          task={t}
          onTaskUpdated={onTaskUpdated}
          onTaskDeleted={onTaskDeleted}
        />
      ))}
      {tasks.length === 0 && <li>No tasks yet.</li>}
    </ul>
  );
}

function TaskRow({ task, onTaskUpdated, onTaskDeleted }) {
  const user = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    []
  );

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title || "");
  const [notes, setNotes] = useState(task.notes || "");
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [menuOpen, setMenuOpen] = useState(false); // status dropdown

  const currentStatus = task.status || "Not Started";

  const statusColor = {
    "Not Started": "#bbb",
    "In Progress": "#f0ad4e",
    "Completed": "#5cb85c",
  }[currentStatus] || "#bbb";

  const updateTask = async (updates) => {
    if (!user?.id) return;
    const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(task.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...updates }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    onTaskUpdated && onTaskUpdated(updated);
  };

  const deleteTask = async () => {
    if (!user?.id) return;
    const res = await fetch(`${API_URL}/api/tasks/${encodeURIComponent(task.id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) return;
    onTaskDeleted && onTaskDeleted(task.id);
  };

  const saveEdit = async () => {
    await updateTask({ title, notes, dueDate });
    setEditing(false);
  };

  const setStatus = async (newStatus) => {
    setMenuOpen(false);
    if (newStatus === currentStatus) return;
    await updateTask({ status: newStatus });
  };

  return (
    <li
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 10,
        display: "grid",
        gap: 8,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* STATUS CIRCLE */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          title={`Status: ${currentStatus}`}
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "2px solid #999",
            background: statusColor,
            cursor: "pointer",
          }}
        />
        {!editing ? (
          <strong
            style={{
              textDecoration: currentStatus === "Completed" ? "line-through" : "none",
            }}
          >
            {task.title}
          </strong>
        ) : (
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {!editing ? (
            <button onClick={() => setEditing(true)}>Edit</button>
          ) : (
            <>
              <button onClick={saveEdit}>Save</button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </>
          )}
          <button onClick={deleteTask}>Delete</button>
        </div>
      </div>

      {!editing ? (
        task.notes ? <div style={{ fontSize: 13, opacity: 0.85 }}>{task.notes}</div> : null
      ) : (
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      )}

      {!editing ? (
        task.dueDate ? (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Due: {new Date(task.dueDate).toLocaleString()}
          </div>
        ) : null
      ) : (
        <input
          type="datetime-local"
          value={dueDate || ""}
          onChange={(e) => setDueDate(e.target.value)}
        />
      )}

      {/* STATUS DROPDOWN */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 10,
            border: "1px solid #ddd",
            borderRadius: 6,
            background: "white",
            padding: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
            zIndex: 5,
          }}
        >
          {["Not Started", "In Progress", "Completed"].map((opt) => (
            <div
              key={opt}
              onClick={() => setStatus(opt)}
              style={{
                padding: "6px 10px",
                cursor: "pointer",
                background: opt === currentStatus ? "#f5f5f5" : "transparent",
                borderRadius: 4,
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

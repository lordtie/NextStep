import React from "react";
import { API_URL } from "../config";
export default function TaskList({ tasks, onTaskUpdated, onTaskDeleted }) {
  return (
    <div>
      <h2>Tasks</h2>
      {tasks.length === 0 && <p>No tasks yet</p>}
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            {t.title} - {t.status}
            <button
              onClick={() =>
                onTaskUpdated({
                  ...t,
                  status: t.status === "pending" ? "completed" : "pending",
                })
              }
            >
              Toggle Status
            </button>
            <button onClick={() => onTaskDeleted(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

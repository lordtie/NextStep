// frontend/src/pages/Tasks.jsx
import React from "react";
import { api } from "../lib/api";
import DateTimeField from "../components/ui/DateTimeField";

const STATUS_OPTIONS = ["Not Started Yet", "In Progress", "Completed"];

function statusClasses(status) {
  switch (status) {
    case "Done":
      return { dot: "bg-green-500", text: "text-green-700 dark:text-green-300", pill: "bg-green-100 dark:bg-green-900/30" };
    case "In Progress":
      return { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-300", pill: "bg-blue-100 dark:bg-blue-900/30" };
    default:
      return { dot: "bg-slate-400", text: "text-slate-700 dark:text-slate-300", pill: "bg-slate-100 dark:bg-slate-800" };
  }
}

export default function Tasks() {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Add bar
  const [title, setTitle] = React.useState("");
  const [showDue, setShowDue] = React.useState(false);
  const [dueAt, setDueAt] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.listTasks();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    try {
      const created = await api.createTask({
        title: t,
        status: "Open",
        completed: false,
        dueAt: dueAt || null,
      });
      setItems((prev) => [created, ...prev]);
      setTitle("");
      setDueAt(null);
      setShowDue(false);
    } catch (e) {
      setError(e.message || "Failed to add task");
    }
  }

  async function persist(id, patch) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      await api.updateTask(id, patch);
    } catch (e) {
      setError(e.message || "Failed to update task");
      try {
        const data = await api.listTasks();
        setItems(Array.isArray(data) ? data : []);
      } catch {}
    }
  }

  async function removeTask(id) {
    const keep = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      if (api.deleteTask) await api.deleteTask(id);
      else await api.removeTask(id);
    } catch (e) {
      setError(e.message || "Failed to delete task");
      setItems(keep);
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>

      {/* Add bar */}
      <form onSubmit={handleAdd} className="mb-4 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-w-[260px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            placeholder="Add a task…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowDue((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            {showDue ? "Hide due date" : "Add due date"}
          </button>

          <button
            type="submit"
            disabled={!title.trim()}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            Add task
          </button>
        </div>

        {showDue && (
          <div className="mt-3 rounded-md border border-slate-200 p-3 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
            <DateTimeField value={dueAt} onChange={setDueAt} label="Due" compact className="space-y-1" />
          </div>
        )}
      </form>

      {error && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-500">No tasks yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr className="text-left">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2 w-44">Status</th>
                <th className="px-3 py-2 w-56">Due</th>
                <th className="px-3 py-2 w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onPersist={persist}
                  onRemove={removeTask}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onPersist, onRemove }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(task.title);
  const [status, setStatus] = React.useState(task.status || (task.completed ? "Done" : "Open"));
  const [dueAt, setDueAt] = React.useState(task.dueAt || null);

  React.useEffect(() => {
    setVal(task.title);
    setStatus(task.status || (task.completed ? "Done" : "Open"));
    setDueAt(task.dueAt || null);
  }, [task.title, task.status, task.dueAt, task.completed]);

  const prettyDue = React.useMemo(() => {
    if (!task.dueAt) return "";
    const d = new Date(task.dueAt);
    if (isNaN(d.getTime())) return "";
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return fmt.format(d);
  }, [task.dueAt]);

  const styles = statusClasses(task.status || (task.completed ? "Done" : "Open"));

  async function saveEdits() {
    const patch = {
      title: val.trim() || task.title,
      status,
      completed: status === "Done",
      dueAt: dueAt || null,
    };
    await onPersist(task.id, patch);
    setEditing(false);
  }

  return (
    <>
      <tr>
        {/* Title */}
        <td className="px-3 py-2 align-top">
          {editing ? (
            <input
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
            />
          ) : (
            <div className="whitespace-pre-wrap">{task.title}</div>
          )}
        </td>

        {/* Status with colored circle */}
        <td className="px-3 py-2 align-top">
          {editing ? (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <span className={`inline-flex items-center gap-2 rounded-md px-2 py-1 ${styles.pill} ${styles.text}`}>
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${styles.dot}`} />
              {task.status || (task.completed ? "Done" : "Open")}
            </span>
          )}
        </td>

        {/* Due (display only if present; no control here) */}
        <td className="px-3 py-2 align-top">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {prettyDue || <span className="opacity-60">—</span>}
          </div>
        </td>

        {/* Actions */}
        <td className="px-3 py-2 align-top">
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={saveEdits}
                  className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setVal(task.title);
                    setStatus(task.status || (task.completed ? "Done" : "Open"));
                    setDueAt(task.dueAt || null);
                  }}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={() => onRemove(task.id)}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>

      {/* Edit panel (only shows during editing): includes due date picker */}
      {editing && (
        <tr>
          <td colSpan={4} className="px-3 pb-3">
            <div className="mt-2 rounded-md border border-slate-200 p-3 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
              <DateTimeField
                value={dueAt}
                onChange={setDueAt}
                label="Due"
                compact
                className="space-y-1"
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

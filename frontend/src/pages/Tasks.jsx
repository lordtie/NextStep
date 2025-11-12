import React from "react";
import { useLocation } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import DateTimeField from "../components/ui/DateTimeField";
import { api } from "../lib/api";

const statusLabel = {
  todo: "Not Started Yet",
  in_progress: "In Progress",
  done: "Complete",
};
const statusBadge = { todo: "slate", in_progress: "amber", done: "emerald" };

function StatusDot({ status }) {
  const map = {
    todo: "bg-slate-400",
    in_progress: "bg-amber-400",
    done: "bg-emerald-400",
  };
  return <span className={`inline-block h-3 w-3 rounded-full ${map[status] || map.todo}`} />;
}

export default function Tasks() {
  const [items, setItems] = React.useState([]);
  const [title, setTitle] = React.useState("");
  const [dueDate, setDueDate] = React.useState(null); // Date or null
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const [editing, setEditing] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDue, setEditDue] = React.useState(null);
  const [editStatus, setEditStatus] = React.useState("todo");
  const [editNotes, setEditNotes] = React.useState("");

  const titleRef = React.useRef(null);
  const { search } = useLocation();

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.listTasks();
        setItems(data || []);
      } catch (e) {
        setError(e.message || "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("new") === "1" && titleRef.current) titleRef.current.focus();
  }, [search]);

  async function addTask(e) {
    e.preventDefault();
    if (!title.trim()) return;

    // Store due as YYYY-MM-DD (date-only) if provided
    const due = dueDate ? dueDate.toISOString().slice(0, 10) : null;
    const payload = { title: title.trim(), due, status: "todo", notes };

    const tempId = Date.now().toString();
    setItems(prev => [{ id: tempId, ...payload, done: false }, ...prev]);

    try {
      const created = await api.createTask(payload);
      setItems(prev => prev.map(t => (t.id === tempId ? created : t)));
      setTitle(""); setNotes(""); setDueDate(null);
      titleRef.current?.focus();
    } catch (e2) {
      setItems(prev => prev.filter(t => t.id !== tempId));
      alert(e2.message);
    }
  }

  async function toggleDone(id) {
    const task = items.find(t => t.id === id);
    if (!task) return;
    const newStatus = (task.status || "todo") === "done" ? "todo" : "done";
    const updated = { ...task, status: newStatus, done: newStatus === "done" };
    setItems(prev => prev.map(t => (t.id === id ? updated : t)));
    try { await api.updateTask(id, { status: newStatus, done: newStatus === "done" }); }
    catch (e) { setItems(prev => prev.map(t => (t.id === id ? task : t))); alert(e.message); }
  }

  function openEdit(t) {
    setEditing(t);
    setEditTitle(t.title || "");
    setEditDue(t.due ? new Date(`${t.due}T00:00`) : null);
    setEditStatus(t.status || (t.done ? "done" : "todo"));
    setEditNotes(t.notes || "");
  }

  async function saveEdit() {
    const id = editing.id;
    const due = editDue ? editDue.toISOString().slice(0, 10) : null;
    const patch = {
      title: editTitle.trim() || "Untitled",
      due,
      status: editStatus,
      notes: editNotes,
      done: editStatus === "done",
    };
    const before = items;
    setItems(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
    try { await api.updateTask(id, patch); setEditing(null); }
    catch (e) { setItems(before); alert(e.message); }
  }

  async function remove(id) {
    const snap = items;
    setItems(prev => prev.filter(t => t.id !== id));
    try { await api.deleteTask(id); }
    catch (e) { setItems(snap); alert(e.message); }
  }

  const openCount = items.filter(i => (i.status || (i.done ? "done" : "todo")) !== "done").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <div className="text-sm text-slate-500 dark:text-slate-300">
          {loading ? "Loading…" : `${openCount} open / ${items.length} total`}
        </div>
      </div>

      <Card className="mt-6">
        <form onSubmit={addTask} className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              ref={titleRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title…"
            />
            <DateTimeField
              mode="date"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Due date (optional)"
            />
            <Button type="submit" className="sm:justify-self-start">Add</Button>
          </div>

          <div>
            <div className="mb-1 text-sm text-slate-600 dark:text-slate-300">Notes (optional)</div>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 transition focus:border-sky-400 focus-ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Details, links, sub-tasks…"
            />
          </div>
        </form>
        {error && <div className="mt-3 text-sm text-rose-500 dark:text-rose-400">{error}</div>}
      </Card>

      <Card className="mt-4">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {items.map((t) => {
              const st = t.status || (t.done ? "done" : "todo");
              return (
                <li key={t.id} className="flex items-start gap-3 py-3">
                  <StatusDot status={st} />
                  <input
                    type="checkbox"
                    checked={st === "done"}
                    onChange={() => toggleDone(t.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 bg-white text-sky-600 dark:border-slate-600 dark:bg-slate-800"
                    title="Mark complete"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{t.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {t.due ? `Due ${t.due}` : "No due date"}
                    </div>
                    {t.notes && (
                      <div className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {t.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={statusBadge[st] || "slate"}>{statusLabel[st]}</Badge>
                    <Button variant="ghost" onClick={() => openEdit(t)}>Edit</Button>
                    <Button variant="ghost" onClick={() => remove(t.id)}>Remove</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-sm text-slate-600 dark:text-slate-300">Title</div>
            <Input value={editTitle} onChange={e=>setEditTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="mb-1 text-sm text-slate-600 dark:text-slate-300">Due</div>
              <DateTimeField mode="date" value={editDue} onChange={setEditDue} placeholder="Due date" />
            </div>
            <div>
              <div className="mb-1 text-sm text-slate-600 dark:text-slate-300">Status</div>
              <select
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 transition focus:border-sky-400 focus-ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={editStatus}
                onChange={e=>setEditStatus(e.target.value)}
              >
                <option value="todo">Not Started Yet</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Complete</option>
              </select>
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm text-slate-600 dark:text-slate-300">Notes</div>
            <textarea
              rows={5}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 transition focus:border-sky-400 focus-ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
              value={editNotes}
              onChange={e=>setEditNotes(e.target.value)}
              placeholder="Details, links, sub-tasks…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

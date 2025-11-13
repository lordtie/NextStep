// frontend/src/components/calendar/EventDialog.jsx
import React from "react";

export default function EventDialog({
  open,
  initial,
  onClose,
  onSave,
  onDelete,
}) {
  const [title, setTitle] = React.useState(initial?.title || "");
  const [location, setLocation] = React.useState(initial?.location || "");
  const [description, setDescription] = React.useState(initial?.description || "");
  const [start, setStart] = React.useState(toLocalInput(initial?.start || new Date()));
  const [end, setEnd] = React.useState(toLocalInput(initial?.end || addHour(new Date())));

  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setLocation(initial?.location || "");
      setDescription(initial?.description || "");
      setStart(toLocalInput(initial?.start || new Date()));
      setEnd(toLocalInput(initial?.end || addHour(new Date())));
    }
  }, [open, initial]);

  function handleSubmit(e) {
    e.preventDefault();
    const evt = {
      ...(initial?.id ? { id: initial.id } : {}),
      title: title.trim() || "Untitled event",
      location: location.trim(),
      description: description.trim(),
      start: new Date(start),
      end: new Date(end),
    };
    onSave?.(evt);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold mb-4">{initial?.id ? "Edit event" : "Create event"}</h2>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Title</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Start</span>
              <input
                type="datetime-local"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">End</span>
              <input
                type="datetime-local"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Location</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add a location"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Description</span>
            <textarea
              rows={3}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details"
            />
          </label>

          <div className="mt-2 flex items-center justify-between">
            {initial?.id ? (
              <button
                type="button"
                className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-800/40 dark:text-red-300 dark:hover:bg-red-900/30"
                onClick={() => onDelete?.(initial.id)}
              >
                Delete
              </button>
            ) : <span />}

            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function toLocalInput(dt) {
  const d = typeof dt === "string" || typeof dt === "number" ? new Date(dt) : dt;
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function addHour(dt) {
  const d = new Date(dt);
  d.setHours(d.getHours() + 1);
  return d;
}

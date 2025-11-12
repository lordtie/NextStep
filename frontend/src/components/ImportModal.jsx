import React from "react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { api } from "../lib/api";

export default function ImportModal({ open, onClose, onImported }) {
  const [fileName, setFileName] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef(null);

  async function handleImport(e) {
    e.preventDefault();
    setError("");
    const file = inputRef.current?.files?.[0];
    if (!file) { setError("Choose a JSON file."); return; }
    try {
      setBusy(true);
      const text = await file.text();
      const data = JSON.parse(text);

      const addedTasks = [];
      const addedEvents = [];

      if (Array.isArray(data.tasks)) {
        for (const t of data.tasks) {
          const payload = {
            title: t.title || "Untitled",
            due: t.due || null,
            status: t.status || (t.done ? "done" : "todo"),
            notes: t.notes || "",
            done: t.status ? t.status === "done" : !!t.done,
            priority: t.priority || "normal",
          };
          const created = await api.createTask(payload);
          addedTasks.push(created);
        }
      }
      if (Array.isArray(data.events)) {
        for (const ev of data.events) {
          const payload = {
            title: ev.title || "Untitled",
            when: ev.when || "",
            where: ev.where || null,
          };
          const created = await api.createEvent(payload);
          addedEvents.push(created);
        }
      }

      onImported && onImported({ tasks: addedTasks, events: addedEvents });
      onClose && onClose();
    } catch (err) {
      setError(err.message || "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import data"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleImport} disabled={busy}>
            {busy ? "Importing…" : "Import"}
          </Button>
        </>
      }
    >
      <form onSubmit={handleImport} className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-100 hover:file:bg-slate-700"
        />
        {fileName && <div className="text-xs text-slate-400">Selected: {fileName}</div>}
        <p className="text-xs text-slate-400">
          Expected JSON: {"{ tasks: [...], events: [...] }"} — unknown fields are ignored.
        </p>
        {error && <div className="text-sm text-rose-400">{error}</div>}
      </form>
    </Modal>
  );
}

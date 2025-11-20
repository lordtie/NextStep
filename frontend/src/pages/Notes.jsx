import React from "react";
import { notesApi } from "../lib/notesApi.js";

export default function Notespage() {
  const [notes, setNotes] = React.useState([]);

  const [activeId, setActiveID] = React.useState("1");
  const activeNote = notes.find((n) => n.id === activeId) || null;
  
React.useEffect(() => {
    async function load() {
      const data = await notesApi.list();
      setNotes(data);

      if (data.length > 0) {
        setActiveID(data[0].id);
      }
    }
    load();
  },
  []);

//Handlers

const saveTimeout = React.useRef(null);

function saveToBackend(id, patch) {
  clearTimeout(saveTimeout.current);
  saveTimeout.current = setTimeout(async () => {
    notesApi.update(id, patch);
  }, 100);
}

function handleTitleChange(e) {
  const value = e.target.value;

  setNotes((prev) =>
    prev.map((note) =>
      note.id === activeId
        ? { ...note, title: value, updatedAt: new Date().toISOString() }
        : note
    )
  );

  saveToBackend(activeId, { title: value });
}

function handleBodyChange(e) {
  const value = e.target.value;

  setNotes((prev) =>
    prev.map((note) =>
      note.id === activeId
        ? { ...note, body: value, updatedAt: new Date().toISOString() }
        : note
    )
  );

  saveToBackend(activeId, { body: value });
}

async function handleNewNote() {
  const res = await notesApi.create({
    title: "",
    body: "",
  });

  setNotes((prev) => [res, ...prev]);
  setActiveID(res.id);
}

async function handleDeleteNote() {
  if (!activeNote) return;
  if (!window.confirm("Delete this note?")) return;

  await notesApi.remove(activeId);

  setNotes((prev) => prev.filter((n) => n.id !== activeId));

  // Pick next note
  const remaining = notes.filter((n) => n.id !== activeId);
  setActiveID(remaining.length > 0 ? remaining[0].id : null);
}

//page return
  return (
  <div className="p-4 h-full flex flex-col">

    {/* Header */}
    <div className="mb-3 flex items-center justify-between">
      <h1 className="text-xl font font-semibold">Notes</h1>
      <button
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        onClick={handleNewNote}
      > Create Note</button>
      <button
        className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        onClick={handleDeleteNote}
      > Delete Note</button>
        </div>

        {/* Main content area */}
        <aside className="shrink-0 border-r bg-slate-50/60 dark:bg-slate-900/40 dark:border-slate-800 h-[600px] overflow-y-hidden">
        <div className="flex-1 flex min-h-0">
        {/* Left: notes list */}
        <aside className="w-72 h-[600px] shrink-0 border-r bg-slate-50/60 dark:bg-slate-900/40 dark:border-slate-800 overflow-y-scroll [--scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        
        {notes.map((note) => {
          const isActive = note.id === activeId;
          return (
            <button 
              key={note.id}
              type="button"
              onClick={() => setActiveID(note.id)}
              className={
                "w-full text-left px-3 py-2 text-sm transition-colors border-t border-slate-200/70 dark:border-slate-800" +
                (isActive
                  ? "bg-sky-100 dark:bg-sky-900/40"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800")
              }
              >
                <div className="text-sm font-medium truncate">
                  {note.title || "Untitled Note"}
                </div>
                <div className="text-xs text-slate-500 line-clamp-2">
                  {note.body || "Empty note"}
                </div>
              </button>
        );
        })}
        </aside>

          {/* Right: editor area*/}
          <section className="flex-1 flex flex-col min-w-0 ">
            {activeNote ? (
            <>
              <div className="border-b px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
                Last updated:{" "}
                {new Date(activeNote.updatedAt).toLocaleString()}
              </div>
              <div className="flex-1 p-4">
                {/* Placeholder for now – we'll turn this into real inputs next */}
                <div className="flex-1 p-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={handleTitleChange}
                    placeholder="Title"
                    className="w-full text-lg font-semibold bg-transparent outline-none border-b border-slate-200 pb-1 dark:border-slate-700"
                  />
                  <textarea
                    value={activeNote.body}
                    onChange={handleBodyChange}
                    placeholder="Start writing  here..."
                    className="h-[460px] w-full resize-none bg-transparent outline-none text-sm leading-relaxed overflow-y-scroll [--scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              No note selected
            </div>
          )}
          </section>
    </div>
    
        </aside>
        
  </div>
  )
}


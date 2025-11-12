import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

const popperBase =
  "absolute z-50 mt-1 rounded-xl border bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900";

function TimeSelect({ value, onChange, stepMinutes = 15 }) {
  // value: string "HH:MM"
  const options = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      options.push(`${hh}:${mm}`);
    }
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 transition focus:border-sky-400 focus-ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

/**
 * Props:
 *  mode: "date" | "datetime"
 *  value: Date | null
 *  onChange: (Date|null) => void
 *  placeholder?: string
 */
export default function DateTimeField({ mode = "date", value, onChange, placeholder = "" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const [time, setTime] = React.useState(value ? format(value, "HH:mm") : "09:00");

  function setDay(day) {
    if (!day) return;
    if (mode === "date") {
      // midnight local
      const d = new Date(day);
      d.setHours(0, 0, 0, 0);
      onChange(d);
      setOpen(false);
      return;
    }
    const [hh, mm] = time.split(":").map((x) => parseInt(x, 10));
    const d = new Date(day);
    d.setHours(hh, mm, 0, 0);
    onChange(d);
  }

  function applyTime(t) {
    setTime(t);
    if (!value) return;
    const [hh, mm] = t.split(":").map((x) => parseInt(x, 10));
    const d = new Date(value);
    d.setHours(hh, mm, 0, 0);
    onChange(d);
  }

  const display = value
    ? (mode === "date" ? format(value, "PPP") : `${format(value, "PP")} at ${format(value, "p")}`)
    : "";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-slate-900 transition hover:bg-slate-50 focus:border-sky-400 focus-ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <span className={display ? "" : "text-slate-400"}>
          {display || placeholder}
        </span>
        <svg className="h-4 w-4 opacity-60" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
      </button>

      {open && (
        <div className={`${popperBase} border-slate-200 dark:border-slate-700`}>
          <DayPicker
            mode="single"
            selected={value ?? undefined}
            onSelect={setDay}
            weekStartsOn={1}
            className="rdp"
            styles={{
              caption: { color: "inherit" },
              head_cell: { color: "inherit" },
              day: { color: "inherit" },
            }}
          />
          {mode === "datetime" && (
            <TimeSelect value={time} onChange={applyTime} />
          )}
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

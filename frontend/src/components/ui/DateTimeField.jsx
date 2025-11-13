// frontend/src/components/DateTimeField.jsx
import React from "react";

/**
 * Props:
 *  - value: ISO string | Date | null
 *  - onChange: (isoStringOrNull) => void
 *  - label?: string
 *  - required?: boolean
 *  - min?: string (ISO) | Date
 *  - max?: string (ISO) | Date
 *  - className?: string (wrapper div)
 *  - compact?: boolean (tighter layout)
 *
 * Behavior:
 *  - Renders native <input type="date"> and <input type="time">
 *  - Quick picks: Now (only) + Clear
 *  - Emits ISO (UTC) from local date+time (or null)
 *  - Shows a friendly preview line (local timezone)
 */
export default function DateTimeField({
  value,
  onChange,
  label = "Date & time",
  required = false,
  min,
  max,
  className = "",
  compact = false,
}) {
  const [dateStr, setDateStr] = React.useState("");
  const [timeStr, setTimeStr] = React.useState("");

  // parse incoming value to local date+time strings
  React.useEffect(() => {
    if (!value) {
      setDateStr("");
      setTimeStr("");
      return;
    }
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) {
      setDateStr("");
      setTimeStr("");
      return;
    }
    setDateStr(formatDateLocal(d));
    setTimeStr(formatTimeLocal(d));
  }, [value]);

  function emit(dateString, timeString) {
    if (!dateString || !timeString) {
      onChange?.(null);
      return;
    }
    const iso = toIsoFromLocal(dateString, timeString);
    onChange?.(iso);
  }

  // Min/max handlers (accept ISO/Date props; convert to input-friendly strings)
  const minDateStr = React.useMemo(() => (min ? toInputDate(min) : undefined), [min]);
  const maxDateStr = React.useMemo(() => (max ? toInputDate(max) : undefined), [max]);

  // Friendly preview
  const pretty = React.useMemo(() => {
    if (!dateStr || !timeStr) return "";
    const d = fromLocal(dateStr, timeStr);
    if (!d) return "";
    const fmt = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return fmt.format(d);
  }, [dateStr, timeStr]);

  // Quick picks
  function setFromDate(d) {
    if (!d || isNaN(d.getTime())) return;
    const ds = formatDateLocal(d);
    const ts = formatTimeLocal(d);
    setDateStr(ds);
    setTimeStr(ts);
    emit(ds, ts);
  }
  function handleNow() {
    setFromDate(new Date());
  }
  function handleClear() {
    setDateStr("");
    setTimeStr("");
    onChange?.(null);
  }

  // Render
  return (
    <div className={className || ""}>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <div className={`flex gap-2 ${compact ? "" : "mb-2"} flex-wrap`}>
        <input
          type="date"
          value={dateStr}
          onChange={(e) => {
            const v = e.target.value;
            setDateStr(v);
            emit(v, timeStr);
          }}
          required={required}
          min={minDateStr}
          max={maxDateStr}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <input
          type="time"
          value={timeStr}
          onChange={(e) => {
            const v = e.target.value;
            setTimeStr(v);
            emit(dateStr, v);
          }}
          required={required}
          step={60} /* minute resolution */
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      {/* Quick picks: Now + Clear only */}
      <div className={`flex flex-wrap gap-2 ${compact ? "mb-2" : "mb-3"}`}>
        <Quick onClick={handleNow} label="Now" />
        <Quick onClick={handleClear} label="Clear" variant="secondary" />
      </div>

      {/* Preview */}
      {pretty ? (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {pretty} ({tzAbbrev()})
        </div>
      ) : (
        <div className="text-xs text-slate-400">No date/time selected</div>
      )}
    </div>
  );
}

/* ---------- small subcomponents & utils ---------- */

function Quick({ onClick, label, variant = "primary" }) {
  const base =
    "rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors active:translate-y-[1px]";
  const styles =
    variant === "primary"
      ? "border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900";
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {label}
    </button>
  );
}

function toIsoFromLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const [hh, mm] = timeStr.split(":").map((n) => parseInt(n, 10));
  const local = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  if (isNaN(local.getTime())) return null;
  return local.toISOString();
}

function fromLocal(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const [hh, mm] = timeStr.split(":").map((n) => parseInt(n, 10));
  const local = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  return isNaN(local.getTime()) ? null : local;
}

function toInputDate(x) {
  const d = x instanceof Date ? x : new Date(x);
  if (isNaN(d.getTime())) return undefined;
  return formatDateLocal(d);
}

function formatDateLocal(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTimeLocal(d) {
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
}

function tzAbbrev() {
  try {
    const p = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
      .formatToParts(new Date())
      .find((x) => x.type === "timeZoneName");
    return p?.value || "local time";
  } catch {
    return "local time";
  }
}

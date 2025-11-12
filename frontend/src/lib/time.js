// Simple helpers to format an ISO instant in a chosen IANA timezone.
export function formatInTZ(isoString, timeZone, opts = {}) {
  if (!isoString) return "";
  const d = new Date(isoString); // treat stored ISO as UTC instant
  try {
    const fmt = new Intl.DateTimeFormat(undefined, {
      timeZone,
      dateStyle: opts.dateStyle || "medium",
      timeStyle: opts.timeStyle || "short",
    });
    return fmt.format(d);
  } catch {
    return d.toLocaleString(); // fallback
  }
}

// Convert a <input type="datetime-local"> value to UTC ISO
export function localDatetimeToISO(localValue) {
  // localValue like "2025-11-15T14:30"
  if (!localValue) return null;
  const d = new Date(localValue);
  return d.toISOString(); // stores as UTC instant
}

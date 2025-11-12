import React from "react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import DateTimeField from "../components/ui/DateTimeField";
import { api } from "../lib/api";
import { formatInTZ } from "../lib/time";

export default function CalendarPage() {
  const [events, setEvents] = React.useState([]);
  const [title, setTitle] = React.useState("");
  const [when, setWhen] = React.useState(null); // Date
  const [where, setWhere] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [settings, setSettings] = React.useState({ timezone: "America/Chicago" });

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [s, e] = await Promise.all([api.getSettings(), api.listEvents()]);
        setSettings(s || { timezone: "America/Chicago" });
        setEvents(e || []);
      } catch (err) {
        setError(err.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function addEvent(e) {
    e.preventDefault();
    if (!title.trim() || !when) return;
    // store as UTC ISO
    const iso = new Date(when).toISOString();
    const payload = { title: title.trim(), when: iso, where: where.trim() || null };

    const tempId = Date.now().toString();
    setEvents(prev => [{ id: tempId, ...payload }, ...prev]);

    try {
      const created = await api.createEvent(payload);
      setEvents(prev => prev.map(ev => (ev.id === tempId ? created : ev)));
      setTitle(""); setWhen(null); setWhere("");
    } catch (e2) {
      setEvents(prev => prev.filter(ev => ev.id !== tempId));
      alert(e2.message);
    }
  }

  async function remove(id) {
    const snap = events;
    setEvents(prev => prev.filter(ev => ev.id !== id));
    try { await api.deleteEvent(id); }
    catch (e) { setEvents(snap); alert(e.message); }
  }

  const tz = settings?.timezone || "America/Chicago";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>

      <Card className="mt-6">
        <form onSubmit={addEvent} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title…" />
          <DateTimeField mode="datetime" value={when} onChange={setWhen} placeholder="Pick date & time" />
          <Input value={where} onChange={e => setWhere(e.target.value)} placeholder="Where (optional)" />
          <Button type="submit">Add Event</Button>
        </form>
        {error && <div className="mt-3 text-sm text-rose-500 dark:text-rose-400">{error}</div>}
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Times shown in: {tz}</div>
      </Card>

      <Card className="mt-4">
        {loading ? (
          <div>Loading…</div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {events.map(e => (
              <li key={e.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {formatInTZ(e.when, tz)}{e.where ? ` • ${e.where}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="indigo">event</Badge>
                  <Button variant="ghost" onClick={() => remove(e.id)}>Remove</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

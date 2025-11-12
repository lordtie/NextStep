import React from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();
  const [tasks, setTasks] = React.useState([]);
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [t, e] = await Promise.all([api.listTasks(), api.listEvents()]);
        setTasks(t || []);
        setEvents(e || []);
      } catch (err) {
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const open = tasks.filter(t => (t.status || (t.done ? "done" : "todo")) !== "done").length;
  const todayISO = new Date().toISOString().slice(0,10);
  const todayEvents = events.filter(ev => (ev.when || "").slice(0,10) === todayISO);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">
            {loading ? "Loading…" : error ? error : "Overview of your tasks and events."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => nav("/tasks?new=1")}>New Task</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-sm text-slate-300">Open Tasks</div>
          <div className="mt-1 text-2xl font-semibold">{loading ? "…" : open}</div>
          <Badge className="mt-3">{open ? "On it" : "All clear"}</Badge>
        </Card>
        <Card>
          <div className="text-sm text-slate-300">All Tasks</div>
          <div className="mt-1 text-2xl font-semibold">{loading ? "…" : tasks.length}</div>
          <Badge color="indigo" className="mt-3">total</Badge>
        </Card>
        <Card>
          <div className="text-sm text-slate-300">Events</div>
          <div className="mt-1 text-2xl font-semibold">{loading ? "…" : events.length}</div>
          <Badge color="sky" className="mt-3">calendar</Badge>
        </Card>
        <Card>
          <div className="text-sm text-slate-300">Today</div>
          <div className="mt-1 text-2xl font-semibold">{loading ? "…" : todayEvents.length}</div>
          <Badge color="emerald" className="mt-3">today</Badge>
        </Card>
      </div>
    </div>
  );
}

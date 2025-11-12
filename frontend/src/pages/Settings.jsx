import React from "react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ImportModal from "../components/ImportModal";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";

const ZONES = [
  "America/Los_Angeles","America/Denver","America/Chicago","America/New_York",
  "America/Phoenix","America/Anchorage","Pacific/Honolulu",
  "Europe/London","Europe/Paris","Europe/Berlin",
  "Asia/Tokyo","Asia/Shanghai","Asia/Kolkata","Australia/Sydney",
];

export default function Settings() {
  const { refresh } = useAuth();
  const [name, setName] = React.useState("");
  const [tz, setTz] = React.useState("America/Chicago");
  const [theme, setTheme] = React.useState("dark");
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState("");
  const [importOpen, setImportOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const s = await api.getSettings();
        setName(s?.name || "");
        setTz(s?.timezone || "America/Chicago");
        setTheme(s?.theme || "dark");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e) {
    e?.preventDefault?.();
    setMsg("");
    try {
      const res = await api.saveSettings({ name, timezone: tz, theme });
      // Apply theme instantly
      const html = document.documentElement;
      if ((res?.settings?.theme || theme) === "dark") {
        html.classList.add("dark"); html.classList.remove("light");
      } else {
        html.classList.remove("dark"); html.classList.add("light");
      }
      localStorage.setItem("theme", res?.settings?.theme || theme);
      // Refresh auth so Sidebar shows new name immediately
      await refresh();
      setMsg("Saved ✓");
    } catch (e2) {
      setMsg(e2.message);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card className="mt-6">
        <form onSubmit={save} className="grid grid-cols-1 gap-4 sm:max-w-xl">
          <label className="space-y-1">
            <span className="text-sm text-slate-600 dark:text-slate-300">Display name (updates your account file)</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-slate-600 dark:text-slate-300">Theme</span>
              <select
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-400 focus-ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm text-slate-600 dark:text-slate-300">Time zone</span>
              <select
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-sky-400 focus-ring dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
              >
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </label>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button type="submit" disabled={loading} onClick={save}>Save</Button>
            {msg && <span className="text-sm text-slate-600 dark:text-slate-300">{msg}</span>}
          </div>
        </form>
      </Card>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">Import data</div>
          <Button variant="secondary" onClick={() => setImportOpen(true)}>Open importer</Button>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Import tasks and events from a JSON file.
        </p>
      </Card>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={() => {}} />
    </div>
  );
}

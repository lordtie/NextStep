// frontend/src/pages/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import "../styles/forms.css";

export default function LoginPage() {
  const nav = useNavigate();
  const { setUser, refresh } = useAuth();

  const [mode, setMode] = React.useState("login"); // 'login' | 'register'
  const [identifier, setIdentifier] = React.useState(""); // login
  const [email, setEmail] = React.useState("");           // register
  const [name, setName] = React.useState("");             // register
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const payload = { identifier: identifier.trim(), password };
        if (!payload.identifier || !payload.password) {
          throw new Error("Please fill in all fields.");
        }
        await api.login(payload);
      } else {
        const payload = { email: email.trim(), name: name.trim(), password };
        if (!payload.email || !payload.name || !payload.password) {
          throw new Error("Please fill in all fields.");
        }
        await api.register(payload);
      }

      // 1) Hydrate user from /api/me so sidebar & app get the session
      const me = await api.me();
      if (!me?.user) throw new Error("Login succeeded but user data was missing.");
      setUser?.(me.user);

      // 2) Optionally refresh other app state
      await refresh?.();

      // 3) Redirect to dashboard/home
      nav("/", { replace: true });
    } catch (err) {
      console.error("Auth error:", err);
      setError(err?.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold mb-4">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>

      <form onSubmit={handleSubmit} className="grid gap-3">
        {mode === "login" ? (
          <label className="grid gap-1">
            <span className="text-sm font-medium">Email or username</span>
            <input
              className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or your-username"
              autoComplete="username"
              required
            />
          </label>
        ) : (
          <>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Email</span>
              <input
                className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                type="email"
                required
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Display name</span>
              <input
                className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </label>
          </>
        )}

        <label className="grid gap-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            className="rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={6}
          />
        </label>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          className="text-sm text-blue-600 underline underline-offset-2 justify-self-start"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
            setPassword("");
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}

import React from "react";
import { api } from "../lib/api";

const AuthCtx = React.createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(undefined); // undefined = loading; null = signed out

  const loadMe = React.useCallback(async () => {
    try { setUser(await api.me()); }
    catch { setUser(null); }
  }, []);

  React.useEffect(() => { loadMe(); }, [loadMe]);

  const value = React.useMemo(() => ({
    user,
    loading: user === undefined,
    async login(email, password) {
      const u = await api.login({ email, password });
      setUser(u);
    },
    async register(name, email, password) {
      const u = await api.register({ name, email, password });
      setUser(u);
    },
    async logout() {
      await api.logout();
      setUser(null);
    },
    async refresh() { await loadMe(); }, // <--- NEW: allow components to refresh user info
  }), [user, loadMe]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

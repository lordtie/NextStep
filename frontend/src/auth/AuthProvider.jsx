// frontend/src/auth/AuthProvider.jsx
import React from "react";
import { api } from "../lib/api";

const AuthContext = React.createContext({
  user: null,
  setUser: () => {},
  loading: true,
  error: null,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const refresh = React.useCallback(async () => {
    try {
      setError(null);
      const me = await api.me();
      setUser(me.user || null);
    } catch (e) {
      // Not logged in or error -> clear user
      setUser(null);
      setError(e?.message || "Not authenticated");
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = React.useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // Hydrate on first mount
  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const value = React.useMemo(
    () => ({ user, setUser, loading, error, refresh, logout }),
    [user, loading, error, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return React.useContext(AuthContext);
}

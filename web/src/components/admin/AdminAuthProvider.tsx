"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const TOKEN_KEY = "crm_token";

type AdminAuthValue = {
  token: string | null;
  mounted: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthValue>({
  token: null,
  mounted: false,
  login: async () => "auth provider is not mounted",
  logout: () => {},
});

// Single shared auth state for the whole /admin tree. The pages themselves are
// also behind server-side HTTP Basic auth (middleware) and every API route
// re-verifies the Bearer session token (requireAuth); this gate only controls
// which surface renders in the browser and never the security decision.
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      setToken(localStorage.getItem(TOKEN_KEY));
    } catch {
      setToken(null);
    }
    setMounted(true);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && data.token) {
        try {
          localStorage.setItem(TOKEN_KEY, data.token);
        } catch {
          /* storage unavailable — token still usable for this session */
        }
        setToken(data.token);
        return null;
      }
      return (data.error as string) || "Login failed";
    } catch {
      return "Unable to reach authentication service";
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ token, mounted, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  return useContext(AdminAuthContext);
}
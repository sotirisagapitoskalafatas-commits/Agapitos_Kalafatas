"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type AdminAuthValue = {
  authenticated: boolean;
  mounted: boolean;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthValue>({
  authenticated: false,
  mounted: false,
  logout: async () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;

        const valid = response.ok && data.authenticated === true;
        setAuthenticated(valid);
        setMounted(true);

        if (!valid) {
          const next = window.location.pathname + window.location.search;
          window.location.replace(`/auth/login?next=${encodeURIComponent(next)}`);
        }
      } catch {
        if (cancelled) return;
        setAuthenticated(false);
        setMounted(true);
        const next = window.location.pathname + window.location.search;
        window.location.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      }
    }

    // Remove any previous JavaScript-readable bearer token left by the old
    // authentication implementation. The new session lives only in an
    // HttpOnly cookie and is never exposed to client JavaScript.
    try {
      localStorage.removeItem("crm_token");
    } catch {
      /* storage may be unavailable */
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      // Redirect regardless; the server-side session expires after 12 hours.
    } finally {
      setAuthenticated(false);
      try {
        localStorage.removeItem("crm_token");
      } catch {
        /* ignore */
      }
      window.location.assign("/auth/login");
    }
  }, []);

  return (
    <AdminAuthContext.Provider value={{ authenticated, mounted, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthValue {
  return useContext(AdminAuthContext);
}

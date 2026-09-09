"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Atlas Command Center finish: "warm" = 2a warm paper, "night" = 2b night console.
// Stored per browser so the user's chosen finish sticks across the shell + CRM.
export type AtlasFinish = "warm" | "night";

const STORAGE_KEY = "atlas_finish";

type AtlasThemeValue = {
  finish: AtlasFinish;
  setFinish: (f: AtlasFinish) => void;
  toggle: () => void;
};

const AtlasThemeContext = createContext<AtlasThemeValue | null>(null);

export function AtlasThemeProvider({ children }: { children: ReactNode }) {
  const [finish, setFinish] = useState<AtlasFinish>("warm");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "warm" || raw === "night") setFinish(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const apply = (f: AtlasFinish) => {
    setFinish(f);
    try {
      localStorage.setItem(STORAGE_KEY, f);
    } catch {
      /* ignore */
    }
  };

  const toggle = () => apply(finish === "warm" ? "night" : "warm");

  return (
    <AtlasThemeContext.Provider value={{ finish, setFinish: apply, toggle }}>
      {children}
    </AtlasThemeContext.Provider>
  );
}

export function useAtlasTheme(): AtlasThemeValue {
  const ctx = useContext(AtlasThemeContext);
  if (!ctx) throw new Error("useAtlasTheme must be used inside <AtlasThemeProvider>");
  return ctx;
}
"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// The workspace chrome can change independently from the always-light content area.
export type AtlasFinish = "navy" | "ocean" | "graphite" | "forest" | "plum" | "light";

const STORAGE_KEY = "atlas_finish";
const THEMES: AtlasFinish[] = ["navy", "ocean", "graphite", "forest", "plum", "light"];

type AtlasThemeValue = {
  finish: AtlasFinish;
  setFinish: (f: AtlasFinish) => void;
  toggle: () => void;
};

const AtlasThemeContext = createContext<AtlasThemeValue | null>(null);

function normalizeTheme(value: string | null): AtlasFinish | null {
  if (value && THEMES.includes(value as AtlasFinish)) return value as AtlasFinish;
  // Migrate the previous Paper / Console preference without breaking existing browsers.
  if (value === "warm") return "light";
  if (value === "night") return "graphite";
  return null;
}

export function AtlasThemeProvider({ children }: { children: ReactNode }) {
  const [finish, setFinish] = useState<AtlasFinish>("navy");

  useEffect(() => {
    try {
      const stored = normalizeTheme(localStorage.getItem(STORAGE_KEY));
      if (stored) setFinish(stored);
    } catch {
      /* Browser storage may be unavailable; keep the default theme. */
    }
  }, []);

  const apply = (next: AtlasFinish) => {
    setFinish(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* Keep the current session usable if storage is unavailable. */
    }
  };

  const toggle = () => {
    const index = THEMES.indexOf(finish);
    apply(THEMES[(index + 1) % THEMES.length]);
  };

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

"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/contexts/LanguageContext";

const FLAGS: Record<string, string> = {
  en: "🇬🇧",
  el: "🇬🇷",
  fr: "🇫🇷",
};

const LABELS: Record<string, string> = {
  en: "EN",
  el: "ΕΛ",
  fr: "FR",
};

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass hover:bg-white/40 transition-all text-sm font-medium text-slate-700"
      >
        <span>{FLAGS[locale]}</span>
        <span>{LABELS[locale]}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 glass-strong rounded-xl shadow-xl border border-slate-200/50 overflow-hidden z-50 min-w-[140px]">
          {Object.keys(translations).map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setLocale(loc as "en" | "el" | "fr");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                locale === loc
                  ? "bg-brand-50 text-brand-600 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">{FLAGS[loc]}</span>
              <span>{t.lang[loc as keyof typeof t.lang]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

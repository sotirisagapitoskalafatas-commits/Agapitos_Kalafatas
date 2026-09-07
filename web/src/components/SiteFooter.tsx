"use client";

import Link from "next/link";
import { useLocale } from "@/contexts/LanguageContext";

export default function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-slate-200 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo-footer.png"
            alt="A"
            className="h-16 w-40 rounded-2xl object-cover"
          />
          <span className="font-semibold text-slate-900">Agapitos Kalafatas</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <Link href="/chat" className="transition-colors hover:text-slate-900">
            Atlas AI
          </Link>
          <Link href="/services" className="transition-colors hover:text-slate-900">
            {t.nav?.services || "Services"}
          </Link>
          <Link href="/about" className="transition-colors hover:text-slate-900">
            About
          </Link>
          <Link
            href="/privacy-policy"
            className="transition-colors hover:text-slate-900"
          >
            Privacy
          </Link>
          <Link
            href="/terms-of-use"
            className="transition-colors hover:text-slate-900"
          >
            Terms
          </Link>
          <Link href="/gdpr" className="transition-colors hover:text-slate-900">
            GDPR
          </Link>
          <Link href="/cookies" className="transition-colors hover:text-slate-900">
            Cookies
          </Link>
          <Link href="/policy" className="transition-colors hover:text-slate-900">
            Policy
          </Link>
        </div>
        <p className="text-xs text-slate-400">{t.footer?.rights}</p>
      </div>
    </footer>
  );
}
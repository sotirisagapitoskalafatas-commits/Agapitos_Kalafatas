"use client";

import Link from "next/link";
import { Phone, Mail } from "lucide-react";
import { useLocale } from "@/contexts/LanguageContext";

export default function SiteFooter({
  hideBrand = false,
}: {
  hideBrand?: boolean;
}) {
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
          {!hideBrand && (
            <span className="font-semibold text-slate-900">
              Agapitos Kalafatas
            </span>
          )}
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
          <Link
            href="/admin/crm"
            className="font-medium text-slate-700 transition-colors hover:text-slate-900"
          >
            My CRM
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-100 px-6 pt-6 md:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <a
            href="tel:+306977691776"
            className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-900"
          >
            <Phone className="h-4 w-4 text-amber-600" />
            +30 697 769 1776
          </a>
          <a
            href="mailto:kalafatasagapitos@gmail.com"
            className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-900"
          >
            <Mail className="h-4 w-4 text-amber-600" />
            kalafatasagapitos@gmail.com
          </a>
        </div>
        <p className="text-xs text-slate-400">{t.footer?.rights}</p>
      </div>
    </footer>
  );
}
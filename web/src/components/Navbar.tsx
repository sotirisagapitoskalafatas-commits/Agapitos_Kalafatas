"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Globe, Zap, ShieldCheck, Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/contexts/LanguageContext";

export default function Navbar() {
  const { t } = useLocale();

  const sectors = [
    {
      href: "/services",
      label: t.sectors?.digitalSolutions || "Digital Solutions",
      desc: t.sectors?.digitalSolutionsDesc || "E-shop, Sites, Custom Apps & SEO",
      icon: Globe,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      hoverBg: "group-hover:bg-blue-600",
      hoverText: "group-hover:text-white",
    },
    {
      href: "/energy",
      label: t.sectors?.energy || "Energy",
      desc: t.sectors?.energyDesc || "Electricity, Gas, Solar & EV",
      icon: Zap,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      hoverBg: "group-hover:bg-amber-600",
      hoverText: "group-hover:text-white",
    },
    {
      href: "/insurance",
      label: t.sectors?.insurance || "Insurance",
      desc: t.sectors?.insuranceDesc || "Health BEWELL, Home, Auto",
      icon: ShieldCheck,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      hoverBg: "group-hover:bg-rose-600",
      hoverText: "group-hover:text-white",
    },
  ];
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isHome = pathname === "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold text-slate-900">Agapitos Kalafatas</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {isHome ? (
            <>
              <Link href="#about" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                {t.nav.about}
              </Link>
            </>
          ) : (
            <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
              {t.nav.home || "Home"}
            </Link>
          )}

          {/* Services Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
            >
              {t.nav.services}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180 text-brand-500" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 glass-strong rounded-2xl shadow-xl border border-slate-200/50 p-2 z-50">
                {sectors.map((sector) => {
                  const Icon = sector.icon;
                  return (
                    <Link
                      key={sector.href}
                      href={sector.href}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/40 transition-colors text-left group"
                    >
                      <div
                        className={`p-2.5 ${sector.iconBg} ${sector.iconColor} rounded-lg ${sector.hoverBg} ${sector.hoverText} transition-colors`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                          {sector.label}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{sector.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {isHome && (
            <Link href="#projects" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
              {t.nav.projects}
            </Link>
          )}

          <Link href="/contact" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
            {t.nav.contact}
          </Link>

          <LanguageSwitcher />

          <Link
            href="/chat"
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/25 text-sm"
          >
            {t.nav.launchAtlas}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-6 space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            {t.sectors?.selectSector || "Select Sector"}
          </p>
          {sectors.map((sector) => {
            const Icon = sector.icon;
            return (
              <Link
                key={sector.href}
                href={sector.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-900 font-medium text-sm"
              >
                <Icon className={`w-5 h-5 ${sector.iconColor}`} /> {sector.label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-100 space-y-2">
            {isHome && (
              <Link href="#about" onClick={() => setMobileOpen(false)} className="block font-semibold text-slate-700 px-2 py-1">
                {t.nav.about}
              </Link>
            )}
            <Link href="/contact" onClick={() => setMobileOpen(false)} className="block font-semibold text-slate-700 px-2 py-1">
              {t.nav.contact}
            </Link>
            <div className="flex items-center gap-3 px-2 pt-2">
              <LanguageSwitcher />
              <Link
                href="/chat"
                onClick={() => setMobileOpen(false)}
                className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-brand-500/25 text-sm"
              >
                {t.nav.launchAtlas}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

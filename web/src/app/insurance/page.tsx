"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  HeartPulse,
  Home,
  Briefcase,
  Car,
  ShieldCheck,
  PiggyBank,
  Plane,
  ChevronDown,
  CheckCircle2,
  Phone,
  PhoneCall,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLocale } from "@/contexts/LanguageContext";

const iconMap: Record<string, React.ElementType> = {
  health: HeartPulse,
  home: Home,
  business: Briefcase,
  auto: Car,
  liability: ShieldCheck,
  savings: PiggyBank,
  travel: Plane,
};

const colorMap: Record<string, { color: string; bgColor: string }> = {
  health: { color: "text-rose-500", bgColor: "bg-rose-50" },
  home: { color: "text-teal-500", bgColor: "bg-teal-50" },
  business: { color: "text-blue-500", bgColor: "bg-blue-50" },
  auto: { color: "text-amber-500", bgColor: "bg-amber-50" },
  liability: { color: "text-indigo-500", bgColor: "bg-indigo-50" },
  savings: { color: "text-emerald-500", bgColor: "bg-emerald-50" },
  travel: { color: "text-cyan-500", bgColor: "bg-cyan-50" },
};

const categoryIds = ["health", "home", "business", "auto", "liability", "savings", "travel"];

export default function InsurancePage() {
  const { t } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);
  const estimateRef = useRef<HTMLDivElement | null>(null);

  const [branch, setBranch] = useState<string>(categoryIds[0]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tIns = t.insurancePage || {};
  const categories = (tIns.categories || []).map((cat, idx) => ({
    ...cat,
    id: categoryIds[idx] || String(idx),
    icon: iconMap[categoryIds[idx]] || ShieldCheck,
    color: colorMap[categoryIds[idx]]?.color || "text-rose-500",
    bgColor: colorMap[categoryIds[idx]]?.bgColor || "bg-rose-50",
  }));

  const selectedCat = categories.find((c) => c.id === branch);

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setSubmitting(true);
    setError(null);

    const body = new FormData();
    body.append("first_name", fullName.trim());
    body.append("phone", phone.trim());
    body.append("service_category", selectedCat?.title || branch);
    body.append("comments", "Quick cost estimate");
    body.append("gdpr_consent", "true");

    try {
      const res = await fetch("/api/contact", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error submitting the form");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectBranchAndScroll = (id: string) => {
    setBranch(id);
    setSent(false);
    estimateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const b = new URLSearchParams(window.location.search).get("branch");
    if (b && categoryIds.includes(b)) {
      setBranch(b);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased">
      <Navbar />

      {/* HERO */}
      <section className="bg-gradient-to-b from-rose-50/60 to-slate-50 pt-28 pb-20 lg:pt-36 lg:pb-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" /> {tIns.badge}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              {tIns.title1} <span className="text-rose-600">{tIns.titleHighlight}</span> {tIns.title2}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
              {tIns.subtitle}
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <a href="#plans" className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-rose-600/20 transition-all">
                {tIns.ctaViewPlans}
              </a>
              <a href="tel:+306977691776" className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold px-6 py-4 rounded-2xl transition-all">
                <Phone className="w-5 h-5 text-rose-600" /> +30 697 769 1776
              </a>
            </div>
          </div>

          <div ref={estimateRef} className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
            <h3 className="text-xl font-bold text-slate-900">{tIns.quickEstimateTitle}</h3>
            <form onSubmit={handleEstimate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{tIns.planLabel}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => selectBranchAndScroll(cat.id)}
                      className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                        branch === cat.id
                          ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/25"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50 hover:border-rose-500 hover:text-rose-700"
                      }`}
                    >
                      {cat.title}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{tIns.fullNameLabel}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={tIns.fullNamePlaceholder}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{tIns.phoneLabel}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="69XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <label className="flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                {t.contactPage?.form?.gdpr || "I consent to the processing of my data so you can contact me, in accordance with the GDPR privacy policy."}
              </label>
              {error && (
                <p className="p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">{error}</p>
              )}
              {sent && (
                <p className="p-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl">
                  {tIns.estimateSuccess || "Your request was sent successfully! A specialist will call you shortly."}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting || !consent}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "..." : tIns.requestQuote}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* INSURANCE CATEGORIES (Accordion) */}
      <section id="plans" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
              {tIns.insuranceSolutionsTitle}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {tIns.insuranceSolutionsDesc}
            </p>
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isOpen = openId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md ${
                    isOpen ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"
                  }`}
                >
                  <button
                    onClick={() => setOpenId(isOpen ? null : cat.id)}
                    className="w-full px-6 py-5 flex items-center justify-between focus:outline-none text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${cat.bgColor} ${cat.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {cat.title}
                          {cat.subtitle && (
                            <span className="ml-2 text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wide">
                              {cat.subtitle}
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                      <p className="text-slate-600 leading-relaxed mb-6">{cat.description}</p>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                          {tIns.includesHeading}
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {cat.includes.map((item, index) => (
                            <li key={index} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="text-slate-700 text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-8 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => selectBranchAndScroll(cat.id)}
                          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          <PhoneCall className="w-4 h-4" />
                          {tIns.requestOffer}
                        </button>
                        <a
                          href="tel:+306977691776"
                          className="inline-flex items-center gap-2 border border-slate-200 hover:bg-slate-100 text-slate-700 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          +30 697 769 1776
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ADVISOR PROFILE */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 bg-brand-500 rounded-full shrink-0 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">AK</span>
            </div>
            <div className="text-center md:text-left flex-1">
              <h3 className="text-xl font-bold text-slate-900">{tIns.advisorName}</h3>
              <p className="text-rose-600 font-medium text-sm mb-3">
                {tIns.advisorRole}
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                {tIns.advisorText}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <a
                  href="tel:+306977691776"
                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  <PhoneCall className="w-4 h-4" /> +30 697 769 1776
                </a>
                <a
                  href="mailto:kalafatasagapitos@gmail.com"
                  className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  {tIns.sendEmail}
                </a>
                <a
                  href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-footer.png"
              alt="A"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-semibold text-white">{tIns.advisorName}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/" className="hover:text-white transition-colors">{tIns.footerHome}</Link>
            <Link href="/energy" className="hover:text-white transition-colors">{tIns.footerEnergy}</Link>
            <Link href="/contact" className="hover:text-white transition-colors">{tIns.footerContact}</Link>
          </div>
          <p className="text-xs text-slate-500">© 2026 Agapitos Kalafatas. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

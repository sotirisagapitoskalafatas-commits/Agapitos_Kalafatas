"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import Link from "next/link";
import {
  Zap,
  Flame,
  Sun,
  Car,
  BatteryCharging,
  TrendingDown,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Upload,
  ArrowRight,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import EnergyCinematicBackground from "@/components/EnergyCinematicBackground";
import AtmosSphere from "@/components/AtmosSphere";
import { useLocale } from "@/contexts/LanguageContext";
import { appendSpineFields } from "@/lib/attribution-client";

const iconMap: Record<string, React.ElementType> = {
  zap: Zap,
  flame: Flame,
  sun: Sun,
  car: Car,
  battery: BatteryCharging,
  trending: TrendingDown,
};

export default function EnergyPage() {
  const { t, locale } = useLocale();
  const tE = t.energyPage || {};
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formSent, setFormSent] = useState(false);
  const [formSending, setFormSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleEnergySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (formSending) return;
    setFormError(null);
    setFormSending(true);
    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      appendSpineFields(data, locale);
      const res = await fetch("/api/contact", { method: "POST", body: data });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      setFormSent(true);
      form.reset();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setFormSending(false);
    }
  }

  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );
    els.forEach((el) => {
      el.classList.add("reveal-init");
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const faqs = tE.faqs || [];
  const services = tE.services || [];
  const regions = tE.regions || [];
  const trust = [
    { title: tE.trust1Title, desc: tE.trust1Desc },
    { title: tE.trust2Title, desc: tE.trust2Desc },
    { title: tE.trust3Title, desc: tE.trust3Desc },
  ];

  return (
    <div className="min-h-screen bg-[#030711] text-slate-100 font-sans antialiased overflow-x-clip">
      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.35}} .reveal-init{opacity:0;transform:translateY(26px);transition:opacity .85s cubic-bezier(.2,.7,.2,1),transform .85s cubic-bezier(.2,.7,.2,1)} .revealed{opacity:1;transform:none}`}</style>

      <EnergyCinematicBackground flowCyan={true} />

      <Navbar />

      {/* HERO */}
      <section
        className="relative z-10 min-h-screen flex flex-col justify-end px-5 sm:px-10 lg:px-20 pb-16 md:pb-24"
        style={{
          background:
            "linear-gradient(to top, rgba(2,6,15,.72), rgba(2,6,15,0) 46%)",
        }}
      >
        <AtmosSphere className="absolute inset-0 z-0" />
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#02060f]/80 border border-amber-400/40 text-[11px] font-medium tracking-[0.2em] uppercase text-amber-400">
            <span
              className="block w-1.5 h-1.5 rounded-full bg-amber-400"
              style={{ animation: "pulseDot 2s ease-in-out infinite" }}
            />
            {tE.hub1Key}
          </div>
          <h1 className="mt-6 text-[40px] sm:text-6xl lg:text-7xl font-light leading-[1.02] tracking-tight text-slate-50">
            {tE.hub1Title}{" "}
            <span className="text-amber-400">{tE.hub2Key}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg font-light leading-relaxed text-slate-300/85">
            {tE.hub2Title}
          </p>
          <div className="flex flex-wrap gap-4 mt-9">
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-[#0b1220] font-semibold px-8 py-4 text-[13px] tracking-[0.14em] uppercase transition-colors"
            >
              {tE.ctaViewSolutions || "See our services"}
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="tel:+306977691776"
              className="inline-flex items-center gap-2.5 rounded-full border border-slate-400/30 px-8 py-4 text-sm text-slate-100 transition-colors hover:border-amber-400/60"
            >
              <Phone className="w-4 h-4 text-amber-400" /> +30 697 769 1776
            </a>
          </div>
        </div>

        <div className="mt-14 flex items-center gap-3 text-[10.5px] tracking-[0.26em] uppercase text-amber-400/85">
          <span className="block w-px h-8 bg-gradient-to-b from-amber-400/80 to-transparent" />
          Scroll
        </div>
      </section>

      {/* TRUST VALUES */}
      <section className="relative z-10 px-5 sm:px-10 lg:px-20 pb-20">
        <div className="max-w-6xl mx-auto grid gap-4 sm:grid-cols-3">
          {trust.map((item, idx) => (
            <div
              key={idx}
              data-reveal
              className="p-6 lg:p-8 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_32px_rgba(0,0,0,0.20)]"
            >
              <div className="text-3xl lg:text-4xl font-light text-amber-400">
                {item.title}
              </div>
              <div className="mt-2.5 text-[13px] font-light leading-relaxed text-slate-300/80">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="relative z-10 py-20 lg:py-28 px-5 sm:px-10 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <p data-reveal className="text-[11px] tracking-[0.26em] uppercase text-amber-400">
            {tE.servicesBadge}
          </p>
          <h2 data-reveal className="mt-3.5 text-3xl sm:text-4xl lg:text-5xl font-light text-slate-50 leading-tight">
            {tE.servicesTitle}
          </h2>
          <p data-reveal className="mt-4 max-w-xl font-light text-slate-300/80 leading-relaxed">
            {tE.servicesDesc}
          </p>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv, idx) => {
              const Icon = iconMap[srv.icon] || Zap;
              return (
                <div
                  key={idx}
                  data-reveal
                  className="flex flex-col gap-3.5 p-7 lg:p-8 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_32px_rgba(0,0,0,0.20)] transition-colors hover:bg-white/[0.16] hover:border-amber-400/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] tracking-[0.2em] text-amber-400/75">
                      0{idx + 1}
                    </span>
                    <Icon className={`w-6 h-6 ${srv.iconColor || "text-amber-400"}`} />
                  </div>
                  <h3 className="text-2xl font-light text-slate-50">{srv.title}</h3>
                  <p className="text-sm font-light leading-relaxed text-slate-300/80">
                    {srv.desc}
                  </p>
                  <Link
                    href={`/contact?service=${encodeURIComponent(srv.title)}`}
                    className="mt-auto pt-2 inline-flex items-center gap-1.5 text-[11.5px] tracking-[0.16em] uppercase text-amber-400 transition-transform hover:translate-x-1"
                  >
                    {tE.seeMore} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHO WE ARE + PRIVACY */}
      <section id="about" className="relative z-10 py-20 lg:py-28 px-5 sm:px-10 lg:px-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div data-reveal>
            <p className="text-[11px] tracking-[0.26em] uppercase text-amber-400">
              {tE.whoWeAre}
            </p>
            <h2 className="mt-3.5 text-3xl sm:text-4xl lg:text-5xl font-light text-slate-50 leading-tight">
              {tE.aboutTitle}
            </h2>
            <p className="mt-5 font-light text-slate-300/82 leading-relaxed">
              {tE.aboutText}
            </p>
            <div className="mt-7 p-6 rounded-2xl bg-white/[0.08] backdrop-blur-2xl border-l-[3px] border-amber-400/50 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <h3 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-amber-400">
                {tE.visionTitle}
              </h3>
              <p className="mt-2.5 font-light text-slate-300/82 leading-relaxed">
                {tE.visionText}
              </p>
            </div>
          </div>

          <div data-reveal className="p-7 lg:p-9 rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_32px_rgba(0,0,0,0.20)]">
            <p className="flex items-center gap-2.5 text-[12px] tracking-[0.14em] uppercase text-amber-400">
              <span className="block w-1.5 h-1.5 rounded-full bg-amber-400" />
              {tE.aboutImgCaption}
            </p>
            <h3 className="mt-4 text-2xl lg:text-[28px] font-light leading-snug text-slate-50">
              {tE.privacyTitle}
            </h3>
            <p className="mt-3.5 font-light text-slate-300/80 leading-relaxed">
              {tE.privacyHeading}
            </p>
            <p className="mt-3.5 font-light text-slate-300/80 leading-relaxed">
              {tE.privacyText}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-20 lg:py-28 px-5 sm:px-10 lg:px-20">
        <div className="max-w-3xl mx-auto">
          <p data-reveal className="text-[11px] tracking-[0.26em] uppercase text-amber-400">
            {tE.faqBadge}
          </p>
          <h2 data-reveal className="mt-3.5 text-3xl sm:text-4xl lg:text-5xl font-light text-slate-50 leading-tight">
            {tE.faqTitle}
          </h2>
          <p data-reveal className="mt-4 font-light text-slate-300/80">
            {tE.faqDesc}
          </p>

          <div data-reveal className="mt-10 grid gap-2.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left font-medium text-slate-50 hover:text-amber-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="px-5 pb-5 text-sm font-light text-slate-300/80 leading-relaxed border-t border-white/15 pt-4">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="relative z-10 py-20 lg:py-28 px-5 sm:px-10 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <div data-reveal className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.26em] uppercase text-amber-400">
              {tE.contactBadge}
            </p>
            <h2 className="mt-3.5 text-3xl sm:text-4xl lg:text-5xl font-light text-slate-50 leading-tight">
              {tE.contactTitle}
            </h2>
            <p className="mt-4 font-light text-slate-300/80">
              {tE.contactDesc}
            </p>
          </div>

          <div className="mt-12 grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div data-reveal className="lg:col-span-4 grid gap-4">
              <a
                href="tel:+306977691776"
                className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors hover:border-amber-400/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10">
                  <Phone className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10.5px] uppercase tracking-widest text-slate-400/70">
                    {tE.footerContact}
                  </p>
                  <p className="font-medium text-slate-50">+30 697 769 1776</p>
                </div>
              </a>
              <a
                href="mailto:kalafatasagapitos@gmail.com"
                className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-colors hover:border-amber-400/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10">
                  <Mail className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10.5px] uppercase tracking-widest text-slate-400/70">
                    Email
                  </p>
                  <p className="font-medium text-slate-50">
                    kalafatasagapitos@gmail.com
                  </p>
                </div>
              </a>
            </div>

            <form
              data-reveal
              onSubmit={handleEnergySubmit}
              className="lg:col-span-8 grid gap-5 p-6 sm:p-9 rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_32px_rgba(0,0,0,0.20)]"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formFirstName}
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formLastName}
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formEmail}
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formPhone}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formPropertyType}
                  </label>
                  <select
                    name="property_type"
                    className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none"
                  >
                    <option className="bg-[#0a1120]">{tE.formHome}</option>
                    <option className="bg-[#0a1120]">{tE.formBusiness}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formRegion}
                  </label>
                  <select
                    name="region"
                    className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none"
                  >
                    <option className="bg-[#0a1120]">
                      {regions[0]?.title || "Attica"}
                    </option>
                    <option className="bg-[#0a1120]">
                      {regions[2]?.title || "Northern Greece"}
                    </option>
                    <option className="bg-[#0a1120]">
                      {regions[5]?.title || "Crete"}
                    </option>
                    <option className="bg-[#0a1120]">{tE.formOtherRegion}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formService}
                  </label>
                  <select
                    name="service_category"
                    className="w-full bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none"
                  >
                    {services.map((s, i) => (
                      <option key={i} className="bg-[#0a1120]">
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                  {tE.formUpload}
                </label>
                <label className="block border-2 border-dashed border-white/30 rounded-2xl p-6 text-center bg-white/10 cursor-pointer hover:border-amber-400/50 transition-colors">
                  <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-400">
                    {tE.formUploadHint}
                  </p>
                  <input type="file" name="files" multiple className="hidden" />
                </label>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="gdpr_consent"
                  value="true"
                  required
                  className="mt-1 w-4 h-4 accent-amber-400 rounded border-white/40"
                />
                <label className="text-xs font-light text-slate-400 leading-relaxed">
                  {tE.formConsent}{" "}
                  <Link href="/privacy-policy" className="text-amber-400 underline">
                    GDPR
                  </Link>
                </label>
              </div>
              {formSent && (
                <p className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 text-sm text-emerald-200">
                  <Check className="w-4 h-4" /> {tE.formThanks}
                </p>
              )}
              {formError && (
                <p className="px-4 py-3 rounded-xl border border-red-400/40 bg-red-400/10 text-sm text-red-200">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={formSending}
                className="w-full rounded-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-[#0b1220] font-semibold py-4 text-[13px] tracking-[0.16em] uppercase transition-colors"
              >
                {formSending ? "..." : tE.formSubmit}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-slate-300/15 bg-[#030711] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-footer.png"
              alt="A"
              className="h-16 w-40 rounded-2xl object-cover"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <Link href="/chat" className="transition-colors hover:text-white">
              Atlas AI
            </Link>
            <Link href="/about" className="transition-colors hover:text-white">
              About
            </Link>
            <Link
              href="/privacy-policy"
              className="transition-colors hover:text-white"
            >
              Privacy
            </Link>
            <Link
              href="/terms-of-use"
              className="transition-colors hover:text-white"
            >
              Terms
            </Link>
            <Link href="/gdpr" className="transition-colors hover:text-white">
              GDPR
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-white">
              Cookies
            </Link>
            <Link href="/policy" className="transition-colors hover:text-white">
              Policy
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-300/10 px-6 pt-6 md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a
              href="tel:+306977691776"
              className="inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4 text-amber-400" />
              +30 697 769 1776
            </a>
            <a
              href="mailto:kalafatasagapitos@gmail.com"
              className="inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4 text-amber-400" />
              kalafatasagapitos@gmail.com
            </a>
          </div>
          <p className="text-xs text-slate-500">
            © 2026. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
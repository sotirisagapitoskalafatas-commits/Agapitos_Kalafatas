"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Flame,
  Sun,
  Car,
  BatteryCharging,
  TrendingDown,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import EnergyCinematicBackground from "@/components/EnergyCinematicBackground";
import { useLocale } from "@/contexts/LanguageContext";

const iconMap: Record<string, React.ElementType> = {
  zap: Zap,
  flame: Flame,
  sun: Sun,
  car: Car,
  battery: BatteryCharging,
  trending: TrendingDown,
};

const energyServiceValues = [
  "Electricity",
  "Natural Gas",
  "Solar",
  "E-Mobility",
  "Energy Storage",
  "Energy Savings",
];

export default function EnergyPage() {
  const { t } = useLocale();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [formSent, setFormSent] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);

  const faqs = t.energyPage?.faqs || [];
  const services = t.energyPage?.services || [];
  const regions = t.energyPage?.regions || [];

  const tE = t.energyPage || {};

  const scrollRail = (dir: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("article");
    const step = card
      ? card.getBoundingClientRect().width + 18
      : rail.clientWidth * 0.8;
    rail.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  // Scroll-driven reveal for cards/sections
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

  const regionImgs = [
    "/energy/region-attica.jpg",
    "/energy/region-central.jpg",
    "/energy/region-north.jpg",
    "/energy/region-ionian.jpg",
    "/energy/region-aegean.jpg",
    "/energy/region-crete.jpg",
  ];

  return (
    <div className="bg-[#02060f] text-slate-100 min-h-screen font-sans antialiased overflow-x-hidden">
      <style>{`@keyframes flowPulse{0%,100%{opacity:.35}50%{opacity:.9}} .reveal-init{opacity:0;transform:translateY(26px);transition:opacity .85s cubic-bezier(.2,.7,.2,1),transform .85s cubic-bezier(.2,.7,.2,1)} .revealed{opacity:1;transform:none}`}</style>

      <EnergyCinematicBackground flowCyan={true} />

      <Navbar />

      {/* HERO — reads over the orbit */}
      <section
        className="relative z-10 min-h-screen flex flex-col justify-end px-5 sm:px-10 lg:px-20 pb-16 md:pb-24"
        style={{ background: "linear-gradient(to top, rgba(2,6,15,.72), rgba(2,6,15,0) 46%)" }}
      >
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#02060f]/80 border border-amber-400/40 text-[11px] font-medium tracking-[0.2em] uppercase text-amber-400">
            <span className="block w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_2px_rgba(34,211,238,.8)]" />
            {tE.badge}
          </div>
          <h1 className="mt-6 text-[40px] sm:text-6xl lg:text-7xl font-light leading-[1.02] tracking-tight text-slate-50">
            {tE.title1} <span className="text-amber-400">{tE.titleHighlight}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base md:text-lg font-light leading-relaxed text-slate-300/85">
            {tE.title2}
          </p>
          <div className="flex flex-wrap gap-4 mt-9">
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 hover:bg-amber-300 text-[#0b1220] font-semibold px-8 py-4 text-[13px] tracking-[0.14em] uppercase transition-colors"
            >
              {tE.ctaViewSolutions}
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="tel:+306977691776"
              className="inline-flex items-center gap-2.5 rounded-full border border-slate-400/30 px-8 py-4 text-sm text-slate-100 transition-colors hover:border-cyan-400/60"
            >
              <Phone className="w-4 h-4 text-cyan-400" /> +30 697 769 1776
            </a>
          </div>
        </div>

        <div className="mt-14 flex items-center gap-3 text-[10.5px] tracking-[0.26em] uppercase text-cyan-400/85">
          <span className="block w-px h-8 bg-gradient-to-b from-cyan-400/80 to-transparent" />
          Scroll
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 px-5 sm:px-10 lg:px-20 pb-20 lg:pb-36">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div data-reveal className="p-6 lg:p-8 bg-[#040a16]/60 backdrop-blur-md border border-slate-400/12 rounded-2xl">
            <div className="text-4xl lg:text-5xl font-light text-amber-400">100%</div>
            <div className="mt-2.5 text-[11px] tracking-[0.2em] uppercase text-slate-400/80">{tE.statFree}</div>
          </div>
          <div data-reveal className="p-6 lg:p-8 bg-[#040a16]/60 backdrop-blur-md border border-slate-400/12 rounded-2xl">
            <div className="text-4xl lg:text-5xl font-light text-slate-50">7</div>
            <div className="mt-2.5 text-[11px] tracking-[0.2em] uppercase text-slate-400/80">{tE.statDays}</div>
          </div>
          <div data-reveal className="p-6 lg:p-8 bg-[#040a16]/60 backdrop-blur-md border border-slate-400/12 rounded-2xl">
            <div className="text-4xl lg:text-5xl font-light text-slate-50">24/7</div>
            <div className="mt-2.5 text-[11px] tracking-[0.2em] uppercase text-slate-400/80">{tE.statSupport}</div>
          </div>
          <div data-reveal className="p-6 lg:p-8 bg-[#040a16]/60 backdrop-blur-md border border-slate-400/12 rounded-2xl">
            <div className="text-4xl lg:text-5xl font-light text-amber-400">12.000+</div>
            <div className="mt-2.5 text-[11px] tracking-[0.2em] uppercase text-slate-400/80">{tE.statSatisfied}</div>
          </div>
        </div>
      </section>

      {/* GREECE COVERAGE — scroll rail */}
      <section
        id="greece"
        className="relative z-10 py-20 lg:py-28"
        style={{ background: "linear-gradient(to bottom, rgba(2,6,15,0), rgba(2,6,15,.5) 40%, rgba(2,6,15,.85) 88%)" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20">
          <p data-reveal className="text-[11px] tracking-[0.26em] uppercase text-cyan-400">{tE.greeceBadge}</p>
          <h2 data-reveal className="mt-3.5 text-3xl sm:text-4xl lg:text-5xl font-light text-slate-50 leading-tight">
            {tE.greeceTitle}
          </h2>
          <p data-reveal className="mt-4 max-w-xl font-light text-slate-300/80 leading-relaxed">
            {tE.greeceDesc}
          </p>

          <div className="mt-10 flex items-center justify-between gap-4">
            <span className="text-[10.5px] tracking-[0.24em] uppercase text-slate-400/60">
              {tE.scrollHint || "Six regions · swipe to explore"}
            </span>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                aria-label="Previous"
                className="w-11 h-11 rounded-full border border-slate-400/28 bg-[#040a16]/60 grid place-items-center text-slate-100 transition-colors hover:border-amber-400/60"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(1)}
                aria-label="Next"
                className="w-11 h-11 rounded-full border border-slate-400/28 bg-[#040a16]/60 grid place-items-center text-slate-100 transition-colors hover:border-amber-400/60"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={railRef}
          className="mt-6 px-5 sm:px-10 lg:px-20 flex gap-[18px] overflow-x-auto scroll-smooth"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {regions.map((reg, idx) => (
            <article
              key={idx}
              data-reveal
              className="relative flex-none w-[78vw] sm:w-[340px] lg:w-[360px] aspect-[4/5] overflow-hidden border border-slate-400/18 rounded-3xl group"
              style={{ scrollSnapAlign: "start" }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[800ms] group-hover:scale-[1.06]"
                style={{
                  backgroundImage: `url('${regionImgs[idx % regionImgs.length]}')`,
                  filter: "saturate(.72) brightness(.62) contrast(1.05) hue-rotate(-8deg)",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02060f]/95 via-[#02060f]/45 to-[#02060f]/10" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="text-4xl font-light text-amber-400">0{idx + 1}</span>
                <h3 className="mt-1.5 text-xl font-medium text-slate-50">{reg.title}</h3>
                <p className="mt-2.5 text-[13.5px] font-light leading-relaxed text-slate-300/85">{reg.desc}</p>
                <p className="mt-3.5 text-[11px] tracking-[0.18em] uppercase text-cyan-400">◈ {reg.location}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* HUB BAND */}
      <section className="relative z-10 px-5 sm:px-10 lg:px-20 py-10 lg:py-14 bg-[#02060f]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4">
          <figure data-reveal className="relative aspect-[16/10] overflow-hidden border border-slate-400/16 rounded-3xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/energy/hub-interior2.jpg')", filter: "saturate(.72) brightness(.62) contrast(1.05)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02060f]/92 via-[#02060f]/30 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[10.5px] tracking-[0.22em] uppercase text-cyan-400">{tE.hub1Key}</p>
              <h3 className="mt-2 text-2xl lg:text-3xl font-light text-slate-50">{tE.hub1Title}</h3>
            </figcaption>
          </figure>
          <figure data-reveal className="relative aspect-[16/10] overflow-hidden border border-slate-400/16 rounded-3xl">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/energy/ops-room.jpg')", filter: "saturate(.72) brightness(.62) contrast(1.05)" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02060f]/92 via-[#02060f]/30 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[10.5px] tracking-[0.22em] uppercase text-cyan-400">{tE.hub2Key}</p>
              <h3 className="mt-2 text-2xl lg:text-3xl font-light text-slate-50">{tE.hub2Title}</h3>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="relative z-10 py-20 lg:py-28 px-5 sm:px-10 lg:px-20 bg-[#02060f]">
        <div className="max-w-6xl mx-auto">
          <p data-reveal className="text-[11px] tracking-[0.26em] uppercase text-cyan-400">{tE.servicesBadge}</p>
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
                  className="flex flex-col gap-3.5 p-7 lg:p-8 bg-[#040a16]/72 border border-slate-400/14 rounded-2xl transition-colors hover:bg-[#091222]/85 hover:border-amber-400/35"
                >
                  <span className="text-[11px] tracking-[0.2em] text-cyan-400/75">0{idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${srv.iconColor || "text-amber-400"}`} />
                    <h3 className="text-2xl font-light text-slate-50">{srv.title}</h3>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-slate-300/80">{srv.desc}</p>
                  <Link
                    href={`/contact?service=${encodeURIComponent(energyServiceValues[idx] || energyServiceValues[0])}`}
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

      {/* ABOUT & GDPR */}
      <section id="about" className="relative z-10 py-20 lg:py-28 px-5 sm:px-10 lg:px-20 bg-[#02060f]">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div data-reveal>
            <p className="text-[11px] tracking-[0.26em] uppercase text-cyan-400">{tE.whoWeAre}</p>
            <h2 className="mt-3.5 text-3xl sm:text-4xl lg:text-5xl font-light text-slate-50 leading-tight">
              {tE.aboutTitle}
            </h2>
            <p className="mt-5 font-light text-slate-300/82 leading-relaxed">{tE.aboutText}</p>
            <div className="mt-7 p-6 rounded-2xl bg-[#091222]/50 border-l-[3px] border-amber-400/40 border border-slate-400/12">
              <h3 className="text-[13px] font-semibold tracking-[0.1em] uppercase text-amber-400">{tE.visionTitle}</h3>
              <p className="mt-2.5 font-light text-slate-300/82 leading-relaxed">{tE.visionText}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div data-reveal className="relative aspect-[3/2] overflow-hidden border border-slate-400/16 rounded-3xl">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/energy/home-energy.jpg')", filter: "saturate(.72) brightness(.62) contrast(1.05)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02060f]/80 to-transparent" />
              <p className="absolute left-6 bottom-5 text-[11px] tracking-[0.18em] uppercase text-slate-300/80">
                {tE.aboutImgCaption}
              </p>
            </div>
            <div data-reveal className="p-7 lg:p-9 rounded-3xl border border-slate-400/18 bg-gradient-to-br from-[#091222]/80 to-[#040a16]/50">
              <p className="flex items-center gap-2.5 text-[12px] tracking-[0.14em] uppercase text-cyan-400">
                <span className="block w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_2px_rgba(34,211,238,.7)]" />
                {tE.privacyTitle}
              </p>
              <h3 className="mt-4 text-2xl lg:text-[28px] font-light leading-snug text-slate-50">
                {tE.privacyHeading}
              </h3>
              <p className="mt-3.5 font-light text-slate-300/80 leading-relaxed">{tE.privacyText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-20 lg:py-28 px-5 sm:px-10 lg:px-20 bg-[#02060f]">
        <div className="max-w-3xl mx-auto">
          <p data-reveal className="text-[11px] tracking-[0.26em] uppercase text-cyan-400">{tE.faqBadge}</p>
          <h2 data-reveal className="mt-3.5 text-3xl sm:text-4xl lg:text-5xl font-light text-slate-50 leading-tight">
            {tE.faqTitle}
          </h2>
          <p data-reveal className="mt-4 font-light text-slate-300/80">{tE.faqDesc}</p>

          <div data-reveal className="mt-10 grid gap-2.5">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-[#040a16]/72 border border-slate-400/14 rounded-2xl overflow-hidden">
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
                  <p className="px-5 pb-5 text-sm font-light text-slate-300/80 leading-relaxed border-t border-slate-400/8 pt-4">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="relative z-10 py-20 lg:py-28 px-5 sm:px-10 lg:px-20 bg-[#02060f]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5 mb-12 lg:mb-16">
            <div data-reveal className="p-7 rounded-2xl bg-[#040a16]/60 border border-slate-400/14">
              <h3 className="text-lg font-semibold text-amber-400">{tE.trust1Title}</h3>
              <p className="mt-2.5 text-sm font-light text-slate-300/80">{tE.trust1Desc}</p>
            </div>
            <div data-reveal className="p-7 rounded-2xl bg-[#040a16]/60 border border-slate-400/14">
              <h3 className="text-lg font-semibold text-amber-400">{tE.trust2Title}</h3>
              <p className="mt-2.5 text-sm font-light text-slate-300/80">{tE.trust2Desc}</p>
            </div>
            <div data-reveal className="p-7 rounded-2xl bg-[#040a16]/60 border border-slate-400/14 md:col-span-2">
              <h3 className="text-lg font-semibold text-amber-400">{tE.trust3Title}</h3>
              <p className="mt-2.5 text-sm font-light text-slate-300/80">{tE.trust3Desc}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div data-reveal className="lg:col-span-5">
              <p className="text-[11px] tracking-[0.26em] uppercase text-cyan-400">{tE.contactBadge}</p>
              <h2 className="mt-3.5 text-3xl sm:text-4xl lg:text-5xl font-light text-slate-50 leading-tight">
                {tE.contactTitle}
              </h2>
              <p className="mt-5 font-light text-slate-300/82 leading-relaxed">{tE.contactDesc}</p>
              <div className="mt-8 grid gap-4">
                <a href="tel:+306977691776" className="flex items-center gap-3 text-slate-100 font-medium">
                  <Phone className="w-5 h-5 text-amber-400" /> +30 697 769 1776
                </a>
                <a href="mailto:kalafatasagapitos@gmail.com" className="flex items-center gap-3 text-slate-100 font-medium">
                  <Mail className="w-5 h-5 text-amber-400" /> kalafatasagapitos@gmail.com
                </a>
              </div>
            </div>

            <form
              data-reveal
              onSubmit={(e) => {
                e.preventDefault();
                setFormSent(true);
              }}
              className="lg:col-span-7 grid gap-5 p-6 sm:p-9 rounded-3xl border border-slate-400/18 bg-[#060d1a]/75"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formFirstName}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#02060f]/60 border border-slate-400/22 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formLastName}
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-[#02060f]/60 border border-slate-400/22 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none focus:border-amber-400/70"
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
                    className="w-full bg-[#02060f]/60 border border-slate-400/22 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none focus:border-amber-400/70"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formPhone}
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full bg-[#02060f]/60 border border-slate-400/22 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none focus:border-amber-400/70"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formPropertyType}
                  </label>
                  <select className="w-full bg-[#02060f]/60 border border-slate-400/22 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none">
                    <option className="bg-[#0a1120]">{tE.formHome}</option>
                    <option className="bg-[#0a1120]">{tE.formBusiness}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formRegion}
                  </label>
                  <select className="w-full bg-[#02060f]/60 border border-slate-400/22 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none">
                    <option className="bg-[#0a1120]">{regions[0]?.title || "Attica"}</option>
                    <option className="bg-[#0a1120]">{regions[2]?.title || "Northern Greece"}</option>
                    <option className="bg-[#0a1120]">{regions[5]?.title || "Crete"}</option>
                    <option className="bg-[#0a1120]">{tE.formOtherRegion}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold tracking-[0.16em] uppercase text-slate-400/75 mb-2">
                    {tE.formService}
                  </label>
                  <select className="w-full bg-[#02060f]/60 border border-slate-400/22 rounded-xl px-4 py-3 text-sm text-slate-50 outline-none">
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
                <div className="border-2 border-dashed border-slate-400/28 rounded-2xl p-6 text-center bg-[#02060f]/45">
                  <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-400">{tE.formUploadHint}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 accent-amber-400 rounded border-slate-400/40"
                />
                <label className="text-xs font-light text-slate-400 leading-relaxed">{tE.formConsent}</label>
              </div>
              {formSent && (
                <p className="flex items-center gap-2 px-4 py-3 rounded-xl border border-cyan-400/40 bg-cyan-400/10 text-sm text-cyan-200">
                  <Check className="w-4 h-4" /> {tE.formThanks}
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-full bg-amber-400 hover:bg-amber-300 text-[#0b1220] font-semibold py-4 text-[13px] tracking-[0.16em] uppercase transition-colors"
              >
                {tE.formSubmit}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-[#02060f] text-slate-400 py-14 border-t border-slate-400/14 text-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20 grid md:grid-cols-3 gap-8 mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo-footer.png"
                alt="A"
                className="w-20 h-20 rounded-2xl object-cover"
              />
              <span className="font-bold text-white">Agapitos Kalafatas</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{tE.footerDesc}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-slate-50 font-semibold text-xs uppercase tracking-wider">{tE.footerContact}</h4>
            <p className="text-xs">+30 697 769 1776</p>
            <p className="text-xs">kalafatasagapitos@gmail.com</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-slate-50 font-semibold text-xs uppercase tracking-wider">{tE.footerServices}</h4>
            <p className="text-xs">{tE.footerServicesList}</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-5 sm:px-10 lg:px-20 pt-7 border-t border-slate-400/12 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p>© 2026 Agapitos Kalafatas. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white">
              {tE.footerHome}
            </Link>
            <Link href="/contact" className="hover:text-white">
              {tE.footerContactLink}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

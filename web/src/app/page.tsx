"use client";

/**
 * Home — light + clean redesign (LUMEN visual hero on a soft light canvas).
 *
 * The i18n keys (`t.hero.badge`, `t.about.title`, ...) are preserved verbatim.
 * A fixed services block (Ψηφιακές Λύσεις / Ενέργεια / Ασφάλιση) sits inside
 * the Όραμα & Αποστολή area, and the footer carries the legal pages.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import LumenScrollHero from "@/components/LumenScrollHero";
import Scene3D from "@/components/Scene3D";
import AtmosTransition from "@/components/AtmosTransition";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { ServiceGrid } from "@/components/ServiceGrid";
import { SectorGrid } from "@/components/SectorGrid";
import { FaqSection } from "@/components/FaqSection";
import { StackedProjects } from "@/components/StackedProjects";
import { useLocale } from "@/contexts/LanguageContext";
import { Laptop, Zap, ShieldCheck, ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const pillars = [
  {
    title: "Ψηφιακές Λύσεις",
    items: ["E-shop", "Sites", "Custom Apps", "SEO"],
    href: "/services",
    icon: Laptop,
    chip: "bg-sky-50 border-sky-100 text-sky-600",
    linkColor: "text-sky-700 hover:text-sky-900",
  },
  {
    title: "Ενέργεια",
    items: ["Ρεύμα", "Αέριο", "Φωτοβολταϊκά", "EV"],
    href: "/energy",
    icon: Zap,
    chip: "bg-amber-50 border-amber-100 text-amber-600",
    linkColor: "text-amber-700 hover:text-amber-900",
  },
  {
    title: "Ασφάλιση",
    items: ["Υγεία BEWELL", "Κατοικία", "Αυτοκίνητο"],
    href: "/insurance",
    icon: ShieldCheck,
    chip: "bg-violet-50 border-violet-100 text-violet-600",
    linkColor: "text-violet-700 hover:text-violet-900",
  },
];

export default function Home() {
  const { t } = useLocale();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pinned About section — image slides up as the copy fades in.
      gsap.fromTo(
        ".about-text",
        { opacity: 0, y: 50, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-text",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
      gsap.fromTo(
        ".about-image",
        { opacity: 0, y: 80, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-image",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Hub section parallax.
      gsap.utils.toArray<HTMLElement>(".cinematic-section").forEach((el) => {
        gsap.fromTo(
          el.querySelector(".cinematic-copy"),
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
        gsap.fromTo(
          el.querySelector(".cinematic-media"),
          { opacity: 0, y: 60, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Contact wide reveal.
      gsap.fromTo(
        ".contact-section",
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".contact-section",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={rootRef}
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
    >
      {/* Soft light texture behind everything for a clean, airy feel */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(1200px_800px_at_50%_-10%,rgba(245,158,11,0.08),transparent_60%),radial-gradient(900px_600px_at_100%_100%,rgba(139,92,246,0.07),transparent_60%)]" />

      {/* Navigation */}
      <Navbar />

      {/* LUMEN pinned scroll-scrub hero — scrubs 123 frames from /public/frames/hero-sequence/ */}
      <LumenScrollHero />

      <AtmosTransition />

      {/* About — Όραμα & Αποστολή + services pillars */}
      <section
        id="about"
        className="relative overflow-hidden py-32 md:py-40"
      >
        {/* Ambient warm glow */}
        <div className="pointer-events-none absolute top-1/2 right-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div className="about-text">
              <span className="mb-6 inline-block rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-700">
                {t.about.badge}
              </span>
              <h2 className="mb-8 text-4xl font-black leading-tight text-slate-900 md:text-6xl">
                {t.about.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <span className="bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 bg-clip-text text-transparent">
                  {t.about.title.split(" ").slice(2).join(" ")}
                </span>
              </h2>
              <div className="space-y-5 leading-relaxed text-slate-600">
                <p>
                  <strong className="text-slate-900">
                    Founder &amp; Chief SaaS Architect
                  </strong>{" "}
                  — {t.about.p1}
                </p>
                <p>{t.about.p2}</p>
              </div>
              <div className="mt-10 flex gap-4">
                <a
                  href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <img
                    src="/images/linkedin-logo.jpg"
                    alt="LinkedIn"
                    className="h-5 w-5 rounded object-cover"
                  />
                  {t.about.linkedin}
                </a>
              </div>
            </div>
            <div className="about-image relative">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/60">
                <img
                  src="/images/image2.jpg"
                  alt="AI Vision"
                  className="h-auto w-full rounded-2xl object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 max-w-[220px] rounded-2xl border border-amber-200 bg-white p-5 shadow-xl shadow-amber-100">
                <p className="text-3xl font-black text-amber-600">30+</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">
                  {t.about.countries}
                </p>
              </div>
            </div>
          </div>

          {/* Services pillars — Ψηφιακές Λύσεις / Ενέργεια / Ασφάλιση */}
          <div className="mt-24 md:mt-28">
            <p className="mb-8 text-center text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Οι Υπηρεσίες μας
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {pillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
                  >
                    <div
                      className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${p.chip}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {p.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={p.href}
                      className={`mt-6 inline-flex items-center gap-1 text-sm font-semibold transition-all ${p.linkColor}`}
                    >
                      Μάθετε περισσότερα
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Digital Services */}
      <div id="services" className="relative z-10">
        <ServiceGrid />
      </div>

      {/* Industry Sectors */}
      <div className="relative z-10">
        <SectorGrid />
      </div>

      {/* FAQ */}
      <div className="relative z-10">
        <FaqSection />
      </div>

      {/* Projects — pinned stacked-card scroll effect */}
      <div className="relative z-10">
        <StackedProjects />
      </div>

      {/* Hub — cinematic split */}
      <section className="cinematic-section relative overflow-hidden py-32 md:py-40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.06] to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div className="cinematic-media relative order-2 lg:order-1">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/60">
                <img
                  src="/images/image3.jpg"
                  alt="Collaboration Hub"
                  className="h-auto w-full rounded-2xl object-cover"
                />
              </div>
            </div>
            <div className="cinematic-copy order-1 lg:order-2">
              <span className="mb-6 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                {t.hub.badge}
              </span>
              <h2 className="mb-8 text-4xl font-black leading-tight text-slate-900 md:text-6xl">
                {t.hub.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <span className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 bg-clip-text text-transparent">
                  {t.hub.title.split(" ").slice(2).join(" ")}
                </span>
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-slate-700">
                {t.hub.p1}
              </p>
              <p className="leading-relaxed text-slate-600">{t.hub.p2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Solutions — cinematic + subtle Scene3D backdrop */}
      <section className="cinematic-section relative overflow-hidden py-32 md:py-40">
        <div className="absolute inset-0 opacity-25">
          <Scene3D />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div className="cinematic-copy">
              <span className="mb-6 inline-block rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-700">
                {t.aiSolutions.badge}
              </span>
              <h2 className="mb-8 text-4xl font-black leading-tight text-slate-900 md:text-6xl">
                {t.aiSolutions.title.split(" ")[0]}
                <br />
                <span className="bg-gradient-to-br from-sky-600 via-sky-500 to-sky-400 bg-clip-text text-transparent">
                  {t.aiSolutions.title.split(" ").slice(1).join(" ")}
                </span>
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-slate-700">
                {t.aiSolutions.desc}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {t.aiSolutions.stats.map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-2xl font-black text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="cinematic-media relative">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/60">
                <img
                  src="/images/image4.jpg"
                  alt="AI Neural Innovations"
                  className="h-auto w-full rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* R&D — full-bleed centered */}
      <section className="cinematic-section relative overflow-hidden py-32 md:py-40">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <div className="cinematic-copy">
            <span className="mb-6 inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-700">
              {t.rnd.badge}
            </span>
            <h2 className="mb-6 text-4xl font-black text-slate-900 md:text-6xl">
              {t.rnd.title.split(" ")[0]}{" "}
              <span className="bg-gradient-to-br from-orange-600 via-amber-500 to-amber-400 bg-clip-text text-transparent">
                {t.rnd.title.split(" ").slice(1).join(" ")}
              </span>
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-lg text-slate-600">
              {t.rnd.desc}
            </p>
          </div>
          <div className="cinematic-media mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/60">
            <img
              src="/images/image7.jpg"
              alt="R&D Lab"
              className="h-auto w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="contact-section relative overflow-hidden py-32 md:py-40"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] via-transparent to-violet-500/[0.08]" />
        <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div>
              <span className="mb-6 inline-block rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-700">
                {t.contact.badge}
              </span>
              <h2 className="mb-8 text-4xl font-black leading-tight text-slate-900 md:text-6xl">
                {t.contact.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <span className="bg-gradient-to-br from-amber-600 via-amber-500 to-amber-400 bg-clip-text text-transparent">
                  {t.contact.title.split(" ").slice(2).join(" ")}
                </span>
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-slate-700">
                {t.contact.desc}
              </p>
              <div className="space-y-4">
                <a
                  href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 shadow-lg">
                    <img
                      src="/images/linkedin-logo.jpg"
                      alt="LinkedIn"
                      className="h-8 w-8 rounded-md object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 transition-colors group-hover:text-amber-600">
                      {t.contact.linkedin}
                    </p>
                    <p className="text-sm text-slate-500">
                      {t.contact.linkedinDesc}
                    </p>
                  </div>
                </a>
                <Link
                  href="/chat"
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500 shadow-lg">
                    <span className="text-lg text-white">⚡</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 transition-colors group-hover:text-violet-600">
                      {t.contact.atlas}
                    </p>
                    <p className="text-sm text-slate-500">
                      {t.contact.atlasDesc}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/60">
                <img
                  src="/images/image9.jpg"
                  alt="Contact"
                  className="h-auto w-full rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </main>
  );
}
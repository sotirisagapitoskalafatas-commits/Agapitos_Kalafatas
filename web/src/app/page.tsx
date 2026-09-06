"use client";

/**
 * Home — dark cinematic redesign (LUMEN + Glass·Timber·Fire + OCEANORA vibe).
 *
 * The i18n keys (`t.hero.badge`, `t.about.title`, ...) are preserved verbatim.
 * Structure kept identical to the previous page so downstream components
 * (ServiceGrid, SectorGrid, FaqSection, StackedProjects, Navbar, ...) still
 * render without changes.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCinematic from "@/components/HeroCinematic";
import Scene3D from "@/components/Scene3D";
import Navbar from "@/components/Navbar";
import { ServiceGrid } from "@/components/ServiceGrid";
import { SectorGrid } from "@/components/SectorGrid";
import { FaqSection } from "@/components/FaqSection";
import { StackedProjects } from "@/components/StackedProjects";
import { useLocale } from "@/contexts/LanguageContext";

gsap.registerPlugin(ScrollTrigger);

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
      className="min-h-screen bg-[#0a0a0b] text-white antialiased"
    >
      {/* Fixed dark texture behind everything for a deep, matte feel */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(1200px_800px_at_50%_-10%,rgba(245,158,11,0.06),transparent_60%),radial-gradient(900px_600px_at_100%_100%,rgba(139,92,246,0.08),transparent_60%)]" />

      {/* Navigation */}
      <Navbar />

      {/* LUMEN-style pinned scroll hero */}
      <HeroCinematic />

      {/* About — dark, pinned image reveal */}
      <section
        id="about"
        className="relative overflow-hidden py-32 md:py-40"
      >
        {/* Ambient warm glow */}
        <div className="pointer-events-none absolute top-1/2 right-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-amber-500/8 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div className="about-text">
              <span className="mb-6 inline-block rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200">
                {t.about.badge}
              </span>
              <h2 className="mb-8 text-5xl font-black leading-tight text-white md:text-6xl">
                {t.about.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <span className="bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                  {t.about.title.split(" ").slice(2).join(" ")}
                </span>
              </h2>
              <div className="space-y-5 leading-relaxed text-white/60">
                <p>
                  <strong className="text-white">
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
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/85 backdrop-blur transition-all hover:bg-white/10"
                >
                  {t.about.linkedin}
                </a>
              </div>
            </div>
            <div className="about-image relative">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/60 backdrop-blur">
                <img
                  src="/images/image2.jpg"
                  alt="AI Vision"
                  className="h-auto w-full rounded-2xl object-cover opacity-90"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 max-w-[220px] rounded-2xl border border-amber-300/25 bg-black/60 p-5 shadow-lg backdrop-blur">
                <p className="text-3xl font-black text-amber-200">30+</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-white/60">
                  {t.about.countries}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.04] to-transparent" />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div className="cinematic-media relative order-2 lg:order-1">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/60">
                <img
                  src="/images/image3.jpg"
                  alt="Collaboration Hub"
                  className="h-auto w-full rounded-2xl object-cover opacity-90"
                />
              </div>
            </div>
            <div className="cinematic-copy order-1 lg:order-2">
              <span className="mb-6 inline-block rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-200">
                {t.hub.badge}
              </span>
              <h2 className="mb-8 text-5xl font-black leading-tight text-white md:text-6xl">
                {t.hub.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <span className="bg-gradient-to-br from-emerald-100 via-emerald-200 to-emerald-400 bg-clip-text text-transparent">
                  {t.hub.title.split(" ").slice(2).join(" ")}
                </span>
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-white/65">
                {t.hub.p1}
              </p>
              <p className="leading-relaxed text-white/50">{t.hub.p2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Solutions — cinematic + subtle Scene3D backdrop */}
      <section className="cinematic-section relative overflow-hidden py-32 md:py-40">
        <div className="absolute inset-0 opacity-30">
          <Scene3D />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div className="cinematic-copy">
              <span className="mb-6 inline-block rounded-full border border-sky-400/25 bg-sky-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-200">
                {t.aiSolutions.badge}
              </span>
              <h2 className="mb-8 text-5xl font-black leading-tight text-white md:text-6xl">
                {t.aiSolutions.title.split(" ")[0]}
                <br />
                <span className="bg-gradient-to-br from-sky-100 via-sky-200 to-sky-400 bg-clip-text text-transparent">
                  {t.aiSolutions.title.split(" ").slice(1).join(" ")}
                </span>
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-white/65">
                {t.aiSolutions.desc}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {t.aiSolutions.stats.map((stat, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                  >
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-white/50">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="cinematic-media relative">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/60">
                <img
                  src="/images/image4.jpg"
                  alt="AI Neural Innovations"
                  className="h-auto w-full rounded-2xl object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* R&D — full-bleed centered */}
      <section className="cinematic-section relative overflow-hidden py-32 md:py-40">
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/[0.06] blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
          <div className="cinematic-copy">
            <span className="mb-6 inline-block rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-200">
              {t.rnd.badge}
            </span>
            <h2 className="mb-6 text-5xl font-black text-white md:text-6xl">
              {t.rnd.title.split(" ")[0]}{" "}
              <span className="bg-gradient-to-br from-orange-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                {t.rnd.title.split(" ").slice(1).join(" ")}
              </span>
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-lg text-white/60">
              {t.rnd.desc}
            </p>
          </div>
          <div className="cinematic-media mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/60">
            <img
              src="/images/image7.jpg"
              alt="R&D Lab"
              className="h-auto w-full rounded-2xl object-cover opacity-90"
            />
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        className="contact-section relative overflow-hidden py-32 md:py-40"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-violet-500/[0.06]" />
        <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-amber-500/8 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-20 lg:grid-cols-2">
            <div>
              <span className="mb-6 inline-block rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200">
                {t.contact.badge}
              </span>
              <h2 className="mb-8 text-5xl font-black leading-tight text-white md:text-6xl">
                {t.contact.title.split(" ").slice(0, 2).join(" ")}
                <br />
                <span className="bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
                  {t.contact.title.split(" ").slice(2).join(" ")}
                </span>
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-white/65">
                {t.contact.desc}
              </p>
              <div className="space-y-4">
                <a
                  href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-all hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 shadow-lg">
                    <span className="text-lg text-black">in</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white transition-colors group-hover:text-amber-200">
                      {t.contact.linkedin}
                    </p>
                    <p className="text-sm text-white/55">
                      {t.contact.linkedinDesc}
                    </p>
                  </div>
                </a>
                <Link
                  href="/chat"
                  className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-all hover:bg-white/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500 shadow-lg">
                    <span className="text-lg text-white">⚡</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white transition-colors group-hover:text-violet-200">
                      {t.contact.atlas}
                    </p>
                    <p className="text-sm text-white/55">
                      {t.contact.atlasDesc}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/60">
                <img
                  src="/images/image9.jpg"
                  alt="Contact"
                  className="h-auto w-full rounded-2xl object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
              <span className="text-sm font-bold text-black">A</span>
            </div>
            <span className="font-semibold text-white/85">
              Agapitos Kalafatas
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/55">
            <Link href="/chat" className="transition-colors hover:text-white">
              Atlas AI
            </Link>
            <Link
              href="/services"
              className="transition-colors hover:text-white"
            >
              {t.nav.services}
            </Link>
            <Link
              href="/admin/crm"
              className="transition-colors hover:text-white"
            >
              CRM
            </Link>
          </div>
          <p className="text-xs text-white/40">{t.footer.rights}</p>
        </div>
      </footer>
    </main>
  );
}
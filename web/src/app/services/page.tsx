"use client";

/**
 * Replaces web/src/app/services/page.tsx
 * Same data source (getServicesList + useLocale), same routes, same i18n keys.
 * Changed: the white page becomes a night flight — CinematicSkyBackground sits
 * behind the content, cards become glass, hero pins at the bottom of the frame.
 */

import Link from "next/link";
import {
  ArrowRight,
  Globe,
  ShoppingBag,
  Palette,
  TrendingUp,
  Megaphone,
  Smartphone,
  Server,
  Code2,
  Zap,
} from "lucide-react";
import { getServicesList } from "@/lib/servicesData";
import Navbar from "@/components/Navbar";
import CinematicSkyBackground from "@/components/CinematicSkyBackground";
import { useLocale } from "@/contexts/LanguageContext";

const iconMap: Record<string, React.ElementType> = {
  "web-development": Globe,
  "eshop-development": ShoppingBag,
  "ux-ui-branding": Palette,
  "digital-marketing": TrendingUp,
  "web-mobile-apps": Smartphone,
  "hosting-support": Server,
  "custom-integrations": Code2,
};

export default function ServicesHubPage() {
  const { t, locale } = useLocale();
  const servicesList = getServicesList(locale);

  return (
    <>
      <CinematicSkyBackground pushScreens={1.75} mistIntensity={0.65} />
      <Navbar />

      <main className="relative z-10 min-h-screen text-slate-100">
        {/* Hero — reads over the cabin window */}
        <section className="min-h-screen flex flex-col justify-end px-5 sm:px-10 lg:px-20 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-6 text-[11px] font-semibold tracking-[0.28em] uppercase text-[#c9d4e8]">
              <Zap className="w-3.5 h-3.5" />
              {t.servicesPage?.badge || "Agapitos Kalafatas"}
            </div>
            <h1 className="text-5xl md:text-7xl font-light leading-[0.98] tracking-tight text-white">
              {t.servicesPage?.title || "Digital Solutions"}
            </h1>
            <p className="mt-6 max-w-xl text-base md:text-lg font-light leading-relaxed text-slate-300/85">
              {t.servicesPage?.subtitle ||
                "From website development to custom software and AI integrations — comprehensive digital solutions for every need."}
            </p>
          </div>
          <div className="mt-12 flex items-center gap-3 text-[11px] tracking-[0.26em] uppercase text-[#c9d4e8]/70">
            <span className="block w-px h-8 bg-gradient-to-b from-[#c9d4e8]/70 to-transparent" />
            Scroll
          </div>
        </section>

        {/* Pass-through beat — pure animation, no content */}
        <section className="h-[120vh]" aria-hidden="true" />

        {/* Services grid — lands as Athens rises out of the clouds */}
        <section className="px-5 sm:px-10 lg:px-20 pt-24 pb-32 bg-gradient-to-b from-transparent via-[#030711]/75 to-[#030711]/95">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {servicesList.map((service) => {
                const Icon = iconMap[service.slug] || Globe;
                return (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="group flex flex-col gap-4 p-7 border border-slate-300/15 bg-[#070e1c]/50 backdrop-blur-md transition-colors duration-300 hover:border-[#c9d4e8]/40 hover:bg-[#091222]/65"
                  >
                    <Icon className="w-6 h-6 text-[#c9d4e8]" />
                    <h2 className="text-xl font-medium leading-snug text-white">
                      {service.heroTitle}
                    </h2>
                    <p className="text-sm font-light leading-relaxed text-slate-300/80">
                      {service.heroSubtitle}
                    </p>
                    <ul className="grid gap-2 text-[13px] text-slate-300/75">
                      {service.benefits.slice(0, 2).map((b, i) => (
                        <li key={i} className="flex gap-2.5">
                          <span className="text-[#c9d4e8]">—</span>
                          {b.title}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-auto pt-2 inline-flex items-center gap-1.5 text-[11px] tracking-[0.16em] uppercase text-[#c9d4e8] transition-transform group-hover:translate-x-1">
                      {t.servicesPage?.learnMore || "Learn more"}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-5 sm:px-10 lg:px-20 pb-28 bg-[#030711]/95">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-8 p-10 border border-slate-300/15 bg-gradient-to-br from-[#091222]/75 to-[#060c18]/50">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-light leading-tight text-white">
                {t.servicesPage?.notFinding ||
                  "Can't find what you're looking for?"}
              </h2>
              <p className="mt-4 font-light text-slate-300/80">
                {t.servicesPage?.consultingDesc ||
                  "Request free consulting — let's discuss your needs."}
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border border-[#c9d4e8]/50 text-[12px] tracking-[0.2em] uppercase text-[#c9d4e8] transition-colors hover:bg-[#c9d4e8]/10"
            >
              {t.servicesPage?.contactUs || "Contact Us"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

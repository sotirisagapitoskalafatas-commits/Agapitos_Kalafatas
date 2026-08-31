"use client";

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

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  "web-development": {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  "eshop-development": {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-200",
  },
  "ux-ui-branding": {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    border: "border-indigo-200",
  },
  "digital-marketing": {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-200",
  },
  "web-mobile-apps": {
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    border: "border-cyan-200",
  },
  "hosting-support": {
    bg: "bg-rose-50",
    text: "text-rose-600",
    border: "border-rose-200",
  },
  "custom-integrations": {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
  },
};

export default function ServicesHubPage() {
  const { t, locale } = useLocale();
  const servicesList = getServicesList(locale);
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 text-white pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-blue-500/20">
            <Zap className="w-3.5 h-3.5" />
            {t.servicesPage?.badge || "Agapitos Kalafatas"}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            {t.servicesPage?.title || "Digital Solutions"}
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            {t.servicesPage?.subtitle || "From website development to custom software and AI integrations — comprehensive digital solutions for every need."}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((service) => {
            const Icon = iconMap[service.slug] || Globe;
            const colors = colorMap[service.slug] || {
              bg: "bg-blue-50",
              text: "text-blue-600",
              border: "border-blue-200",
            };
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className={`group bg-white p-8 rounded-2xl border ${colors.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  <div
                    className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {service.heroTitle.split(" ").slice(0, 4).join(" ")}
                  </h2>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    {service.heroSubtitle}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {service.benefits.slice(0, 2).map((b, i) => (
                      <span
                        key={i}
                        className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full"
                      >
                        {b.title}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  {t.servicesPage?.learnMore || "Learn more"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t.servicesPage?.notFinding || "Can't find what you're looking for?"}
          </h2>
          <p className="text-slate-500 mb-8">
            {t.servicesPage?.consultingDesc || "Request free consulting — let's discuss your needs."}
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-600/25 text-sm"
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

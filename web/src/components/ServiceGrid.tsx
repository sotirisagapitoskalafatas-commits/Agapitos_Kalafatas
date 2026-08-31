"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Globe,
  Palette,
  TrendingUp,
  Megaphone,
  Smartphone,
  Server,
  Code2,
} from "lucide-react";
import { useLocale } from "@/contexts/LanguageContext";

const iconBySlug: Record<string, React.ElementType> = {
  "web-development": Globe,
  "eshop-development": ShoppingBag,
  "ux-ui-branding": Palette,
  "seo-performance": TrendingUp,
  "digital-marketing": Megaphone,
  "web-mobile-apps": Smartphone,
  "hosting-support": Server,
  "custom-integrations": Code2,
};

const colorBySlug: Record<string, { bg: string; color: string }> = {
  "web-development": { bg: "bg-blue-50", color: "text-blue-600" },
  "eshop-development": { bg: "bg-purple-50", color: "text-purple-600" },
  "ux-ui-branding": { bg: "bg-indigo-50", color: "text-indigo-600" },
  "seo-performance": { bg: "bg-emerald-50", color: "text-emerald-600" },
  "digital-marketing": { bg: "bg-amber-50", color: "text-amber-600" },
  "web-mobile-apps": { bg: "bg-cyan-50", color: "text-cyan-600" },
  "hosting-support": { bg: "bg-rose-50", color: "text-rose-600" },
  "custom-integrations": { bg: "bg-slate-100", color: "text-slate-700" },
};

export const ServiceGrid: React.FC = () => {
  const { t } = useLocale();
  const services = t.serviceGrid || [];
  const tPage = t.servicesPage || {};

  return (
    <section className="py-16 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm font-semibold tracking-wider text-blue-600 uppercase">
            {tPage.badge}
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-2">
            {tPage.title}
          </h2>
          <p className="text-slate-600 mt-4">{tPage.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const Icon = iconBySlug[service.slug] || Globe;
            const colors = colorBySlug[service.slug] || { bg: "bg-blue-50", color: "text-blue-600" };
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group relative bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-6 h-6 ${colors.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  {tPage.learnMore} &rarr;
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

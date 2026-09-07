"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Factory,
  ShoppingBag,
  Hotel,
  Scale,
  Stethoscope,
  Utensils,
  Dumbbell,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { useLocale } from "@/contexts/LanguageContext";

const iconBySlug: Record<string, React.ElementType> = {
  "real-estate": Building2,
  "b2b-industry": Factory,
  eshop: ShoppingBag,
  hotels: Hotel,
  lawyers: Scale,
  doctors: Stethoscope,
  restaurants: Utensils,
  gyms: Dumbbell,
  education: GraduationCap,
};

const iconColorBySlug: Record<string, string> = {
  "real-estate": "text-blue-600",
  "b2b-industry": "text-purple-600",
  eshop: "text-indigo-600",
  hotels: "text-emerald-600",
  lawyers: "text-amber-600",
  doctors: "text-rose-600",
  restaurants: "text-cyan-600",
  gyms: "text-orange-600",
  education: "text-teal-600",
};

const borderBySlug: Record<string, string> = {
  "real-estate": "border-blue-200 hover:border-blue-400",
  "b2b-industry": "border-purple-200 hover:border-purple-400",
  eshop: "border-indigo-200 hover:border-indigo-400",
  hotels: "border-emerald-200 hover:border-emerald-400",
  lawyers: "border-amber-200 hover:border-amber-400",
  doctors: "border-rose-200 hover:border-rose-400",
  restaurants: "border-cyan-200 hover:border-cyan-400",
  gyms: "border-orange-200 hover:border-orange-400",
  education: "border-teal-200 hover:border-teal-400",
};

export const SectorGrid: React.FC = () => {
  const { t } = useLocale();
  const data = t.sectorGrid || {};
  const sectors = data.items || [];

  return (
    <section className="py-20 bg-transparent relative overflow-hidden">
      <div className="ambient-glow w-[400px] h-[400px] bg-violet-500/10 top-0 -right-32" />
      <div className="ambient-glow w-[350px] h-[350px] bg-teal-500/[0.07] bottom-0 -left-32" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="inline-block text-sm font-semibold tracking-[0.24em] text-violet-700 uppercase px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50">
            {data.badge}
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-4">
            {data.title}
          </h2>
          <p className="text-slate-500 mt-4">{data.desc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector) => {
            const Icon = iconBySlug[sector.id] || Building2;
            const iconColor = iconColorBySlug[sector.id] || "text-blue-600";
            const border = borderBySlug[sector.id] || "border-blue-200 hover:border-blue-400";
            return (
              <div
                key={sector.id}
                className={`bg-white rounded-2xl p-6 border ${border} shadow-sm transition-all duration-300 hover:bg-slate-50 hover:shadow-md hover:shadow-slate-200/60 flex items-start space-x-4`}
              >
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex-shrink-0">
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {sector.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {sector.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-violet-50 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {data.notFoundTitle}
            </h3>
            <p className="text-slate-600 text-sm mt-1">
              {data.notFoundDesc}
            </p>
          </div>
          <Link
            href="/contact"
            className="mt-4 md:mt-0 inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <span>{data.contactUs}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
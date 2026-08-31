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

const accentBySlug: Record<string, string> = {
  "real-estate": "border-blue-200 hover:border-blue-500",
  "b2b-industry": "border-purple-200 hover:border-purple-500",
  eshop: "border-indigo-200 hover:border-indigo-500",
  hotels: "border-emerald-200 hover:border-emerald-500",
  lawyers: "border-amber-200 hover:border-amber-500",
  doctors: "border-rose-200 hover:border-rose-500",
  restaurants: "border-cyan-200 hover:border-cyan-500",
  gyms: "border-orange-200 hover:border-orange-500",
  education: "border-teal-200 hover:border-teal-500",
};

export const SectorGrid: React.FC = () => {
  const { t } = useLocale();
  const data = t.sectorGrid || {};
  const sectors = data.items || [];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-semibold tracking-wider text-blue-600 uppercase">
            {data.badge}
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-2">
            {data.title}
          </h2>
          <p className="text-slate-600 mt-4">{data.desc}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector) => {
            const Icon = iconBySlug[sector.id] || Building2;
            const accent = accentBySlug[sector.id] || "border-blue-200 hover:border-blue-500";
            return (
              <div
                key={sector.id}
                className={`bg-slate-50/70 rounded-2xl p-6 border ${accent} transition-all duration-300 hover:bg-white hover:shadow-lg flex items-start space-x-4`}
              >
                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex-shrink-0">
                  <Icon className="w-6 h-6 text-slate-700" />
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

        <div className="mt-12 bg-slate-900 text-white rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">
              {data.notFoundTitle}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {data.notFoundDesc}
            </p>
          </div>
          <Link
            href="/contact"
            className="mt-4 md:mt-0 inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <span>{data.contactUs}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

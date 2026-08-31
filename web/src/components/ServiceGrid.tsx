"use client";

import React, { useRef } from "react";
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
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
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

interface TiltCardProps {
  slug: string;
  title: string;
  description: string;
  learnMore: string;
}

function TiltCard({ slug, title, description, learnMore }: TiltCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [12, -12]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 200, damping: 20 });

  const Icon = iconBySlug[slug] || Globe;
  const colors = colorBySlug[slug] || { bg: "bg-blue-50", color: "text-blue-600" };

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const onMouseLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.a
      ref={ref}
      href={`/services/${slug}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ y: -6 }}
      className="group card-space relative flex flex-col justify-between w-80 p-7 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg hover:shadow-2xl transition-shadow duration-300 flex-shrink-0 cursor-pointer"
    >
      <div>
        <div
          style={{ transform: "translateZ(40px)" }}
          className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`w-6 h-6 ${colors.color}`} />
        </div>
        <h3
          style={{ transform: "translateZ(30px)" }}
          className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors"
        >
          {title}
        </h3>
        <p
          style={{ transform: "translateZ(20px)" }}
          className="text-slate-600 text-sm leading-relaxed mb-6"
        >
          {description}
        </p>
      </div>
      <div
        style={{ transform: "translateZ(24px)" }}
        className="flex items-center text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform"
      >
        {learnMore} &rarr;
      </div>
    </motion.a>
  );
}

export const ServiceGrid: React.FC = () => {
  const { t } = useLocale();
  const services = t.serviceGrid || [];
  const tPage = t.servicesPage || {};

  return (
    <section className="py-20 bg-slate-50/50 relative overflow-hidden">
      <div className="ambient-glow w-[500px] h-[500px] bg-blue-500/10 -top-40 -left-40" />
      <div className="ambient-glow w-[400px] h-[400px] bg-purple-500/10 -bottom-40 -right-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-sm font-semibold tracking-wider text-blue-600 uppercase">
            {tPage.badge}
          </p>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mt-2">
            {tPage.title}
          </h2>
          <p className="text-slate-600 mt-4">{tPage.subtitle}</p>
        </div>
      </div>

      {/* Infinite live marquee */}
      <div className="card-space relative z-10 marquee-mask overflow-hidden py-4">
        <div className="marquee-track gap-6 px-6">
          {[...services, ...services].map((service, idx) => (
            <TiltCard
              key={`${service.slug}-${idx}`}
              slug={service.slug}
              title={service.title}
              description={service.description}
              learnMore={tPage.learnMore}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

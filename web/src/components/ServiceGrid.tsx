"use client";

import React, { useRef } from "react";
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

const colorBySlug: Record<string, string> = {
  "web-development": "text-sky-300",
  "eshop-development": "text-purple-300",
  "ux-ui-branding": "text-indigo-300",
  "seo-performance": "text-emerald-300",
  "digital-marketing": "text-amber-300",
  "web-mobile-apps": "text-cyan-300",
  "hosting-support": "text-rose-300",
  "custom-integrations": "text-slate-200",
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
  const color = colorBySlug[slug] || "text-sky-300";

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
      className="group card-space relative flex flex-col justify-between w-80 p-7 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-black/60 hover:border-white/20 transition-all duration-300 flex-shrink-0 cursor-pointer"
    >
      <div>
        <div
          style={{ transform: "translateZ(40px)" }}
          className={`w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <h3
          style={{ transform: "translateZ(30px)" }}
          className="text-xl font-bold text-white mb-2 group-hover:text-sky-200 transition-colors"
        >
          {title}
        </h3>
        <p
          style={{ transform: "translateZ(20px)" }}
          className="text-white/55 text-sm leading-relaxed mb-6"
        >
          {description}
        </p>
      </div>
      <div
        style={{ transform: "translateZ(24px)" }}
        className="flex items-center text-sm font-semibold text-sky-300 group-hover:translate-x-1 transition-transform"
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
    <section className="py-20 relative overflow-hidden bg-transparent">
      <div className="ambient-glow w-[500px] h-[500px] bg-sky-500/10 -top-40 -left-40" />
      <div className="ambient-glow w-[400px] h-[400px] bg-violet-500/10 -bottom-40 -right-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="inline-block text-sm font-semibold tracking-[0.24em] text-sky-200 uppercase px-4 py-1.5 rounded-full border border-sky-400/25 bg-sky-500/10">
            {tPage.badge}
          </p>
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl mt-4">
            {tPage.title}
          </h2>
          <p className="text-white/60 mt-4">{tPage.subtitle}</p>
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
"use client";

import React from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Globe,
  ShoppingBag,
  Palette,
  TrendingUp,
  Megaphone,
  Smartphone,
  Server,
  Code2,
} from "lucide-react";

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

export interface ServiceTheme {
  /** Tailwind text color for accents / icon */
  text: string;
  /** Tailwind class for text color change on hover (complete literal) */
  hoverText: string;
  /** Tailwind color for the icon chip background tint */
  chipBg: string;
  /** Tailwind border accent on hover */
  borderHover: string;
  /** Tailwind gradient stops for the hover glow (e.g. "from-sky-500/25 to-blue-500/10") */
  glow: string;
  /** Hex accent used inline where a static color is needed */
  accent: string;
  /** Soft radial body glow color used around the mounted card */
  aura: string;
}

export const themeBySlug: Record<string, ServiceTheme> = {
  "web-development": {
    text: "text-sky-300",
    hoverText: "group-hover:text-sky-300",
    chipBg: "bg-sky-500/15",
    borderHover: "hover:border-sky-400/40",
    glow: "from-sky-500/25 via-sky-400/5 to-transparent",
    accent: "#7dd3fc",
    aura: "rgba(56,189,248,0.14)",
  },
  "eshop-development": {
    text: "text-purple-300",
    hoverText: "group-hover:text-purple-300",
    chipBg: "bg-purple-500/15",
    borderHover: "hover:border-purple-400/40",
    glow: "from-purple-500/25 via-purple-400/5 to-transparent",
    accent: "#c4b5fd",
    aura: "rgba(168,85,247,0.14)",
  },
  "ux-ui-branding": {
    text: "text-indigo-300",
    hoverText: "group-hover:text-indigo-300",
    chipBg: "bg-indigo-500/15",
    borderHover: "hover:border-indigo-400/40",
    glow: "from-indigo-500/25 via-indigo-400/5 to-transparent",
    accent: "#a5b4fc",
    aura: "rgba(99,102,241,0.14)",
  },
  "seo-performance": {
    text: "text-emerald-300",
    hoverText: "group-hover:text-emerald-300",
    chipBg: "bg-emerald-500/15",
    borderHover: "hover:border-emerald-400/40",
    glow: "from-emerald-500/25 via-emerald-400/5 to-transparent",
    accent: "#6ee7b7",
    aura: "rgba(16,185,129,0.14)",
  },
  "digital-marketing": {
    text: "text-amber-300",
    hoverText: "group-hover:text-amber-300",
    chipBg: "bg-amber-500/15",
    borderHover: "hover:border-amber-400/40",
    glow: "from-amber-500/25 via-amber-400/5 to-transparent",
    accent: "#fcd34d",
    aura: "rgba(245,158,11,0.14)",
  },
  "web-mobile-apps": {
    text: "text-cyan-300",
    hoverText: "group-hover:text-cyan-300",
    chipBg: "bg-cyan-500/15",
    borderHover: "hover:border-cyan-400/40",
    glow: "from-cyan-500/25 via-cyan-400/5 to-transparent",
    accent: "#67e8f9",
    aura: "rgba(6,182,212,0.14)",
  },
  "hosting-support": {
    text: "text-rose-300",
    hoverText: "group-hover:text-rose-300",
    chipBg: "bg-rose-500/15",
    borderHover: "hover:border-rose-400/40",
    glow: "from-rose-500/25 via-rose-400/5 to-transparent",
    accent: "#fda4af",
    aura: "rgba(244,63,94,0.14)",
  },
  "custom-integrations": {
    text: "text-slate-200",
    hoverText: "group-hover:text-slate-200",
    chipBg: "bg-slate-500/15",
    borderHover: "hover:border-slate-300/40",
    glow: "from-slate-400/25 via-slate-300/5 to-transparent",
    accent: "#cbd5e1",
    aura: "rgba(148,163,184,0.14)",
  },
};

interface Service3DCardProps {
  slug: string;
  title: string;
  description: string;
  learnMore: string;
  benefitLabels?: string[];
  chips?: string[];
  className?: string;
  size?: "sm" | "md";
}

export default function Service3DCard({
  slug,
  title,
  description,
  learnMore,
  benefitLabels = [],
  chips = [],
  className = "",
  size = "md",
}: Service3DCardProps) {
  const ref = React.useRef<HTMLAnchorElement>(null);
  const theme = themeBySlug[slug] || themeBySlug["web-development"];

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [9, -9]), {
    stiffness: 200,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-9, 9]), {
    stiffness: 200,
    damping: 22,
  });

  const Icon = iconBySlug[slug] || Globe;

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

  const isCompact = size === "sm";

  return (
    <motion.a
      ref={ref}
      href={`/services/${slug}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      whileHover={{ y: -8 }}
      className={`card-space group ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-3 rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at 30% 20%, ${theme.aura}, transparent 70%)` }}
      />
      <div className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-xl shadow-black/40 transition-colors duration-300 [transform-style:preserve-3d] hover:shadow-2xl hover:shadow-black/60 ${theme.borderHover}`}>
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${theme.glow}`}
        />
        <div
          style={{ transform: "translateZ(50px)" }}
          className="relative flex items-center gap-3.5 border-b border-white/10 px-6 pt-6 pb-5"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 ${theme.chipBg} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className={`h-6 w-6 ${theme.text}`} />
          </div>
          <div className="min-w-0">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: theme.accent }}
            >
              {slug.replace(/-/g, " ")}
            </span>
          </div>
        </div>

        <div style={{ transform: "translateZ(38px)" }} className="relative px-6 pt-5">
          <h3
            className={`font-bold text-white transition-colors ${theme.hoverText} ${
              isCompact ? "text-lg leading-snug" : "text-xl leading-snug"
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-white/55 font-light leading-relaxed ${
              isCompact ? "text-sm mt-2" : "text-sm mt-2.5 mb-5"
            }`}
          >
            {description}
          </p>
        </div>

        {(benefitLabels.length > 0 || chips.length > 0) && (
          <div style={{ transform: "translateZ(26px)" }} className="relative px-6 pb-5">
            <ul className="grid gap-2">
              {benefitLabels.slice(0, 2).map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] text-white/70">
                  <span className="mt-[3px] text-xs font-bold" style={{ color: theme.accent }}>
                    —
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            {chips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {chips.map((c, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-medium tracking-wide text-white/60"
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div
          style={{ transform: "translateZ(30px)" }}
          className={`relative mt-auto flex items-center gap-1.5 px-6 pb-6 pt-2 ${
            isCompact ? "text-sm" : "text-sm"
          } font-semibold transition-transform group-hover:translate-x-1 ${theme.text}`}
        >
          {learnMore}
          <span aria-hidden>&rarr;</span>
        </div>
      </div>
    </motion.a>
  );
}

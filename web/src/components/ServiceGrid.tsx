"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ShoppingBag,
  Globe,
  Palette,
  TrendingUp,
  Megaphone,
  Smartphone,
  Server,
  Code2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { animate, motion, useMotionValue } from "framer-motion";
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

interface ServiceCardProps {
  slug: string;
  title: string;
  description: string;
  learnMore: string;
  suppressClickRef: React.MutableRefObject<boolean>;
}

function ServiceCard({ slug, title, description, learnMore, suppressClickRef }: ServiceCardProps) {
  const Icon = iconBySlug[slug] || Globe;
  const color = colorBySlug[slug] || "text-sky-300";

  return (
    <a
      href={`/services/${slug}`}
      onClick={(e) => {
        if (suppressClickRef.current) {
          e.preventDefault();
          e.stopPropagation();
          suppressClickRef.current = false;
        }
      }}
      className="group relative flex h-[20rem] w-80 flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-7 shadow-lg shadow-black/40 backdrop-blur-xl cursor-pointer [transform-style:preserve-3d] transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-black/60"
    >
      <div>
        <div
          style={{ transform: "translateZ(40px)" }}
          className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="pointer-events-none w-56 h-56 rounded-3xl bg-sky-500/10 blur-3xl absolute -top-8 -right-8 group-hover:opacity-100 opacity-0 transition-opacity duration-500" />
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
    </a>
  );
}

export const ServiceGrid: React.FC = () => {
  const { t } = useLocale();
  const services = t.serviceGrid || [];
  const tPage = t.servicesPage || {};

  const count = services.length;
  const step = count > 0 ? 360 / count : 0;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startX: number; startAngle: number } | null>(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [radius, setRadius] = useState(460);
  const angle = useMotionValue(0);

  useEffect(() => {
    const measure = () => {
      const el = stageRef.current;
      if (!el) return;
      const w = el.clientWidth;
      setRadius(Math.round(Math.min(460, Math.max(280, w * 0.42))));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const snapTo = (target: number) => {
    const t = ((target % count) + count) % count;
    animate(angle, -t * step, {
      type: "spring",
      stiffness: 140,
      damping: 22,
      mass: 0.7,
    });
  };

  const goTo = (dir: number) => {
    const current = Math.round(-angle.get() / step);
    snapTo(current + dir);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = { startX: e.clientX, startAngle: angle.get() };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = e.clientX - drag.startX;
    const clamped = Math.max(-24, Math.min(24, delta));
    angle.set(drag.startAngle + clamped * 0.15);
  };

  const onPointerEnd = () => {
    const drag = dragRef.current;
    if (!drag) return;
    const moved = Math.abs(angle.get() - drag.startAngle);
    dragRef.current = null;
    setIsDragging(false);
    if (moved > 6) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
    const raw = Math.round(-angle.get() / step);
    const target = ((raw % count) + count) % count;
    snapTo(target);
  };

  if (count === 0) return null;

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

      <div className="relative z-10">
        <div
          ref={stageRef}
          className="relative h-[26rem] select-none"
          style={{
            perspective: "1600px",
            touchAction: "pan-y",
            cursor: isDragging ? "grabbing" : "grab",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <motion.div
            className="absolute inset-0 h-full w-full [transform-style:preserve-3d]"
            style={{ rotateY: angle }}
          >
            {services.map((service, i) => (
              <div
                key={service.slug}
                className="absolute left-1/2 top-1/2 [backface-visibility:hidden]"
                style={{
                  transform: `translate(-50%,-50%) rotateY(${(i * step).toFixed(2)}deg) translateZ(${radius}px)`,
                }}
              >
                <ServiceCard
                  slug={service.slug}
                  title={service.title}
                  description={service.description}
                  learnMore={tPage.learnMore}
                  suppressClickRef={suppressClickRef}
                />
              </div>
            ))}
          </motion.div>

          <button
            type="button"
            aria-label={tPage.prev}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => goTo(-1)}
            className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-8 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-95 shadow-lg shadow-black/30"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </button>

          <button
            type="button"
            aria-label={tPage.next}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => goTo(1)}
            className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-8 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition-all duration-300 hover:bg-white/20 hover:scale-110 active:scale-95 shadow-lg shadow-black/30"
          >
            <ChevronRight className="h-6 w-6" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
};
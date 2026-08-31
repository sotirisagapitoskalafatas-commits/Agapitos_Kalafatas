"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useLocale } from "@/contexts/LanguageContext";

const projectImages = ["/images/image5.jpg", "/images/image6.jpg", "/images/image7.jpg", "/images/image8.jpg"];

interface StackCardProps {
  i: number;
  range: [number, number];
  targetScale: number;
  progress: MotionValue<number>;
  title: string;
  desc: string;
  tag: string;
  img: string;
}

function StackCard({ i, range, targetScale, progress, title, desc, tag, img }: StackCardProps) {
  const scale = useTransform(progress, range, [1, targetScale]);
  const opacity = useTransform(progress, range, [1, 0.55]);

  return (
    <div
      className="sticky h-screen flex items-center justify-center"
      style={{ top: `calc(4vh + ${i * 3}vh)` }}
    >
      <motion.div
        style={{ scale, opacity }}
        className="relative w-full max-w-4xl mx-4 rounded-3xl overflow-hidden bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl shadow-slate-900/10 p-2"
      >
        <div className="relative overflow-hidden rounded-2xl">
          <img src={img} alt={title} className="w-full h-72 object-cover bg-slate-900" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
          <span className="absolute top-4 left-4 glass-strong px-3 py-1 rounded-full text-xs font-semibold text-slate-700">
            {tag}
          </span>
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-2xl md:text-3xl font-bold text-white drop-shadow">{title}</h3>
            <p className="text-slate-200 text-sm mt-1 max-w-xl drop-shadow">{desc}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export const StackedProjects: React.FC = () => {
  const { t } = useLocale();
  const container = useRef<HTMLDivElement>(null);
  const items = t.projects.items || [];
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  return (
    <section id="projects" className="bg-white relative">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-8 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 mb-6">
          {t.projects.badge}
        </span>
        <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">
          {t.projects.title.split(" ")[0]}{" "}
          <span className="gradient-text">{t.projects.title.split(" ").slice(1).join(" ")}</span>
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">{t.projects.subtitle}</p>
      </div>

      <div ref={container} className="relative" style={{ height: `${items.length * 100 + 40}vh` }}>
        {items.map((p, i) => {
          const targetScale = 1 - (items.length - i) * 0.05;
          return (
            <StackCard
              key={i}
              i={i}
              range={[i * (1 / items.length), 1]}
              targetScale={targetScale}
              progress={scrollYProgress}
              title={p.title}
              desc={p.desc}
              tag={p.tag}
              img={projectImages[i]}
            />
          );
        })}
      </div>
    </section>
  );
};

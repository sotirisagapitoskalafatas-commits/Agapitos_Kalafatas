"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
if (typeof window !== "undefined") ScrollTrigger.config({ ignoreMobileResize: true });

/**
 * AtmosTransition
 * ---------------
 * Global cinematic section bridge. Replaces hard seams / divider bars.
 *
 * Visual model: the dark section above dissolves into LAYERED, predominantly
 * WHITE volumetric mist (cloud puffs at different heights, widths, blur and
 * parallax speeds) which then merges seamlessly into the light section below.
 *
 * - No solid shapes, no straight divider, no saturated blue band.
 * - Multiple independent mist layers with jagged/asymmetric silhouettes.
 * - GSAP ScrollTrigger scrub parallax (each layer drifts while the white haze
 *   brightens) → "dark giving way to cloud".
 * - Fully configurable per page (variant, colors, height, intensity, density,
 *   scrub, drift, particles) and responsive (desktop 180–260 / tablet 150–210 /
 *   mobile 100–160).
 */

type Variant = "dark-light" | "dark-dark" | "light-light";

type AtmosTransitionProps = {
  /** Adaptive palette. Default "auto" reads the colors of the two sections it bridges. */
  variant?: "auto" | Variant;
  /** Override the color of the section ABOVE the seam (default: auto-detected). */
  from?: string;
  /** Override the color of the section BELOW the seam (default: auto-detected). */
  to?: string;
  /** Height of the mist band in px at desktop (clamped to 180–260). Scales down on tablet/mobile. */
  height?: number;
  /** Show drifting dust particles. Default true. */
  particles?: boolean;
  /** Mist opacity multiplier (0.4–1.6, default 1). */
  intensity?: number;
  /** Particle density multiplier (0.4–3, default 1). */
  density?: number;
  /** ScrollTrigger scrub seconds (default 1.2). */
  scrub?: number;
  /** Mist parallax travel multiplier (0–2, default 1). */
  drift?: number;
  className?: string;
  style?: CSSProperties;
};

type Rgb = { r: number; g: number; b: number };

const DARK = "#05080D";

function hexToRgb(c: string): Rgb | null {
  let m = c.match(/^#([0-9a-f]{3})$/i);
  if (m) {
    const r = parseInt(m[1][0] + m[1][0], 16);
    const g = parseInt(m[1][1] + m[1][1], 16);
    const b = parseInt(m[1][2] + m[1][2], 16);
    return { r, g, b };
  }
  m = c.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    return {
      r: parseInt(m[1].slice(0, 2), 16),
      g: parseInt(m[1].slice(2, 4), 16),
      b: parseInt(m[1].slice(4, 6), 16),
    };
  }
  m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) {
    return { r: +m[1], g: +m[2], b: +m[3] };
  }
  return null;
}

/** Best-effort resolution of a section's background color (image first stop, then color, then ancestors). */
function resolveBg(el: HTMLElement | null, hops = 3): Rgb | null {
  if (!el) return null;
  const style = getComputedStyle(el);
  const img = style.backgroundImage;
  if (img && img !== "none") {
    const m = img.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/);
    const hex = img.match(/#[0-9a-f]{3,8}/i);
    if (m) return hexToRgb(m[0]);
    if (hex) return hexToRgb(hex[0]);
  }
  const bg = style.backgroundColor;
  if (bg && bg !== "transparent") {
    const c = hexToRgb(bg);
    if (c) return c;
  }
  if (hops > 0 && el.parentElement) return resolveBg(el.parentElement, hops - 1);
  return null;
}

function luminance(c: Rgb): number {
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}

/** Irregular, asymmetric white cloud blob. */
function mistGradient(cx: number, cy: number, sx: number): string {
  return `radial-gradient(ellipse ${sx}% 58% at ${cx}% ${cy}%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.42) 42%, rgba(255,255,255,0) 74%)`;
}

/** Ground haze that merges into the light section below — the "curtain" is a soft radial, never a line. */
const HAZE_GRADIENT =
  "radial-gradient(ellipse 150% 80% at 50% 100%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.32) 55%, rgba(255,255,255,0) 80%)";

type MistSpec = {
  left: string;
  width: string;
  h: number; // height as multiple of H
  bottom: number; // % of H
  blur: number;
  cx: number;
  cy: number;
  sx: number; // gradient horizontal stretch %
};

const MIST: MistSpec[] = [
  { left: "-14%", width: "58%", h: 1.5, bottom: 34, blur: 30, cx: 55, cy: 60, sx: 84 },
  { left: "40%", width: "62%", h: 2.2, bottom: -4, blur: 26, cx: 40, cy: 52, sx: 78 },
  { left: "64%", width: "56%", h: 1.6, bottom: 46, blur: 34, cx: 35, cy: 45, sx: 88 },
  { left: "-6%", width: "60%", h: 1.9, bottom: 12, blur: 28, cx: 60, cy: 48, sx: 76 },
  { left: "24%", width: "74%", h: 1.3, bottom: 58, blur: 40, cx: 50, cy: 70, sx: 92 },
];

type Palette = {
  hazeOp: number;
  glowA: string;
  glowB: string;
  mists: number[]; // per-layer opacity
  particle: Rgb;
  particleMax: number;
  bokeh: boolean;
};

function buildPalette(variant: Variant): Palette {
  if (variant === "dark-light") {
    return {
      hazeOp: 0.9,
      glowA: "rgba(228,241,255,0.16)",
      glowB: "rgba(255,255,255,0.05)",
      mists: [0.5, 0.85, 0.4, 0.62, 0.3],
      particle: { r: 232, g: 240, b: 250 },
      particleMax: 0.45,
      bokeh: true,
    };
  }
  if (variant === "dark-dark") {
    return {
      hazeOp: 0.55,
      glowA: "rgba(214,230,250,0.1)",
      glowB: "rgba(255,255,255,0.03)",
      mists: [0.32, 0.5, 0.26, 0.38, 0.2],
      particle: { r: 226, g: 235, b: 246 },
      particleMax: 0.3,
      bokeh: true,
    };
  }
  return {
    hazeOp: 0.32,
    glowA: "rgba(226,240,255,0.1)",
    glowB: "rgba(255,255,255,0.04)",
    mists: [0.16, 0.26, 0.12, 0.2, 0.1],
    particle: { r: 148, g: 176, b: 210 },
    particleMax: 0.22,
    bokeh: false,
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function AtmosTransition({
  variant: variantProp = "auto",
  from: fromProp,
  to: toProp,
  height = 220,
  particles = true,
  intensity = 1,
  density = 1,
  scrub = 1.2,
  drift = 1,
  className = "",
  style,
}: AtmosTransitionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Band height in px — responsive: desktop 180–260, tablet 150–210, mobile 100–160.
  const [h, setH] = useState<number>(height);

  useEffect(() => {
    const computeH = () => {
      const vh = Math.max(window.innerHeight, 640);
      const w = window.innerWidth;
      const raw = w < 768 ? Math.min(height, vh * 0.18) : w < 1280 ? Math.min(height, vh * 0.22) : Math.min(height, vh * 0.26);
      return clamp(Math.round(raw), 100, Math.min(height, 260));
    };
    setH(computeH());
    if (typeof window === "undefined") return;
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setH(computeH()));
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [height]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prev = root.previousElementSibling as HTMLElement | null;
    const next = root.nextElementSibling as HTMLElement | null;

    let fromC = fromProp ? hexToRgb(fromProp) : null;
    if (!fromC && prev) fromC = resolveBg(prev);
    if (!fromC) {
      const p = prev || root.parentElement;
      if (p) fromC = resolveBg(p);
    }
    let toC = toProp ? hexToRgb(toProp) : null;
    if (!toC && next) toC = resolveBg(next);
    if (!toC && root.parentElement) toC = resolveBg(root.parentElement);

    const f = fromC || hexToRgb(DARK)!;
    const t = toC || { r: 247, g: 248, b: 251 };

    let variant: Variant;
    if (variantProp !== "auto") variant = variantProp;
    else {
      const df = luminance(f) < 0.4;
      const dt = luminance(t) < 0.4;
      variant = df && !dt ? "dark-light" : df && dt ? "dark-dark" : "light-light";
    }

    const palette = buildPalette(variant);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const H = h;
    const mistOpacity = (i: number) => clamp(palette.mists[i] * intensity, 0, 1.2);

    const haze = hazeRef.current;
    const glow = glowRef.current;
    const layers = layerRefs.current;
    const canvas = canvasRef.current;

    // --- Static paint -------------------------------------------------------
    if (haze) {
      haze.style.background = HAZE_GRADIENT;
      haze.style.height = `${Math.round(H * 1.8)}px`;
      haze.style.bottom = `${-Math.round(H * 0.85)}px`;
      haze.style.opacity = String(clamp(palette.hazeOp * Math.max(0.5, intensity), 0, 1.2));
    }
    if (glow) {
      glow.style.background = `radial-gradient(ellipse 48% 64% at 50% 70%, ${palette.glowA}, ${palette.glowB} 46%, transparent 74%)`;
      glow.style.height = `${Math.round(H * 2.6)}px`;
      glow.style.bottom = `${-Math.round(H * 1.2)}px`;
    }
    layers.forEach((el, i) => {
      if (!el) return;
      const spec = MIST[i];
      el.style.height = `${Math.round(spec.h * H)}px`;
      el.style.bottom = `${Math.round((spec.bottom / 100) * H)}px`;
      el.style.background = mistGradient(spec.cx, spec.cy, spec.sx);
      el.style.opacity = String(mistOpacity(i));
    });

    // --- Scroll parallax ----------------------------------------------------
    let ctx: gsap.Context | undefined;

    if (!reduce) {
      ctx = gsap.context(() => {
        const tie = {
          scrub,
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          ease: "none",
        };
        const sway = [-14, 12, -10, 16, -7];
        const rise = [0.8, 1.05, 0.55, 1.2, 0.5];
        layers.forEach((el, i) => {
          if (!el) return;
          const travel = Math.min(H * 0.9, 190) * drift * rise[i];
          gsap.fromTo(
            el,
            { y: H * 0.06, x: -sway[i] * drift, scale: 1 },
            { y: -travel, x: sway[i] * drift, scale: 1.16, scrollTrigger: tie }
          );
        });
        if (haze) {
          gsap.fromTo(
            haze,
            { y: 0, x: 0, opacity: clamp(palette.hazeOp, 0, 1) * 0.4 },
            { y: H * 0.16, x: 10 * drift, opacity: clamp(palette.hazeOp, 0, 1), scrollTrigger: tie }
          );
        }
        if (glow) {
          gsap.fromTo(
            glow,
            { y: 0, scale: 1, opacity: 0.45 },
            { y: -H * 0.3 * drift, scale: 1.26, opacity: 1, scrollTrigger: tie }
          );
        }
      }, root);
    }

    // --- Dust particles -----------------------------------------------------
    let raf = 0;
    let running = false;

    if (particles && canvas) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const base = window.innerWidth < 768 ? 22 : window.innerWidth < 1280 ? 34 : 46;
      const budget = Math.round(clamp(base * density, 0, 140));
      const bokehCount = palette.bokeh ? Math.max(2, Math.round(budget * 0.14)) : 0;
      const part = Array.from({ length: budget }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: 0.3 + Math.random() * 1.4,
        soft: false,
        speed: 0.02 + Math.random() * 0.07,
        alpha: 0.1 + Math.random() * palette.particleMax,
        drift: (Math.random() - 0.5) * 0.05,
      }));
      for (let i = 0; i < bokehCount; i++) {
        part[i].size = 2.4 + Math.random() * 2.6;
        part[i].soft = true;
        part[i].alpha *= 0.4;
      }

      const draw = () => {
        const w = canvas.clientWidth;
        const hh = canvas.clientHeight;
        if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
        if (canvas.height !== Math.round(hh * dpr)) canvas.height = Math.round(hh * dpr);
        const c = canvas.getContext("2d");
        if (!c) return;
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.fillStyle = `rgba(${palette.particle.r},${palette.particle.g},${palette.particle.b},1)`;
        for (const p of part) {
          p.y -= p.speed * 0.016;
          p.x += p.drift;
          if (p.y < -0.02) {
            p.y = 1.02;
            p.x = Math.random();
          }
          c.globalAlpha = p.alpha;
          c.beginPath();
          c.arc(p.x * canvas.width, p.y * canvas.height, p.size * dpr, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
        raf = requestAnimationFrame(draw);
      };

      const io = new IntersectionObserver(
        (entries) => {
          const visible = entries[0]?.isIntersecting;
          if (visible && !running) {
            running = true;
            raf = requestAnimationFrame(draw);
          } else if (!visible && running) {
            running = false;
            cancelAnimationFrame(raf);
          }
        },
        { threshold: 0.01 }
      );
      io.observe(canvas);

      if (reduce) {
        const w = canvas.clientWidth;
        const hh = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(hh * dpr);
        const c = canvas.getContext("2d");
        if (c) {
          c.fillStyle = `rgba(${palette.particle.r},${palette.particle.g},${palette.particle.b},1)`;
          for (const p of part) {
            c.globalAlpha = p.alpha * 0.6;
            c.beginPath();
            c.arc(p.x * canvas.width, p.y * canvas.height, p.size * dpr, 0, Math.PI * 2);
            c.fill();
          }
          c.globalAlpha = 1;
        }
      }

      return () => {
        ctx?.revert();
        cancelAnimationFrame(raf);
        running = false;
        io.disconnect();
      };
    }

    return () => {
      ctx?.revert();
      cancelAnimationFrame(raf);
      running = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h, variantProp, fromProp, toProp, height, particles, intensity, density, scrub, drift]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "relative",
        height: h,
        marginTop: -h,
        zIndex: 30,
        pointerEvents: "none",
        overflow: "hidden",
        isolation: "isolate",
        ...style,
      }}
    >
      {/* Faint pale-ice glow — the only blue allowed, a whisper behind the clouds */}
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          left: "-15%",
          width: "130%",
          filter: "blur(60px)",
          willChange: "transform, opacity",
        }}
      />
      {/* Ground haze: merges seamlessly into the light section below */}
      <div
        ref={hazeRef}
        style={{
          position: "absolute",
          left: "-25%",
          width: "150%",
          filter: "blur(46px)",
          willChange: "transform, opacity",
        }}
      />
      {/* Volumetric white mist layers — irregular, asymmetric, no solid shape */}
      {MIST.map((spec, i) => (
        <div
          key={spec.left + i}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          style={{
            position: "absolute",
            left: spec.left,
            width: spec.width,
            borderRadius: "50%",
            filter: `blur(${spec.blur}px)`,
            willChange: "transform, opacity",
          }}
        />
      ))}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </div>
  );
}
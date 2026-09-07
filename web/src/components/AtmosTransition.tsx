"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
if (typeof window !== "undefined") ScrollTrigger.config({ ignoreMobileResize: true });

type Variant = "dark-light" | "dark-dark" | "light-light";

type AtmosTransitionProps = {
  /** Adaptive palette. Default "auto" reads the colors of the two sections it bridges. */
  variant?: "auto" | Variant;
  /** Override the color of the section ABOVE the seam (default: auto-detected). */
  from?: string;
  /** Override the color of the section BELOW the seam (default: auto-detected). */
  to?: string;
  /** Height of the atmospheric band in px. Default 150 (scales down on mobile). */
  height?: number;
  /** Show drifting dust particles. Default true. */
  particles?: boolean;
  className?: string;
  style?: CSSProperties;
};

type Rgb = { r: number; g: number; b: number };

const DARK = "#05080D";
const LIGHT = "#f7f8fb";

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

function toHex(c: Rgb): string {
  return "#" + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function luminance(c: Rgb): number {
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function rgba(c: Rgb, a: number): string {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
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

const BLUE_A = { r: 96, g: 165, b: 250 };
const BLUE_B = { r: 56, g: 120, b: 220 };

function buildPalette(fromColor: Rgb, variant: Variant) {
  if (variant === "dark-light") {
    return {
      glowA: rgba(BLUE_A, 0.28),
      glowB: rgba(BLUE_B, 0.12),
      mist1: rgba({ r: 148, g: 197, b: 255 }, 0.3),
      mist2: rgba({ r: 255, g: 255, b: 255 }, 0.22),
      shadow: rgba(BLUE_A, 0.12),
      particle: { r: 190, g: 225, b: 255 },
      curve: LIGHT,
    };
  }
  if (variant === "dark-dark") {
    const near = mix(fromColor, BLUE_B, 0.5);
    return {
      glowA: rgba(BLUE_A, 0.16),
      glowB: rgba(mix(fromColor, BLUE_B, 0.25), 0.18),
      mist1: rgba({ r: 120, g: 170, b: 230 }, 0.13),
      mist2: rgba({ r: 180, g: 205, b: 255 }, 0.1),
      shadow: rgba({ r: 90, g: 140, b: 210 }, 0.08),
      particle: { r: 200, g: 225, b: 255 },
      curve: toHex(near),
    };
  }
  const lightCurve = mix(fromColor, { r: 30, g: 41, b: 59 }, 0.02);
  return {
    glowA: rgba({ r: 140, g: 190, b: 255 }, 0.22),
    glowB: rgba({ r: 180, g: 215, b: 255 }, 0.1),
    mist1: rgba({ r: 180, g: 215, b: 255 }, 0.26),
    mist2: rgba({ r: 235, g: 245, b: 255 }, 0.35),
    shadow: rgba({ r: 120, g: 170, b: 230 }, 0.06),
    particle: { r: 120, g: 170, b: 235 },
    curve: toHex(mix(lightCurve, { r: 247, g: 248, b: 251 }, 0.35)),
  };
}

export default function AtmosTransition({
  variant: variantProp = "auto",
  from: fromProp,
  to: toProp,
  height = 150,
  particles = true,
  className = "",
  style,
}: AtmosTransitionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const mist1Ref = useRef<HTMLDivElement>(null);
  const mist2Ref = useRef<HTMLDivElement>(null);
  const curveRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const t = toC || hexToRgb(LIGHT)!;

    let variant: Variant;
    if (variantProp !== "auto") variant = variantProp;
    else {
      const df = luminance(f) < 0.4;
      const dt = luminance(t) < 0.4;
      variant = df && !dt ? "dark-light" : df && dt ? "dark-dark" : "light-light";
    }

    const palette = buildPalette(f, variant);
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const vh = Math.max(window.innerHeight, 640);
    const H = Math.round(Math.min(height, vh * 0.22));

    const glow = glowRef.current;
    const mist1 = mist1Ref.current;
    const mist2 = mist2Ref.current;
    const curve = curveRef.current;
    const canvas = canvasRef.current;

    if (glow) {
      glow.style.background = `radial-gradient(ellipse at 50% 62%, ${palette.glowA}, ${palette.glowB} 38%, transparent 70%)`;
      glow.style.height = `${Math.round(H * 2.6)}px`;
      glow.style.bottom = `${-Math.round(H * 0.9)}px`;
    }
    if (mist1) {
      mist1.style.background = `radial-gradient(ellipse, ${palette.mist1}, transparent 68%)`;
      mist1.style.height = `${Math.round(H * 0.72)}px`;
      mist1.style.bottom = `${Math.round(H * 0.36)}px`;
    }
    if (mist2) {
      mist2.style.background = `radial-gradient(ellipse, ${palette.mist2}, transparent 64%)`;
      mist2.style.height = `${Math.round(H * 0.66)}px`;
      mist2.style.bottom = `${Math.round(H * 0.16)}px`;
    }
    if (curve) {
      curve.style.height = `${Math.round(H * 2.6)}px`;
      curve.style.bottom = `${-Math.round(H * 1.4)}px`;
      curve.style.background = palette.curve;
      curve.style.boxShadow = `0 -${Math.round(H * 0.12)}px ${Math.round(H * 0.4)}px ${palette.shadow}`;
    }

    let ctx: gsap.Context | undefined;

    if (!reduce) {
      ctx = gsap.context(() => {
        const tie = { scrub: 1.2, trigger: root, start: "top bottom", end: "bottom top", ease: "none" };
        if (mist1) {
          gsap.fromTo(
            mist1,
            { y: 0, scale: 1 },
            { y: -Math.min(54, Math.round(H * 0.36)), scale: 1.18, scrollTrigger: tie }
          );
        }
        if (mist2) {
          gsap.fromTo(
            mist2,
            { y: 14, scale: 1 },
            { y: -Math.min(84, Math.round(H * 0.56)), scale: 1.22, scrollTrigger: tie }
          );
        }
        if (glow) {
          gsap.fromTo(
            glow,
            { y: 0, scale: 1, opacity: 0.7 },
            { y: -Math.min(64, Math.round(H * 0.42)), scale: 1.3, opacity: 1, scrollTrigger: tie }
          );
        }
        if (curve) {
          gsap.fromTo(
            curve,
            { y: 0, scaleX: 1 },
            { y: -Math.min(74, Math.round(H * 0.5)), scaleX: 1.07, scrollTrigger: tie }
          );
        }
      }, root);
    }

    let raf = 0;
    let running = false;

    if (particles && canvas) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const budget =
        window.innerWidth < 768 ? 22 : window.innerWidth < 1280 ? 34 : 46;
      const part = Array.from({ length: budget }, () => ({
        x: Math.random(),
        y: Math.random(),
        size: 0.3 + Math.random() * 1.4,
        speed: 0.02 + Math.random() * 0.07,
        alpha: 0.1 + Math.random() * (variant === "light-light" ? 0.3 : 0.4),
        drift: (Math.random() - 0.5) * 0.05,
      }));

      const draw = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
        if (canvas.height !== Math.round(h * dpr)) canvas.height = Math.round(h * dpr);
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
          const px = p.x * canvas.width;
          const py = p.y * canvas.height;
          c.globalAlpha = p.alpha;
          c.beginPath();
          c.arc(px, py, p.size * dpr, 0, Math.PI * 2);
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
        const h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const c = canvas.getContext("2d");
        if (c) {
          c.fillStyle = `rgba(${palette.particle.r},${palette.particle.g},${palette.particle.b},0.5)`;
          for (const p of part) {
            c.globalAlpha = p.alpha * 0.6;
            c.beginPath();
            c.arc(p.x * canvas.width, p.y * canvas.height, p.size * dpr, 0, Math.PI * 2);
            c.fill();
          }
          c.globalAlpha = 1;
        }
      }

      const cleanupIo = () => io.disconnect();
      return () => {
        ctx?.revert();
        cancelAnimationFrame(raf);
        running = false;
        cleanupIo();
      };
    }

    return () => {
      ctx?.revert();
      cancelAnimationFrame(raf);
      running = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantProp, fromProp, toProp, height, particles]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "relative",
        height: Math.max(height, 90),
        marginTop: -Math.max(height, 90),
        zIndex: 30,
        pointerEvents: "none",
        ...style,
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          ref={glowRef}
          style={{
            position: "absolute",
            left: "50%",
            width: "92%",
            transform: "translateX(-50%)",
            filter: "blur(38px)",
            willChange: "transform, opacity",
          }}
        />
        <div
          ref={mist1Ref}
          style={{
            position: "absolute",
            left: "-16%",
            width: "132%",
            borderRadius: "50%",
            filter: "blur(26px)",
            willChange: "transform",
          }}
        />
        <div
          ref={mist2Ref}
          style={{
            position: "absolute",
            left: "-10%",
            width: "120%",
            borderRadius: "50%",
            filter: "blur(22px)",
            willChange: "transform",
          }}
        />
        <div
          ref={curveRef}
          style={{
            position: "absolute",
            left: "50%",
            width: "135%",
            transform: "translateX(-48%) rotate(-1.8deg)",
            transformOrigin: "50% 0%",
            borderRadius: "50% 50% 0 0",
            willChange: "transform",
          }}
        />
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
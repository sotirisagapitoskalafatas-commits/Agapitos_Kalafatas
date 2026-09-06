"use client";

/**
 * LumenScrollHero — Next.js/React port of the WordPress lumen/scroll-sequence-hero.
 *
 * A pinned viewport that renders a Canvas image sequence (123 frames)
 * scrubbed by scroll. Same behaviour as the LUMEN reference:
 *   0% scroll  → frame 001
 *   100% scroll → frame 123
 *
 * - Cover-fit math, aspect-preserving crop
 * - DPR capped at 2
 * - Progressive frame loading (warm-up batch + idle throttled + priority-around-target)
 * - Damped current→target interpolation (fast scrolls don't strobe)
 * - `<img>` fallback until Canvas paints anything
 * - Static fallback for reduced-motion / saveData
 *
 * Place frames at:  /public/images/ezgif-frame-001.jpg .. -123.jpg
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LanguageContext";

interface Props {
  /** Frame prefix, default matches the LUMEN assets */
  prefix?: string;
  /** Total number of frames, default 123 */
  count?: number;
  /** Public path to the folder that contains the frames */
  folder?: string;
  /** Scroll runway in vh — 400 = 4× viewport height of pinned scroll */
  scrollVh?: number;
}

function pad(n: number, w: number) {
  let s = String(n);
  while (s.length < w) s = "0" + s;
  return s;
}

export default function LumenScrollHero({
  prefix = "ezgif-frame-",
  count = 123,
  folder = "/images",
  scrollVh = 400,
}: Props) {
  const { t } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLImageElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const fallback = fallbackRef.current;
    if (!root || !canvas || !fallback) return;

    // Guards for user preferences
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection;
    const saveData = conn && conn.saveData === true;

    if (reduceMotion || saveData) {
      canvas.style.display = "none";
      fallback.style.opacity = "1";
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const images = new Array<HTMLImageElement | null>(count).fill(null);
    const loaded = new Array<boolean>(count).fill(false);
    let targetIdx = 0;
    let currentIdx = 0;
    let scheduled = false;

    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr()));
      const h = Math.max(1, Math.floor(rect.height * dpr()));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
    };

    const frameUrl = (i: number) =>
      `${folder}/${prefix}${pad(i + 1, 3)}.jpg`;

    const loadFrame = (i: number, priority = false) => {
      if (i < 0 || i >= count || loaded[i] || images[i]) return;
      const img = new Image();
      img.decoding = "async";
      if (priority) (img as unknown as { fetchPriority?: string }).fetchPriority = "high";
      img.src = frameUrl(i);
      images[i] = img;
      const onDone = () => {
        loaded[i] = true;
        if (Math.abs(i - Math.round(currentIdx)) < 2) schedule();
      };
      if (typeof img.decode === "function") {
        img.decode().then(onDone).catch(onDone);
      } else {
        img.onload = onDone;
        img.onerror = onDone;
      }
    };

    const nearestLoaded = (i: number) => {
      for (let d = 0; d < count; d++) {
        const a = i - d;
        const b = i + d;
        if (a >= 0 && loaded[a]) return a;
        if (b < count && loaded[b]) return b;
      }
      return -1;
    };

    const draw = () => {
      scheduled = false;
      sizeCanvas();
      const w = canvas.width;
      const h = canvas.height;
      let idx = Math.round(currentIdx);
      if (idx < 0) idx = 0;
      if (idx >= count) idx = count - 1;
      let img = loaded[idx] ? images[idx] : null;
      if (!img) {
        const near = nearestLoaded(idx);
        if (near !== -1) img = images[near];
      }
      if (!img) return;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return;
      const canvasRatio = w / h;
      const imgRatio = iw / ih;
      let drawW: number, drawH: number, dx: number, dy: number;
      if (imgRatio > canvasRatio) {
        drawH = h;
        drawW = h * imgRatio;
        dx = (w - drawW) / 2;
        dy = 0;
      } else {
        drawW = w;
        drawH = w / imgRatio;
        dx = 0;
        dy = (h - drawH) / 2;
      }
      ctx.fillStyle = "#05080D";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, dx, dy, drawW, drawH);
      if (fallback.style.opacity !== "0") fallback.style.opacity = "0";
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(draw);
    };

    // Damped current→target loop
    let raf = 0;
    const tickInterp = () => {
      const diff = targetIdx - currentIdx;
      if (Math.abs(diff) > 0.01) {
        currentIdx += diff * 0.22;
        schedule();
      }
      raf = requestAnimationFrame(tickInterp);
    };

    const updateFromScroll = () => {
      const rect = root.getBoundingClientRect();
      const runway = root.offsetHeight - window.innerHeight;
      if (runway <= 0) return;
      let progress = (0 - rect.top) / runway;
      if (progress < 0) progress = 0;
      else if (progress > 1) progress = 1;
      targetIdx = progress * (count - 1);

      // Heading opacity phased with scroll
      const setOp = (el: HTMLElement | null, v: number) => {
        if (el) el.style.opacity = String(v);
      };
      let opacity = 1;
      if (progress > 0.15 && progress < 0.35) {
        opacity = 1 - (progress - 0.15) / 0.2;
      } else if (progress >= 0.35) {
        opacity = 0;
      }
      setOp(headingRef.current, opacity);
      setOp(subtitleRef.current, opacity);
      setOp(ctasRef.current, opacity);

      // Prioritise ±6 frames around target
      const t = Math.round(targetIdx);
      for (let d = 0; d <= 6; d++) {
        loadFrame(t + d);
        if (d > 0) loadFrame(t - d);
      }
    };

    // Preload strategy
    loadFrame(0, true);
    for (let i = 1; i < Math.min(10, count); i++) loadFrame(i);
    let next = 10;
    type IdleDeadline = { timeRemaining: () => number; didTimeout: boolean };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idle =
      (window as any).requestIdleCallback ||
      ((cb: (d: IdleDeadline) => void) =>
        window.setTimeout(
          () => cb({ timeRemaining: () => 8, didTimeout: false }),
          120
        ));
    const step = (d: IdleDeadline) => {
      let perTick = 6;
      while (perTick-- > 0 && next < count && (d.timeRemaining() > 1 || d.didTimeout)) {
        loadFrame(next);
        next++;
      }
      if (next < count) idle(step);
    };
    idle(step);

    // Listeners
    let scrollScheduled = false;
    const onScroll = () => {
      if (scrollScheduled) return;
      scrollScheduled = true;
      requestAnimationFrame(() => {
        scrollScheduled = false;
        updateFromScroll();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        sizeCanvas();
        schedule();
      }, 100);
    };
    window.addEventListener("resize", onResize, { passive: true });

    sizeCanvas();
    updateFromScroll();
    schedule();
    raf = requestAnimationFrame(tickInterp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    };
  }, [prefix, count, folder]);

  return (
    <section
      ref={rootRef}
      className="relative w-full bg-[#05080D] text-white"
      style={{ height: `${scrollVh}vh` }}
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: "100svh" }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-[2] block h-full w-full object-cover"
          aria-hidden="true"
        />
        <img
          ref={fallbackRef}
          src={`${folder}/${prefix}001.jpg`}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-[1] block h-full w-full object-cover transition-opacity duration-200"
          loading="eager"
          decoding="async"
        />
        {/* Cinematic dark scrim */}
        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(5,8,13,0.55), rgba(5,8,13,0.15) 40%, rgba(5,8,13,0.65) 100%), radial-gradient(circle at 50% 55%, transparent 0%, rgba(5,8,13,0.35) 75%)",
          }}
        />
        {/* Warm amber vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-[3] mix-blend-screen"
          style={{
            background:
              "radial-gradient(600px 400px at 50% 45%, rgba(245,158,11,0.08), transparent 70%)",
          }}
        />
        {/* Foreground content */}
        <div className="relative z-[4] flex h-full flex-col items-center justify-center px-6 text-center">
          <p
            ref={subtitleRef}
            className="mb-4 text-[10px] font-medium uppercase tracking-[0.32em] text-amber-200/80 transition-opacity duration-200"
          >
            {t.hero.badge}
          </p>
          <h1
            ref={headingRef}
            className="font-light uppercase leading-[0.95] tracking-[0.02em] text-[clamp(2.75rem,7vw,7rem)] text-[#F1EDE4] transition-opacity duration-200"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}
          >
            {t.hero.title1}
            <br />
            <span className="bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 bg-clip-text text-transparent">
              {t.hero.title2}
            </span>
          </h1>
          <div
            ref={ctasRef}
            className="mt-10 flex items-center justify-center gap-4 transition-opacity duration-200"
          >
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-all hover:bg-amber-200"
            >
              {t.hero.cta1}
              <span>→</span>
            </Link>
            <a
              href="https://linkedin.com/in/agapitos-kalafatas-red-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-medium text-white backdrop-blur transition-all hover:bg-white/10"
            >
              {t.hero.cta2}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

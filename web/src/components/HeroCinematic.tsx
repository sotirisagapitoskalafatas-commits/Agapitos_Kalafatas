"use client";

/**
 * LUMEN-style cinematic hero.
 *
 * Renders a pinned, scroll-scrubbed sequence:
 *   Phase 1 (0.0 – 0.25) — atmospheric wide shot, "From Earth" title
 *   Phase 2 (0.25 – 0.55) — scale/zoom + title crossfade
 *   Phase 3 (0.55 – 0.85) — interior reveal + CTAs
 *   Phase 4 (0.85 – 1.0)  — release to next section
 *
 * When /videos/office-dive.mp4 exists, its currentTime is scrubbed to
 * scroll — that produces the LUMEN video-frame-scrub effect. Without the
 * video, the background image + CSS filters carry the sequence (still
 * cinematic, just no live-action).
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocale } from "@/contexts/LanguageContext";

gsap.registerPlugin(ScrollTrigger);

export default function HeroCinematic() {
  const { t } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      // Pin the section for ~3 viewport heights of scroll (~"scroll runway").
      const runway = "+=300%";

      // Master timeline scrubbed by scroll.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: runway,
          scrub: 0.6,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Background scale + slow blur reveal — the "camera dolly" feel.
      tl.fromTo(
        bgRef.current,
        { scale: 1.08, filter: "blur(0px) brightness(0.55)" },
        { scale: 1.35, filter: "blur(2px) brightness(0.35)", ease: "none" },
        0
      );

      // Badge fades in early and out after phase 1.
      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" },
        0.02
      ).to(
        badgeRef.current,
        { opacity: 0, y: -10, duration: 0.1, ease: "power2.in" },
        0.55
      );

      // Title: rises + slight z-depth push, then fades in phase 3.
      tl.fromTo(
        titleRef.current,
        { opacity: 0, y: 80, scale: 0.92, filter: "blur(6px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "power3.out" },
        0
      ).to(
        titleRef.current,
        { opacity: 0.15, scale: 1.06, filter: "blur(2px)", duration: 0.4, ease: "power2.inOut" },
        0.55
      );

      // Subtitle takes over after title.
      tl.fromTo(
        subtitleRef.current,
        { opacity: 0, y: 40, filter: "blur(4px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power3.out" },
        0.55
      );

      // CTAs come in last.
      tl.fromTo(
        ctasRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
        0.7
      );

      // Scroll hint quickly fades out once user starts scrolling.
      tl.to(
        scrollHintRef.current,
        { opacity: 0, y: 10, duration: 0.1, ease: "none" },
        0.05
      );

      // Video scrub, if the video asset is present.
      const video = videoRef.current;
      if (video) {
        const scrubVideo = () => {
          if (!Number.isFinite(video.duration) || video.duration <= 0) return;
          gsap.to(video, {
            currentTime: video.duration,
            ease: "none",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top top",
              end: runway,
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
        };
        if (video.readyState >= 1) scrubVideo();
        else video.addEventListener("loadedmetadata", scrubVideo, { once: true });
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative h-screen w-full overflow-hidden bg-black text-white"
    >
      {/* Background layer — video if present, image fallback always */}
      <div ref={bgRef} className="absolute inset-0 z-0 will-change-transform">
        {/* Fallback image (always present) */}
        <img
          src="/images/image1.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Optional scrub video — silently ignored if the file 404s */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/office-dive.mp4"
          preload="auto"
          muted
          playsInline
          onError={(e) => {
            // Hide the broken video element so the image fallback shows through.
            (e.currentTarget as HTMLVideoElement).style.display = "none";
          }}
        />
      </div>

      {/* Dark cinematic gradients */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/30 to-black/85" />
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_60%,transparent_0%,rgba(0,0,0,0.55)_75%)]" />
      {/* Warm amber vignette — LUMEN warmth */}
      <div className="pointer-events-none absolute inset-0 z-10 mix-blend-screen bg-[radial-gradient(600px_400px_at_50%_45%,rgba(245,158,11,0.10),transparent_70%)]" />

      {/* Top navbar space kept transparent via a scrim */}

      {/* Foreground content */}
      <div className="relative z-20 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center">
        <span
          ref={badgeRef}
          className="mb-6 inline-block rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-200/80 backdrop-blur"
        >
          {t.hero.badge}
        </span>

        <div ref={titleRef} className="relative">
          <h1 className="font-black leading-[0.9] tracking-tight text-white text-[clamp(3rem,10vw,9rem)]">
            {t.hero.title1}
            <br />
            <span className="bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-transparent">
              {t.hero.title2}
            </span>
          </h1>
        </div>

        <div
          ref={subtitleRef}
          className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 opacity-0"
        >
          <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-white/70 md:text-xl">
            {t.hero.subtitle}
          </p>
          <div
            ref={ctasRef}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link
              href="/chat"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-all hover:bg-amber-200"
            >
              {t.hero.cta1}
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
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

      {/* Scroll hint */}
      <div
        ref={scrollHintRef}
        className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-white/50"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.28em]">Scroll</span>
          <div className="h-10 w-[1px] animate-pulse bg-gradient-to-b from-white/80 to-transparent" />
        </div>
      </div>
    </section>
  );
}
"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-linked cinematic background.
 *
 * Place the encoded asset at /videos/office-dive.mp4.
 * The source should be a constant-forward camera move so reversing the
 * browser scroll naturally reverses the visual journey.
 */
export default function CinematicDiveVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let tween: gsap.core.Tween | undefined;
    let cleanup: (() => void) | undefined;

    const setup = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      tween?.kill();
      const end = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      tween = gsap.to(video, {
        currentTime: video.duration,
        ease: "none",
        scrollTrigger: {
          trigger: "#cinematic-dive-scroll",
          start: "top top",
          end: `+=${end}`,
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
      });

      ScrollTrigger.refresh();
      cleanup = () => tween?.kill();
    };

    if (video.readyState >= 1) setup();
    else video.addEventListener("loadedmetadata", setup, { once: true });

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      cleanup?.();
      video.removeEventListener("loadedmetadata", setup);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      id="cinematic-dive-scroll"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-slate-950"
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src="/videos/office-dive.mp4"
        preload="auto"
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-slate-950/25" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.34)_100%)]" />
    </div>
  );
}

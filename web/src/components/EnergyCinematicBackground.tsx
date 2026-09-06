"use client";

/**
 * EnergyCinematicBackground
 * Scroll-driven descent over Greece: orbital far view -> orbit near ->
 * Athens street at night -> Innovation Hub interior. With a flowing
 * amber/cyan light veil and a vignette scrim that lifts as you descend.
 *
 * Renders only fixed background layers (z-index 0). Put page content in a
 * `relative z-10` wrapper above it. Uses the same compositor-only technique
 * as CinematicSkyBackground — one rAF loop, transform/opacity/filter only.
 */

import { useEffect, useRef } from "react";

type Props = {
  /** How many viewport heights the full orbit -> street -> hub descent takes. */
  zoomScreens?: number;
  /** 0–1 strength of the light-flow veil. */
  flowIntensity?: number;
  /** Use cyan for the flow veil (electric), amber otherwise. */
  flowCyan?: boolean;
  farSrc?: string;
  nearSrc?: string;
  streetSrc?: string;
  hubSrc?: string;
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);
const ease = (t: number) => t * t * (3 - 2 * t);

export default function EnergyCinematicBackground({
  zoomScreens = 3.25,
  flowIntensity = 0.5,
  flowCyan = true,
  farSrc = "/energy/orbit-far.jpg",
  nearSrc = "/energy/orbit-near.jpg",
  streetSrc = "/energy/street-night.jpg",
  hubSrc = "/energy/hub-interior.jpg",
}: Props) {
  const far = useRef<HTMLDivElement | null>(null);
  const near = useRef<HTMLDivElement | null>(null);
  const street = useRef<HTMLDivElement | null>(null);
  const hub = useRef<HTMLDivElement | null>(null);
  const flow = useRef<HTMLDivElement | null>(null);
  const scrim = useRef<HTMLDivElement | null>(null);

  const flowBg = flowCyan
    ? "radial-gradient(30% 30% at 26% 40%, rgba(34,211,238,.5), rgba(34,211,238,0) 70%), radial-gradient(26% 26% at 62% 30%, rgba(56,189,248,.42), rgba(56,189,248,0) 72%), radial-gradient(34% 30% at 48% 74%, rgba(245,178,63,.3), rgba(245,178,63,0) 70%)"
    : "radial-gradient(30% 30% at 26% 40%, rgba(245,178,63,.42), rgba(245,178,63,0) 70%), radial-gradient(26% 26% at 62% 30%, rgba(255,200,120,.34), rgba(255,200,120,0) 72%), radial-gradient(34% 30% at 48% 74%, rgba(34,211,238,.3), rgba(34,211,238,0) 70%)";

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      // Show the final hub frame statically at end-of-page.
      if (far.current) far.current.style.opacity = "0";
      if (near.current) near.current.style.opacity = "0";
      if (street.current) street.current.style.opacity = "0";
      if (hub.current) {
        hub.current.style.opacity = "1";
        hub.current.style.transform = "scale(1.04)";
      }
      return;
    }

    let frame = 0;
    let cur = 0;

    const loop = () => {
      const vh = window.innerHeight || 800;
      const span = vh * zoomScreens;
      const y = window.scrollY || window.pageYOffset || 0;
      const target = clamp(y / span, 0, 1);

      cur += (target - cur) * 0.1;
      if (Math.abs(target - cur) < 0.0004) cur = target;
      const p = cur;
      const beyond = clamp((y - span) / (vh * 3), 0, 1);
      const flowVal = flowIntensity;

      const farEl = far.current;
      if (farEl) {
        farEl.style.transform =
          "scale(" + (1 + 0.5 * ease(seg(p, 0, 0.36))).toFixed(4) + ")";
        farEl.style.opacity = (1 - seg(p, 0.2, 0.34)).toFixed(3);
      }
      const nearEl = near.current;
      if (nearEl) {
        nearEl.style.opacity = (
          ease(seg(p, 0.18, 0.32)) * (1 - seg(p, 0.44, 0.58))
        ).toFixed(3);
        nearEl.style.transform =
          "scale(" + (1.05 + 0.7 * ease(seg(p, 0.18, 0.6))).toFixed(4) + ")";
      }
      const streetEl = street.current;
      if (streetEl) {
        streetEl.style.opacity = (
          ease(seg(p, 0.46, 0.62)) * (1 - seg(p, 0.72, 0.86))
        ).toFixed(3);
        streetEl.style.transform =
          "scale(" +
          (1.38 - 0.24 * ease(seg(p, 0.44, 0.88))).toFixed(4) +
          ")";
      }
      const hubEl = hub.current;
      if (hubEl) {
        hubEl.style.opacity = ease(seg(p, 0.76, 0.98)).toFixed(3);
        hubEl.style.transform =
          "scale(" +
          (1.28 - 0.24 * ease(seg(p, 0.74, 1)) + beyond * 0.05).toFixed(4) +
          ") translateY(" +
          (-beyond * 2.4).toFixed(2) +
          "%)";
      }
      const fl = flow.current;
      if (fl) {
        const bell = Math.sin(Math.PI * seg(p, 0.1, 0.9));
        fl.style.opacity = (0.2 * flowVal + bell * flowVal).toFixed(3);
        fl.style.transform = "scale(" + (1 + seg(p, 0.1, 1) * 1.4).toFixed(3) + ")";
      }
      const sc = scrim.current;
      if (sc) sc.style.opacity = (1 - 0.6 * seg(p, 0.1, 0.45)).toFixed(3);

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [zoomScreens, flowIntensity]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        background: "#02060f",
        pointerEvents: "none",
      }}
    >
      <div
        ref={far}
        style={{
          position: "absolute",
          inset: "-4%",
          backgroundImage: `url('${farSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "50% 45%",
          transformOrigin: "44% 52%",
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={near}
        style={{
          position: "absolute",
          inset: "-6%",
          opacity: 0,
          backgroundImage: `url('${nearSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "44% 52%",
          transformOrigin: "42% 58%",
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={street}
        style={{
          position: "absolute",
          inset: "-8%",
          opacity: 0,
          backgroundImage: `url('${streetSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "52% 55%",
          transformOrigin: "48% 58%",
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={hub}
        style={{
          position: "absolute",
          inset: "-8%",
          opacity: 0,
          backgroundImage: `url('${hubSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "42% 50%",
          transformOrigin: "40% 50%",
          willChange: "transform, opacity",
        }}
      />
      <div
        ref={flow}
        style={{
          position: "absolute",
          inset: "-15%",
          opacity: 0,
          filter: "blur(34px)",
          background: flowBg,
          animation: "flowPulse 7s ease-in-out infinite",
          willChange: "transform, opacity",
        }}
      />
      <style>{`@keyframes flowPulse { 0%,100% { opacity: .35; } 50% { opacity: .9; } }`}</style>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(130% 95% at 50% 38%, rgba(2,6,15,0) 26%, rgba(2,6,15,.72) 100%)",
        }}
      />
      <div
        ref={scrim}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(100deg, rgba(2,6,15,.88) 0%, rgba(2,6,15,.62) 30%, rgba(2,6,15,.18) 56%, rgba(2,6,15,0) 74%), linear-gradient(to top, rgba(2,6,15,.8), rgba(2,6,15,0) 42%)",
          willChange: "opacity",
        }}
      />
    </div>
  );
}

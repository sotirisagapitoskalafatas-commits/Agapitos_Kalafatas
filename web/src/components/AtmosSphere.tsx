"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

type AtmosSphereProps = {
  /** Canvas wrapper classes (e.g. positioning inside a hero). */
  className?: string;
  /** Trigger element for the scroll parallax. Defaults to the scene container. */
  trigger?: string;
  /** Sphere color. Defaults to cyan-tinted blue. */
  color?: string;
  /** Scroll parallax travel in px. */
  parallax?: number;
};

function SoftGlobe({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.rotation.y = t * 0.06;
      ref.current.rotation.z = t * 0.02;
      ref.current.position.y = Math.sin(t * 0.24) * 0.12;
    }
  });

  return (
    <mesh ref={ref} position={[0, -0.4, -1.6]}>
      <sphereGeometry args={[2.1, 64, 64]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.04}
        roughness={0.1}
        metalness={0}
        transmission={0.8}
        thickness={0.5}
      />
    </mesh>
  );
}

function DustPoints() {
  const ref = useRef<THREE.Points>(null);
  const positions = useRef<Float32Array | null>(null);

  if (!positions.current) {
    const arr = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    positions.current = arr;
  }

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.015;
      const p = (state.clock.elapsedTime * 0.06) % 7;
      ref.current.position.y = -3.5 + p;
    }
  });

  return (
    <points ref={ref} position={[0, -3.5, -1]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={90}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#dbe8f8" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

export default function AtmosSphere({
  className = "",
  trigger,
  color = "#a9c6ea",
  parallax = 120,
}: AtmosSphereProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        wrap,
        { y: -parallax * 0.5 },
        {
          y: parallax * 0.5,
          ease: "none",
          scrollTrigger: {
            trigger: trigger ? document.querySelector(trigger) : wrap,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        }
      );
    }, wrap);

    return () => ctx.revert();
  }, [trigger, parallax]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    >
      {` `}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 35 }}
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[2, 2, 4]} intensity={4} distance={12} color="#7dbfff" />
        <SoftGlobe color={color} />
        <DustPoints />
      </Canvas>
    </div>
  );
}
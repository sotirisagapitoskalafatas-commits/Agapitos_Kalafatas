"use client";

/**
 * Glass · Timber · Fire — scroll-driven R3F walk-through.
 *
 * Four cinematic waypoints on one long pinned scroll:
 *   1. WORLD  — atmospheric globe from space
 *   2. CITY   — procedural night-city grid, camera dives to street level
 *   3. HOUSE  — dark house exterior, warm-lit windows
 *   4. ROOM   — inside a warm timber-framed room with fire glow
 *
 * All geometry is procedural — no external 3D assets required.
 * Camera position/target is scrubbed by GSAP ScrollTrigger.
 */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ---------------------------------------------------------------- Scenes */

/** Earth / world: soft-blue sphere with an amber atmosphere fresnel ring. */
function World() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
  });
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Solid planet body */}
      <mesh>
        <sphereGeometry args={[6, 64, 64]} />
        <meshStandardMaterial
          color="#1e3a8a"
          roughness={0.55}
          metalness={0.1}
          emissive="#0f172a"
          emissiveIntensity={0.35}
        />
      </mesh>
      {/* Continents-ish overlay (translucent wireframe) */}
      <mesh scale={1.001}>
        <sphereGeometry args={[6, 32, 32]} />
        <meshStandardMaterial
          color="#22c55e"
          roughness={0.9}
          transparent
          opacity={0.28}
          wireframe
        />
      </mesh>
      {/* Warm atmosphere halo */}
      <mesh scale={1.06}>
        <sphereGeometry args={[6, 48, 48]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.09}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Cool outer atmosphere */}
      <mesh scale={1.13}>
        <sphereGeometry args={[6, 48, 48]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/** Star field behind the world. */
function Stars() {
  const count = 900;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Points on a large sphere around origin
      const r = 90 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.35}
        color="#fef3c7"
        transparent
        opacity={0.75}
        sizeAttenuation
      />
    </points>
  );
}

/** Procedural night city — grid of buildings with warm window lights. */
function City() {
  // Deterministic RNG so buildings don't jitter between renders
  const buildings = useMemo(() => {
    const rows = 22;
    const cols = 22;
    const gap = 2.2;
    const list: {
      x: number;
      z: number;
      h: number;
      lit: boolean;
      hue: number;
    }[] = [];
    // Use a seeded pseudo-random for determinism
    let seed = 1;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = -rows / 2; i < rows / 2; i++) {
      for (let j = -cols / 2; j < cols / 2; j++) {
        const distToCenter = Math.hypot(i, j);
        // Skip the center block so we can put the "featured house" there
        if (distToCenter < 1.6) continue;
        const h = 0.8 + rand() * 6 + (1 / (distToCenter + 1)) * 3;
        list.push({
          x: i * gap + (rand() - 0.5) * 0.4,
          z: j * gap + (rand() - 0.5) * 0.4,
          h,
          lit: rand() > 0.42,
          hue: rand(),
        });
      }
    }
    return list;
  }, []);

  return (
    <group position={[0, -15, 0]}>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial
          color="#0b0d10"
          roughness={1}
          metalness={0}
        />
      </mesh>
      {buildings.map((b, i) => {
        const litColor = b.hue > 0.7 ? "#93c5fd" : "#f59e0b";
        return (
          <mesh key={i} position={[b.x, b.h / 2, b.z]}>
            <boxGeometry args={[1.6, b.h, 1.6]} />
            <meshStandardMaterial
              color="#111318"
              roughness={0.7}
              metalness={0.2}
              emissive={b.lit ? litColor : "#000"}
              emissiveIntensity={b.lit ? 0.55 : 0}
            />
          </mesh>
        );
      })}
      {/* A soft fog / haze plane */}
      <mesh position={[0, 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial
          color="#f59e0b"
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

/** Warm-lit house at the center of the city block. */
function House() {
  return (
    <group position={[0, -14.6, 0]}>
      {/* House body */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[3.2, 3, 3.2]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>
      {/* Pitched roof (pyramid via cone with 4 segments) */}
      <mesh position={[0, 3.6, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.4, 1.6, 4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.85} />
      </mesh>
      {/* Front-facing warm window */}
      <mesh position={[0, 1.6, 1.61]}>
        <planeGeometry args={[1.4, 1.0]} />
        <meshBasicMaterial color="#fbbf24" toneMapped={false} />
      </mesh>
      {/* Side windows */}
      <mesh position={[1.61, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.4, 1.0]} />
        <meshBasicMaterial color="#f59e0b" toneMapped={false} />
      </mesh>
      <mesh position={[-1.61, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.4, 1.0]} />
        <meshBasicMaterial color="#f59e0b" toneMapped={false} />
      </mesh>
      {/* Warm point light spilling out */}
      <pointLight
        position={[0, 1.6, 0]}
        color="#fbbf24"
        intensity={2.5}
        distance={12}
        decay={2}
      />
    </group>
  );
}

/** Interior room — timber-framed, fireplace glow. */
function Room() {
  const fireRef = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (!fireRef.current) return;
    // Flickering fire
    const t = state.clock.elapsedTime;
    fireRef.current.intensity =
      3 + Math.sin(t * 9) * 0.6 + Math.sin(t * 17) * 0.3;
  });

  return (
    <group position={[0, -13.4, 0]}>
      {/* Room walls — a box around the camera (~7×4×7) */}
      {/* Back wall */}
      <mesh position={[0, 2, -3.5]}>
        <planeGeometry args={[7, 4]} />
        <meshStandardMaterial color="#3f2c1f" roughness={0.9} />
      </mesh>
      {/* Front wall (behind camera) */}
      <mesh position={[0, 2, 3.5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[7, 4]} />
        <meshStandardMaterial color="#3f2c1f" roughness={0.9} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-3.5, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[7, 4]} />
        <meshStandardMaterial color="#2c1f14" roughness={0.9} />
      </mesh>
      {/* Right wall */}
      <mesh position={[3.5, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[7, 4]} />
        <meshStandardMaterial color="#2c1f14" roughness={0.9} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#1f150c" roughness={0.95} />
      </mesh>
      {/* Floor — dark timber */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#1a1108" roughness={0.85} />
      </mesh>
      {/* Fireplace — glowing block on back wall */}
      <mesh position={[0, 0.9, -3.3]}>
        <boxGeometry args={[2.2, 1.6, 0.4]} />
        <meshStandardMaterial
          color="#0f0906"
          emissive="#f97316"
          emissiveIntensity={1.4}
          roughness={0.7}
        />
      </mesh>
      {/* Fire flickering point light */}
      <pointLight
        ref={fireRef}
        position={[0, 1.2, -3.0]}
        color="#f97316"
        intensity={3}
        distance={10}
        decay={2}
      />
      {/* Ambient warm fill */}
      <pointLight
        position={[0, 3.5, 1]}
        color="#fbbf24"
        intensity={0.6}
        distance={8}
        decay={2}
      />
      {/* Side table & lamp — a taste of "furniture" */}
      <mesh position={[2, 0.5, 1.5]}>
        <boxGeometry args={[0.6, 1, 0.6]} />
        <meshStandardMaterial color="#4a2f1e" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[2, 1.15, 1.5]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color="#0f0906"
          emissive="#fef08a"
          emissiveIntensity={1.6}
        />
      </mesh>
      <pointLight
        position={[2, 1.15, 1.5]}
        color="#fef08a"
        intensity={1.2}
        distance={5}
        decay={2}
      />
      {/* Timber beam suggestion above */}
      <mesh position={[0, 3.9, 0]}>
        <boxGeometry args={[7, 0.2, 0.3]} />
        <meshStandardMaterial color="#2c1c10" roughness={0.85} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------- Scroll-driven camera rig */

type Progress = { value: number };

function CameraRig({ progress }: { progress: Progress }) {
  const { camera } = useThree();

  // 4 waypoints — position and lookAt-target.
  const waypoints = useMemo(
    () => [
      // 1. Far in space, looking at world
      { pos: new THREE.Vector3(0, 0, 22), look: new THREE.Vector3(0, 0, 0) },
      // 2. Above the city, tilted down
      { pos: new THREE.Vector3(0, 8, 12), look: new THREE.Vector3(0, -14, 0) },
      // 3. Close to the house
      { pos: new THREE.Vector3(3.5, -12, 6), look: new THREE.Vector3(0, -13, 0) },
      // 4. Inside the room
      { pos: new THREE.Vector3(0, -12, 2.4), look: new THREE.Vector3(0, -12.5, -3) },
    ],
    []
  );

  useFrame(() => {
    const p = THREE.MathUtils.clamp(progress.value, 0, 1);
    // Turn [0,1] into a segment index + local t
    const seg = p * (waypoints.length - 1);
    const i = Math.min(Math.floor(seg), waypoints.length - 2);
    const localT = THREE.MathUtils.smoothstep(seg - i, 0, 1);

    const a = waypoints[i];
    const b = waypoints[i + 1];
    camera.position.lerpVectors(a.pos, b.pos, localT);
    const look = new THREE.Vector3().lerpVectors(a.look, b.look, localT);
    camera.lookAt(look);
  });

  return null;
}

/* ----------------------------------------------------------------- Root */

export default function RoomWalkthrough() {
  const rootRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const progress: Progress = { value: 0 };

  const label1 = useRef<HTMLDivElement>(null);
  const label2 = useRef<HTMLDivElement>(null);
  const label3 = useRef<HTMLDivElement>(null);
  const label4 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "+=400%",
        pin: true,
        pinSpacing: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress.value = self.progress;
        },
      });

      // Text overlays timed to camera segments — using dummy scroll triggers
      const labelTL = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "+=400%",
          scrub: 0.5,
        },
      });

      // Each label fades in during its phase and fades out after
      const phases = [
        { ref: label1, in: 0.02, out: 0.22 },
        { ref: label2, in: 0.28, out: 0.48 },
        { ref: label3, in: 0.55, out: 0.72 },
        { ref: label4, in: 0.78, out: 0.98 },
      ];
      phases.forEach((p) => {
        if (!p.ref.current) return;
        labelTL
          .fromTo(
            p.ref.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: p.in, ease: "power2.out" },
            p.in
          )
          .to(
            p.ref.current,
            { opacity: 0, y: -12, duration: 0.1, ease: "power2.in" },
            p.out
          );
      });

      return () => {
        st.kill();
      };
    }, rootRef);

    return () => ctx.revert();
  }, [progress]);

  return (
    <section
      ref={rootRef}
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      {/* 3D canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 22], fov: 55, near: 0.1, far: 500 }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#050508" }}
        >
          <fog attach="fog" args={["#050508", 15, 90]} />
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[20, 30, 10]}
            intensity={0.9}
            color="#fef3c7"
          />
          <Stars />
          <World />
          <City />
          <House />
          <Room />
          <CameraRig progress={progress} />
        </Canvas>
      </div>

      {/* Bottom vignette + gradient scrim */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

      {/* Overlaid narrative labels */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-end pb-24 text-center text-white"
      >
        <div
          ref={label1}
          className="absolute top-1/2 -translate-y-1/2 opacity-0"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-amber-200/80">
            Chapter 01
          </p>
          <h3 className="text-4xl font-black md:text-6xl">From the world</h3>
        </div>
        <div
          ref={label2}
          className="absolute top-1/2 -translate-y-1/2 opacity-0"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-amber-200/80">
            Chapter 02
          </p>
          <h3 className="text-4xl font-black md:text-6xl">Down to the city</h3>
        </div>
        <div
          ref={label3}
          className="absolute top-1/2 -translate-y-1/2 opacity-0"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-amber-200/80">
            Chapter 03
          </p>
          <h3 className="text-4xl font-black md:text-6xl">Into a house</h3>
        </div>
        <div
          ref={label4}
          className="absolute top-1/2 -translate-y-1/2 opacity-0"
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.4em] text-amber-200/80">
            Chapter 04
          </p>
          <h3 className="text-4xl font-black md:text-6xl">Inside a room</h3>
          <p className="mx-auto mt-4 max-w-md text-sm text-white/60">
            Warm light, timber &amp; fire — where the work happens.
          </p>
        </div>
      </div>
    </section>
  );
}
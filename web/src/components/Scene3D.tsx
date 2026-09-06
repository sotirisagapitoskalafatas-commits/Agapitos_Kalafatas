"use client";

/**
 * Atmospheric 3D backdrop — dark cinematic edition.
 *
 * Slow-moving wireframe icosahedron, floating rings, and a dense particle
 * field on a transparent canvas. Colors shifted to warm amber + cool violet
 * to match the LUMEN / Glass·Timber·Fire mood.
 */

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function GeometricShape() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * 0.12 + scrollY * 0.0008;
    meshRef.current.rotation.y = t * 0.16 + scrollY * 0.0004;
    meshRef.current.position.y = Math.sin(t * 0.35) * 0.35 - scrollY * 0.0015;
    meshRef.current.position.x = Math.sin(t * 0.2) * 0.2;
    const scale = 2.3 - Math.min(scrollY * 0.0009, 0.9);
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} scale={2.3}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#f59e0b"
        roughness={0.15}
        metalness={0.85}
        transparent
        opacity={0.32}
        wireframe
      />
    </mesh>
  );
}

function FloatingRings() {
  const groupRef = useRef<THREE.Group>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.x = t * 0.08;
    groupRef.current.rotation.z = t * 0.04 + scrollY * 0.0003;
    groupRef.current.position.y = Math.sin(t * 0.25) * 0.5 - scrollY * 0.0008;
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.5, 0.02, 16, 100]} />
        <meshStandardMaterial color="#c084fc" transparent opacity={0.28} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 2.5, 0.3, 0]}>
        <torusGeometry args={[3, 0.015, 16, 100]} />
        <meshStandardMaterial color="#fbbf24" transparent opacity={0.22} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0.4]}>
        <torusGeometry args={[3.6, 0.01, 16, 100]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.15} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function Particles() {
  const count = 220;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.025;
    ref.current.rotation.x = state.clock.elapsedTime * 0.015 - scrollY * 0.00008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#fef3c7" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function FloatingDot({ x, y, z, scale, speed }: { x: number; y: number; z: number; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = y + Math.sin(t * speed + x) * 0.5;
    ref.current.position.x = x + Math.cos(t * speed * 0.5 + y) * 0.3;
  });
  return (
    <mesh ref={ref} position={[x, y, z]} scale={scale}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#fbbf24" transparent opacity={0.45} metalness={0.6} roughness={0.3} />
    </mesh>
  );
}

function FloatingDots() {
  const count = 40;
  const meshes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 16,
        y: (Math.random() - 0.5) * 16,
        z: (Math.random() - 0.5) * 10,
        scale: 0.025 + Math.random() * 0.06,
        speed: 0.18 + Math.random() * 0.45,
      })),
    []
  );
  return (
    <group>
      {meshes.map((dot, i) => (
        <FloatingDot key={i} {...dot} />
      ))}
    </group>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{ pointerEvents: "none" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} color="#fef3c7" />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#a78bfa" />
        <pointLight position={[5, -3, 3]} intensity={0.4} color="#f59e0b" />
        <GeometricShape />
        <FloatingRings />
        <Particles />
        <FloatingDots />
      </Canvas>
    </div>
  );
}
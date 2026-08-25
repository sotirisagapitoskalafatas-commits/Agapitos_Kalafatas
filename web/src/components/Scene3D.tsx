"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      meshRef.current.rotation.x = t * 0.15 + scrollY * 0.001;
      meshRef.current.rotation.y = t * 0.2 + scrollY * 0.0005;
      meshRef.current.position.y = Math.sin(t * 0.5) * 0.3 - scrollY * 0.002;
      meshRef.current.position.x = Math.sin(t * 0.3) * 0.2;
      const scale = 2.2 - Math.min(scrollY * 0.001, 0.8);
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} scale={2.2}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color="#3b82f6"
        roughness={0.1}
        metalness={0.8}
        transparent
        opacity={0.5}
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
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.x = t * 0.1;
      groupRef.current.rotation.z = t * 0.05 + scrollY * 0.0003;
      groupRef.current.position.y = Math.sin(t * 0.3) * 0.5 - scrollY * 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.5, 0.02, 16, 100]} />
        <meshStandardMaterial color="#8b5cf6" transparent opacity={0.3} metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh rotation={[Math.PI / 2.5, 0.3, 0]}>
        <torusGeometry args={[3, 0.015, 16, 100]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.2} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

function Particles() {
  const count = 120;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
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
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.03;
      ref.current.rotation.x = state.clock.elapsedTime * 0.02 - scrollY * 0.0001;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#94a3b8" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function FloatingDots() {
  const count = 30;
  const meshes = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 15,
      y: (Math.random() - 0.5) * 15,
      z: (Math.random() - 0.5) * 10,
      scale: 0.03 + Math.random() * 0.06,
      speed: 0.2 + Math.random() * 0.5,
    }));
  }, []);

  return (
    <group>
      {meshes.map((dot, i) => (
        <FloatingDot key={i} {...dot} />
      ))}
    </group>
  );
}

function FloatingDot({ x, y, z, scale, speed }: { x: number; y: number; z: number; scale: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.position.y = y + Math.sin(t * speed + x) * 0.5;
      ref.current.position.x = x + Math.cos(t * speed * 0.5 + y) * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={[x, y, z]} scale={scale}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#3b82f6" transparent opacity={0.4} metalness={0.5} roughness={0.3} />
    </mesh>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} style={{ pointerEvents: "none" }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, -5, -5]} intensity={0.4} color="#8b5cf6" />
        <pointLight position={[5, -3, 3]} intensity={0.3} color="#3b82f6" />
        <GeometricShape />
        <FloatingRings />
        <Particles />
        <FloatingDots />
      </Canvas>
    </div>
  );
}

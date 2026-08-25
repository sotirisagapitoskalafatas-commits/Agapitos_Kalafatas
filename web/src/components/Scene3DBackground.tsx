"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FloatingOrb({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime;
      ref.current.position.y = position[1] + Math.sin(t * speed) * 0.8;
      ref.current.position.x = position[0] + Math.cos(t * speed * 0.7) * 0.5;
      ref.current.rotation.x = t * 0.2;
      ref.current.rotation.y = t * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={0.8}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} transparent opacity={0.15} wireframe />
    </mesh>
  );
}

function MiniParticles() {
  const count = 40;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#cbd5e1" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

export default function Scene3DBackground({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 z-0 pointer-events-none ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ pointerEvents: "none" }} gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[3, 3, 3]} intensity={0.5} />
        <FloatingOrb position={[-2, 1, -2]} color="#3b82f6" speed={0.4} />
        <FloatingOrb position={[2, -1, -3]} color="#8b5cf6" speed={0.3} />
        <FloatingOrb position={[0, 2, -4]} color="#06b6d4" speed={0.5} />
        <MiniParticles />
      </Canvas>
    </div>
  );
}

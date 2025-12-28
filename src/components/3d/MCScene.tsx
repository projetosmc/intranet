import { Suspense, lazy, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Icosahedron, Torus, Sphere } from '@react-three/drei';
import { useUser } from '@/contexts/UserContext';
import * as THREE from 'three';

function FloatingShape({ position, scale, color, speed = 1 }: { 
  position: [number, number, number]; 
  scale: number; 
  color: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.1 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15 * speed;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Icosahedron ref={meshRef} position={position} args={[scale, 1]}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.4}
          metalness={0.8}
          transparent
          opacity={0.6}
        />
      </Icosahedron>
    </Float>
  );
}

function FloatingTorus({ position, scale, color }: { 
  position: [number, number, number]; 
  scale: number; 
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.08;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <Torus ref={meshRef} position={position} args={[scale, scale * 0.3, 16, 32]}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.4}
          roughness={0.3}
          metalness={0.9}
        />
      </Torus>
    </Float>
  );
}

function GlowingSphere({ position, scale, color }: { 
  position: [number, number, number]; 
  scale: number; 
  color: string;
}) {
  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <Sphere position={position} args={[scale, 16, 16]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.5}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#0ea5e9" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
      
      <FloatingShape position={[-3, 1, -2]} scale={0.8} color="#0ea5e9" speed={0.8} />
      <FloatingShape position={[3, -1, -3]} scale={0.6} color="#06b6d4" speed={1.2} />
      <FloatingTorus position={[2, 2, -4]} scale={0.5} color="#0ea5e9" />
      <FloatingTorus position={[-2, -2, -3]} scale={0.4} color="#14b8a6" />
      <GlowingSphere position={[0, 0, -5]} scale={0.3} color="#06b6d4" />
      <GlowingSphere position={[-4, 0, -4]} scale={0.2} color="#0ea5e9" />
      <GlowingSphere position={[4, 1, -3]} scale={0.25} color="#22d3ee" />
    </>
  );
}

export function MCScene() {
  const { toggle3D } = useUser();

  // Check for reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check if mobile
  const isMobile = 
    typeof window !== 'undefined' && 
    window.innerWidth < 768;

  if (!toggle3D || prefersReducedMotion || isMobile) {
    return null;
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <Suspense fallback={null}>
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5], fov: 45 }}
          gl={{ antialias: false, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Scene />
        </Canvas>
      </Suspense>
    </div>
  );
}

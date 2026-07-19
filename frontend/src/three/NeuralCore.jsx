import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pointer, prefersReducedMotion } from './pointer';

/**
 * Glowing "neural core": a wireframe icosahedron shell, an emissive inner
 * pulse, an orbiting particle cloud and two thin gyro rings. Entirely
 * procedural — no external asset.
 */
export function NeuralCore({ position = [0, 0, 0], scale = 1 }) {
  const group = useRef();
  const inner = useRef();
  const shell = useRef();
  const cloud = useRef();
  const ringA = useRef();
  const ringB = useRef();

  // Particle cloud distributed on a sphere surface (fibonacci sphere).
  const particles = useMemo(() => {
    const COUNT = 520;
    const positions = new Float32Array(COUNT * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      const rad = 1.55 + Math.random() * 0.35;
      positions[i * 3] = Math.cos(theta) * r * rad;
      positions[i * 3 + 1] = y * rad;
      positions[i * 3 + 2] = Math.sin(theta) * r * rad;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const d = prefersReducedMotion ? 0 : delta;

    if (group.current) {
      // gentle drift + subtle lean toward the cursor
      group.current.rotation.y += d * 0.12;
      group.current.rotation.x += (pointer.y * 0.25 - group.current.rotation.x) * 0.04;
      group.current.rotation.z += (pointer.x * 0.12 - group.current.rotation.z) * 0.04;
    }
    if (shell.current) shell.current.rotation.x -= d * 0.18;
    if (cloud.current) cloud.current.rotation.y -= d * 0.06;
    if (ringA.current) ringA.current.rotation.z += d * 0.5;
    if (ringB.current) ringB.current.rotation.x += d * 0.4;
    if (inner.current) {
      const pulse = 1 + Math.sin(t * 1.6) * 0.06;
      inner.current.scale.setScalar(pulse);
      inner.current.material.emissiveIntensity = 1.05 + Math.sin(t * 1.6) * 0.35;
    }
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {/* inner emissive pulse */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.85, 2]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#22d3ee"
          emissiveIntensity={1.1}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* wireframe shell */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.35} />
      </mesh>

      {/* particle cloud */}
      <points ref={cloud} geometry={particles}>
        <pointsMaterial
          size={0.03}
          color="#a5f3fc"
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* gyro rings */}
      <mesh ref={ringA}>
        <torusGeometry args={[1.95, 0.012, 12, 120]} />
        <meshStandardMaterial color="#818cf8" emissive="#6366f1" emissiveIntensity={1.4} />
      </mesh>
      <mesh ref={ringB} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.15, 0.01, 12, 120]} />
        <meshStandardMaterial color="#e879f9" emissive="#d946ef" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

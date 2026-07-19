import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pointer, prefersReducedMotion } from './pointer';

/**
 * Holographic gyroscope core: a faceted crystal core wrapped in glowing orbital
 * rings on different axes, with light nodes tracing each orbit and a soft
 * particle halo. Clean and premium — not a solid sphere.
 */
export function OrbitCore({ position = [0, 0, 0], scale = 1 }) {
  const group = useRef();
  const core = useRef();
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();
  const nodesRef = useRef([]);

  const nodes = useMemo(
    () => [
      { r: 1.6, speed: 0.8, tilt: [0, 0, 0], color: '#22d3ee', phase: 0 },
      { r: 1.9, speed: -0.6, tilt: [Math.PI / 2, 0, 0], color: '#818cf8', phase: 1.4 },
      { r: 2.15, speed: 0.5, tilt: [Math.PI / 3, Math.PI / 4, 0], color: '#d946ef', phase: 2.8 },
      { r: 1.75, speed: 0.7, tilt: [Math.PI / 2, Math.PI / 3, 0], color: '#a5f3fc', phase: 4.2 },
    ],
    []
  );
  const euler = useMemo(() => nodes.map((n) => new THREE.Euler(...n.tilt)), [nodes]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const halo = useMemo(() => {
    const C = 150;
    const arr = new Float32Array(C * 3);
    for (let i = 0; i < C; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(1.9 + Math.random() * 1.3);
      arr.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const d = prefersReducedMotion ? 0 : delta;

    if (group.current) {
      group.current.rotation.y += d * 0.1;
      group.current.rotation.x += (pointer.y * 0.2 - group.current.rotation.x) * 0.04;
      group.current.rotation.z += (pointer.x * 0.1 - group.current.rotation.z) * 0.04;
    }
    if (ring1.current) ring1.current.rotation.z += d * 0.6;
    if (ring2.current) ring2.current.rotation.x += d * 0.5;
    if (ring3.current) { ring3.current.rotation.y += d * 0.4; ring3.current.rotation.x += d * 0.18; }
    if (core.current) {
      core.current.rotation.y += d * 0.5;
      core.current.rotation.x += d * 0.28;
      core.current.material.emissiveIntensity = 1.1 + Math.sin(t * 2) * 0.4;
    }

    nodes.forEach((n, i) => {
      const m = nodesRef.current[i];
      if (!m) return;
      const a = t * n.speed + n.phase;
      tmp.set(Math.cos(a) * n.r, 0, Math.sin(a) * n.r).applyEuler(euler[i]);
      m.position.copy(tmp);
    });
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {/* faceted crystal core */}
      <mesh ref={core}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color="#0b3a66" emissive="#22d3ee" emissiveIntensity={1.2} roughness={0.12} metalness={0.6} flatShading />
      </mesh>
      <mesh scale={1.06}>
        <octahedronGeometry args={[0.55, 0]} />
        <meshBasicMaterial color="#a5f3fc" wireframe transparent opacity={0.45} />
      </mesh>

      {/* orbital rings */}
      <mesh ref={ring1}>
        <torusGeometry args={[1.6, 0.015, 16, 180]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.9, 0.012, 16, 180]} />
        <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <mesh ref={ring3} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[2.15, 0.01, 16, 180]} />
        <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={1.3} toneMapped={false} />
      </mesh>

      {/* light nodes tracing the orbits */}
      {nodes.map((n, i) => (
        <mesh key={i} ref={(el) => (nodesRef.current[i] = el)}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={2.6} toneMapped={false} />
        </mesh>
      ))}

      {/* particle halo */}
      <points geometry={halo}>
        <pointsMaterial size={0.02} color="#7dd3fc" transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

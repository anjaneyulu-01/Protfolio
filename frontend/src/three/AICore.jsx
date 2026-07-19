import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { pointer, prefersReducedMotion } from './pointer';

/**
 * "Living" AI core: an organic, morphing energy core wrapped in a rotating
 * neural network — glowing nodes (neurons) linked by pulsing synapse lines,
 * with an orbiting gyro ring and a particle halo. Fully procedural.
 */
export function AICore({ position = [0, 0, 0], scale = 1 }) {
  const group = useRef();
  const netRef = useRef();
  const coreRef = useRef();
  const edgesMat = useRef();
  const ringRef = useRef();
  const haloRef = useRef();

  // Neurons on a fibonacci sphere + synapse edges between near neighbours.
  const { nodePositions, edgeGeometry } = useMemo(() => {
    const N = 22;
    const R = 1.85;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      pts.push(new THREE.Vector3(Math.cos(theta) * r * R, y * R, Math.sin(theta) * r * R));
    }
    const nodePositions = new Float32Array(N * 3);
    pts.forEach((p, i) => { nodePositions.set([p.x, p.y, p.z], i * 3); });

    // connect each node to its 2 nearest neighbours
    const edgeVerts = [];
    for (let i = 0; i < N; i++) {
      const dists = pts
        .map((p, j) => ({ j, d: pts[i].distanceTo(p) }))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      for (const { j } of dists) {
        edgeVerts.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
      }
    }
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edgeVerts), 3));

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    return { nodePositions: nodeGeo, edgeGeometry };
  }, []);

  // particle halo
  const halo = useMemo(() => {
    const C = 300;
    const arr = new Float32Array(C * 3);
    for (let i = 0; i < C; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(2.3 + Math.random() * 1.4);
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
      group.current.rotation.y += d * 0.14;
      group.current.rotation.x += (pointer.y * 0.22 - group.current.rotation.x) * 0.04;
      group.current.rotation.z += (pointer.x * 0.1 - group.current.rotation.z) * 0.04;
    }
    if (netRef.current) netRef.current.rotation.y -= d * 0.05;
    if (haloRef.current) haloRef.current.rotation.y += d * 0.02;
    if (ringRef.current) { ringRef.current.rotation.z += d * 0.5; ringRef.current.rotation.x += d * 0.2; }
    if (edgesMat.current) edgesMat.current.opacity = 0.28 + Math.sin(t * 2.4) * 0.18;
    if (coreRef.current) coreRef.current.material.emissiveIntensity = 0.72 + Math.sin(t * 1.8) * 0.28;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {/* organic morphing energy core */}
      <mesh ref={coreRef} scale={0.9}>
        <icosahedronGeometry args={[1.02, 8]} />
        <MeshDistortMaterial
          color="#0b3a66"
          emissive="#22d3ee"
          emissiveIntensity={0.75}
          roughness={0.15}
          metalness={0.45}
          distort={0.55}
          speed={2.6}
        />
      </mesh>

      {/* neural network shell */}
      <group ref={netRef}>
        <lineSegments geometry={edgeGeometry}>
          <lineBasicMaterial ref={edgesMat} color="#38bdf8" transparent opacity={0.35} depthWrite={false} />
        </lineSegments>
        <points geometry={nodePositions}>
          <pointsMaterial
            size={0.14}
            color="#a5f3fc"
            transparent
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>

      {/* orbiting gyro ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.15, 0.012, 12, 140]} />
        <meshStandardMaterial color="#e879f9" emissive="#d946ef" emissiveIntensity={1.3} toneMapped={false} />
      </mesh>

      {/* particle halo */}
      <points ref={haloRef} geometry={halo}>
        <pointsMaterial size={0.02} color="#7dd3fc" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}

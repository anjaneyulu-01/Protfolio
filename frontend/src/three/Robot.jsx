import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { pointer, prefersReducedMotion } from './pointer';

/**
 * Stylized procedural assistant robot (no external asset).
 * - head tilts toward the cursor
 * - eyes blink on a natural cadence
 * - gentle "breathing" float + chest-core pulse
 */
export function Robot({ position = [0, 0, 0], scale = 1, waving = false }) {
  const root = useRef();
  const head = useRef();
  const eyes = useRef();
  const core = useRef();
  const arm = useRef();

  const blink = useRef({ next: 1.5, closing: false });

  const CYAN = '#22d3ee';

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const d = prefersReducedMotion ? 0 : delta;

    // breathing float
    if (root.current) {
      root.current.position.y = position[1] + Math.sin(t * 1.1) * 0.06;
    }

    // head follows cursor
    if (head.current) {
      const targetY = pointer.x * 0.55;
      const targetX = -pointer.y * 0.32 + Math.sin(t * 0.6) * 0.03;
      head.current.rotation.y += (targetY - head.current.rotation.y) * 0.06;
      head.current.rotation.x += (targetX - head.current.rotation.x) * 0.06;
    }

    // blink
    if (eyes.current) {
      const b = blink.current;
      b.next -= d;
      if (b.next <= 0 && !b.closing) b.closing = true;
      const target = b.closing ? 0.08 : 1;
      eyes.current.scale.y += (target - eyes.current.scale.y) * 0.35;
      if (b.closing && eyes.current.scale.y < 0.15) b.closing = false;
      if (!b.closing && eyes.current.scale.y > 0.9 && b.next <= 0) {
        b.next = 2 + Math.random() * 3;
      }
    }

    // chest core pulse
    if (core.current) {
      core.current.material.emissiveIntensity = 1.4 + Math.sin(t * 2.2) * 0.7;
    }

    // wave / idle arm sway
    if (arm.current) {
      arm.current.rotation.z = waving
        ? -0.9 + Math.sin(t * 9) * 0.5
        : -0.15 + Math.sin(t * 1.1) * 0.06;
    }
  });

  const shell = (
    <meshStandardMaterial color="#e8eefc" roughness={0.35} metalness={0.55} />
  );
  const dark = (
    <meshStandardMaterial color="#0b1120" roughness={0.4} metalness={0.7} />
  );

  return (
    <group ref={root} position={position} scale={scale}>
      {/* ---------- Head ---------- */}
      <group ref={head} position={[0, 1.15, 0]}>
        <RoundedBox args={[0.92, 0.78, 0.8]} radius={0.16} smoothness={4}>
          {shell}
        </RoundedBox>
        {/* visor */}
        <RoundedBox args={[0.78, 0.4, 0.12]} radius={0.1} smoothness={4} position={[0, 0.02, 0.4]}>
          <meshStandardMaterial color="#050914" roughness={0.15} metalness={0.9} />
        </RoundedBox>
        {/* eyes */}
        <group ref={eyes} position={[0, 0.04, 0.47]}>
          {[-0.19, 0.19].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <capsuleGeometry args={[0.055, 0.12, 6, 16]} />
              <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={3} toneMapped={false} />
            </mesh>
          ))}
        </group>
        {/* ear pods */}
        {[-0.52, 0.52].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.16, 20]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={1.2} />
          </mesh>
        ))}
        {/* antenna */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          {dark}
        </mesh>
        <mesh position={[0, 0.74, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </group>

      {/* ---------- Neck ---------- */}
      <mesh position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.22, 20]} />
        {dark}
      </mesh>

      {/* ---------- Torso ---------- */}
      <group position={[0, 0.05, 0]}>
        <RoundedBox args={[1.15, 1.1, 0.62]} radius={0.22} smoothness={4}>
          {shell}
        </RoundedBox>
        {/* chest core */}
        <mesh ref={core} position={[0, 0.1, 0.33]}>
          <cylinderGeometry args={[0.17, 0.17, 0.08, 32]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.1, 0.3]}>
          <torusGeometry args={[0.26, 0.02, 12, 40]} />
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* ---------- Shoulders ---------- */}
      {[-0.72, 0.72].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]}>
          <sphereGeometry args={[0.2, 24, 24]} />
          {dark}
        </mesh>
      ))}

      {/* ---------- Right arm (waves) ---------- */}
      <group ref={arm} position={[0.72, 0.42, 0]}>
        <mesh position={[0, -0.35, 0]}>
          <capsuleGeometry args={[0.11, 0.6, 6, 16]} />
          {shell}
        </mesh>
        <mesh position={[0, -0.75, 0]}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.6} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* ---------- Left arm (static) ---------- */}
      <group position={[-0.72, 0.42, 0]} rotation={[0, 0, 0.12]}>
        <mesh position={[0, -0.35, 0]}>
          <capsuleGeometry args={[0.11, 0.6, 6, 16]} />
          {shell}
        </mesh>
        <mesh position={[0, -0.75, 0]}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.6} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* soft ground glow */}
      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OrbitCore } from './OrbitCore';
import { Robot } from './Robot';
import { bindPointer, pointer, prefersReducedMotion } from './pointer';

/** Whole-scene parallax that leans subtly with the cursor. */
function ParallaxRig({ children }) {
  const group = useRef();
  useFrame(() => {
    if (!group.current || prefersReducedMotion) return;
    group.current.rotation.y += (pointer.x * 0.12 - group.current.rotation.y) * 0.04;
    group.current.rotation.x += (-pointer.y * 0.06 - group.current.rotation.x) * 0.04;
    group.current.position.x += (pointer.x * 0.35 - group.current.position.x) * 0.04;
  });
  return <group ref={group}>{children}</group>;
}

export function HeroScene({ waving = false }) {
  useEffect(() => { bindPointer(); }, []);

  return (
    <Canvas
      camera={{ position: [0, 0.2, 7], fov: 42 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 5]} intensity={1.1} color="#dbeafe" />
        <pointLight position={[-4, 1, 3]} intensity={40} color="#22d3ee" distance={20} />
        <pointLight position={[4, -1, 2]} intensity={30} color="#d946ef" distance={20} />

        <Stars radius={60} depth={40} count={1400} factor={3} saturation={0} fade speed={0.6} />

        <ParallaxRig>
          <Float speed={1.2} rotationIntensity={0.12} floatIntensity={0.45}>
            <OrbitCore position={[2.8, 0.4, -0.4]} scale={0.68} />
          </Float>
          <Robot position={[-2.85, -0.55, 0.4]} scale={1.05} waving={waving} />
        </ParallaxRig>

        <EffectComposer disableNormalPass>
          <Bloom
            intensity={0.6}
            luminanceThreshold={0.28}
            luminanceSmoothing={0.55}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

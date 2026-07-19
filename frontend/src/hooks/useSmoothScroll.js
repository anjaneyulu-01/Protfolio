import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Global inertia smooth-scroll (Lenis). Called once near the app root.
 * Disabled automatically when the visitor prefers reduced motion.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Let anchor / programmatic scrolls route through Lenis.
    window.__lenis = lenis;

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);
}

/** Smooth-scroll to an element id, using Lenis when available. */
export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -70 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

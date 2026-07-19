/**
 * Global normalized pointer, decoupled from the R3F canvas so the robot's
 * head can follow the cursor even though the canvas is `pointer-events: none`
 * (which lets the HTML buttons on top stay clickable).
 *
 *   pointer.x / pointer.y  -> range [-1, 1], y up
 */
export const pointer = { x: 0, y: 0 };

let bound = false;

export function bindPointer() {
  if (bound || typeof window === 'undefined') return;
  bound = true;

  const onMove = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
}

export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

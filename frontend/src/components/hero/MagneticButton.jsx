import { useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Button/link that magnetically leans toward the cursor on hover.
 * Renders an <a> when `href` is set, otherwise a <button>.
 */
export function MagneticButton({ children, href, onClick, className = '', ...rest }) {
  const ref = useRef();

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate(0px, 0px)';
  };

  const Comp = motion[href ? 'a' : 'button'];

  return (
    <Comp
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={reset}
      whileTap={{ scale: 0.96 }}
      className={`holo-btn ${className}`}
      style={{ transition: 'transform 220ms cubic-bezier(0.22,1,0.36,1)' }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

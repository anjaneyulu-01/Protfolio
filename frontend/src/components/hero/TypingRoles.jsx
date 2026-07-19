import { useEffect, useRef, useState } from 'react';

const DEFAULT_ROLES = [
  'AI Engineer',
  'Machine Learning Engineer',
  'Full-Stack Developer',
  'Generative AI Developer',
  'Hackathon Builder',
  'Research Engineer',
];

/** Terminal-style typewriter that cycles through roles. */
export function TypingRoles({ roles = DEFAULT_ROLES, className = '' }) {
  const [text, setText] = useState('');
  const state = useRef({ i: 0, sub: 0, deleting: false });

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setText(roles[0]);
      return;
    }
    let timer;
    const tick = () => {
      const s = state.ref ?? state.current;
      const word = roles[s.i % roles.length];
      s.sub += s.deleting ? -1 : 1;
      setText(word.slice(0, s.sub));

      let delay = s.deleting ? 45 : 85;
      if (!s.deleting && s.sub === word.length) {
        delay = 1400;
        s.deleting = true;
      } else if (s.deleting && s.sub === 0) {
        s.deleting = false;
        s.i += 1;
        delay = 350;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [roles]);

  return (
    <span className={className}>
      <span className="holo-text font-semibold">{text}</span>
      <span className="lab-caret" aria-hidden="true" />
    </span>
  );
}

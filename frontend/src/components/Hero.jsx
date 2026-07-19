import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Edit, ArrowRight, Cpu, Bot, FileText, Download } from 'lucide-react';
import { SiGeeksforgeeks, SiLeetcode } from 'react-icons/si';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TypingRoles } from './hero/TypingRoles';
import { MagneticButton } from './hero/MagneticButton';
import { scrollToId } from '../hooks/useSmoothScroll';

// The 3D scene is heavy — load it lazily so first paint stays fast.
const HeroScene = lazy(() =>
  import('../three/HeroScene').then((m) => ({ default: m.HeroScene }))
);

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';
const GITHUB_URL = import.meta.env.VITE_GITHUB_URL;
const LINKEDIN_URL = import.meta.env.VITE_LINKEDIN_URL;
const LEETCODE_URL = import.meta.env.VITE_LEETCODE_URL;
const GEEKSFORGEEKS_URL = import.meta.env.VITE_GEEKSFORGEEKS_URL;
const EMAIL_ADDRESS = import.meta.env.VITE_EMAIL_ADDRESS;
const EMAIL_HREF = EMAIL_ADDRESS ? `mailto:${EMAIL_ADDRESS}` : '';

const ROBOT_LINES = [
  "Hello — I'm ARIA, the lab's research assistant.",
  'Scroll down to explore intelligent systems I have built.',
  'The full voice-enabled AI guide comes online soon.',
];

export const Hero = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [heroData, setHeroData] = useState({
    greeting: 'Welcome to the AI Research Lab',
    title: 'Engineering Intelligent Systems',
    subtitle: 'Building beautiful, scalable, AI-powered experiences with modern technologies.',
    image: '',
  });
  const [waving, setWaving] = useState(false);
  const [speech, setSpeech] = useState(null);
  const [enable3D, setEnable3D] = useState(true);
  const lineIdx = useRef(0);
  const waveTimer = useRef();

  useEffect(() => {
    // Skip the 3D scene on very small / low-power screens.
    if (typeof window !== 'undefined' && window.innerWidth < 640) setEnable3D(false);
    return () => clearTimeout(waveTimer.current);
  }, []);

  useEffect(() => {
    const loadHero = async () => {
      try {
        const res = await fetch(`${API_BASE}/content/hero`);
        const json = await res.json();
        const first = Array.isArray(json) ? json[0] : json;
        if (first?.data) {
          setHeroData((prev) => ({
            ...prev,
            greeting: first.data.greeting || prev.greeting,
            title: first.data.title || prev.title,
            subtitle: first.data.subtitle || prev.subtitle,
            image: first.data.image || prev.image,
          }));
        }
      } catch {
        /* keep defaults on network error */
      }
    };
    loadHero();
    const handler = (evt) => { if (evt?.detail?.type === 'hero') loadHero(); };
    window.addEventListener('content-updated', handler);
    return () => window.removeEventListener('content-updated', handler);
  }, []);

  const meetRobot = () => {
    setSpeech(ROBOT_LINES[lineIdx.current % ROBOT_LINES.length]);
    lineIdx.current += 1;
    setWaving(true);
    clearTimeout(waveTimer.current);
    waveTimer.current = setTimeout(() => setWaving(false), 4000);
  };

  const fade = {
    hidden: { opacity: 0, y: 22 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.15 + i * 0.12, duration: 0.7, ease: 'easeOut' },
    }),
  };

  return (
    <section className="ai-lab relative min-h-[100svh] flex items-center overflow-hidden px-5 sm:px-8">
      {/* animated perspective grid floor */}
      <div className="lab-grid" aria-hidden="true" />
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-24 right-[8%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-[110px] -z-10" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[6%] h-[26rem] w-[26rem] rounded-full bg-fuchsia-600/15 blur-[120px] -z-10" />

      {/* 3D scene */}
      {enable3D && (
        <Suspense fallback={null}>
          <HeroScene waving={waving} />
        </Suspense>
      )}

      {/* legibility scrim behind copy */}
      <div className="pointer-events-none absolute inset-0 -z-[1] bg-[radial-gradient(60%_50%_at_50%_55%,rgba(5,7,14,0.55),transparent_70%)]" />

      {/* ---------------- Foreground copy ---------------- */}
      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        {/* status chip */}
        <motion.div custom={0} variants={fade} initial="hidden" animate="visible" className="mb-6 flex justify-center">
          <div className="holo-chip inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 text-[13px] tracking-wide">
            <span className="lab-status-dot" />
            <span className="text-cyan-200/90 font-medium">NEURAL SYSTEMS ONLINE</span>
            <span className="text-[color:var(--lab-text-dim)]">· {heroData.greeting}</span>
          </div>
        </motion.div>

        <h1 className="sr-only">{heroData.title} — AI &amp; Full-Stack Engineer</h1>

        {/* rotating identity headline */}
        <motion.div custom={1} variants={fade} initial="hidden" animate="visible" aria-hidden="true">
          <div className="mb-2 text-sm uppercase tracking-[0.3em] text-[color:var(--lab-text-dim)]">
            $ initializing profile
          </div>
          <div className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold leading-[1.05]">
            <TypingRoles />
          </div>
        </motion.div>

        {isLoggedIn && (
          <motion.div custom={2} variants={fade} initial="hidden" animate="visible" className="mt-3">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 rounded-lg holo-chip px-3 py-1.5 text-sm hover:border-cyan-400 transition"
              title="Edit Hero Section"
            >
              <Edit size={14} /> Edit hero
            </button>
          </motion.div>
        )}

        {/* primary CTAs */}
        <motion.div custom={4} variants={fade} initial="hidden" animate="visible" className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
          <MagneticButton className="holo-btn-primary" onClick={() => scrollToId('projects')}>
            <Cpu size={18} /> Explore Projects
          </MagneticButton>
          <MagneticButton className="holo-btn-ghost" onClick={() => scrollToId('about')}>
            Enter AI Lab <ArrowRight size={17} />
          </MagneticButton>
          <MagneticButton className="holo-btn-ghost" onClick={meetRobot}>
            <Bot size={18} /> Meet the Robot
          </MagneticButton>
        </motion.div>

        {/* resume + socials */}
        <motion.div custom={5} variants={fade} initial="hidden" animate="visible" className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href={`${API_BASE}/resume`} target="_blank" rel="noopener noreferrer" className="holo-chip inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm text-cyan-100 hover:border-cyan-400 transition">
            <FileText size={16} /> View Resume
          </a>
          <a href={`${API_BASE}/resume/download`} target="_blank" rel="noopener noreferrer" className="holo-chip inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm text-cyan-100 hover:border-cyan-400 transition">
            <Download size={16} /> Download
          </a>

          <span className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

          {[
            { url: GITHUB_URL, icon: <Github size={18} />, label: 'GitHub' },
            { url: LINKEDIN_URL, icon: <Linkedin size={18} />, label: 'LinkedIn' },
            { url: EMAIL_HREF, icon: <Mail size={18} />, label: 'Email' },
            { url: LEETCODE_URL, icon: <SiLeetcode size={18} />, label: 'LeetCode' },
            { url: GEEKSFORGEEKS_URL, icon: <SiGeeksforgeeks size={18} />, label: 'GeeksforGeeks' },
          ]
            .filter((s) => s.url)
            .map((s) => (
              <motion.a
                key={s.label}
                href={s.url}
                target={s.url.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                className="holo-chip grid h-10 w-10 place-items-center rounded-lg text-cyan-100 hover:border-cyan-400 transition"
                title={s.label}
              >
                {s.icon}
              </motion.a>
            ))}
        </motion.div>
      </div>

      {/* ---------------- Robot speech hologram ---------------- */}
      {speech && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-24 left-6 z-20 hidden max-w-xs sm:block"
        >
          <div className="holo-speech rounded-2xl px-4 py-3">
            <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-widest text-cyan-300/80">
              <Bot size={13} /> ARIA · assistant
              <button onClick={() => setSpeech(null)} className="ml-auto text-white/40 hover:text-white/80">✕</button>
            </div>
            <p className="text-sm text-cyan-50/90">{speech}</p>
          </div>
        </motion.div>
      )}

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ delay: 1, duration: 2, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-[color:var(--lab-text-dim)]"
      >
        scroll to explore
      </motion.div>
    </section>
  );
};

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Edit } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import {
  SiGithub, SiVercel, SiPostman, SiRender, SiBrevo, SiGit, SiNumpy, SiPandas,
  SiMysql, SiMongodb, SiNodedotjs, SiExpress, SiJsonwebtokens, SiHtml5, SiCss,
  SiJavascript, SiReact, SiTailwindcss, SiC, SiCplusplus, SiPython,
} from 'react-icons/si';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/apiBase';

// skill name (lowercased) -> [logo, brand color]
const LOGOS = {
  github: [SiGithub, '#e5e7eb'],
  vercel: [SiVercel, '#e5e7eb'],
  postman: [SiPostman, '#FF6C37'],
  render: [SiRender, '#46E3B7'],
  brevo: [SiBrevo, '#22c55e'],
  git: [SiGit, '#F05032'],
  numpy: [SiNumpy, '#4DABCF'],
  pandas: [SiPandas, '#a78bfa'],
  mysql: [SiMysql, '#5b9bd5'],
  mongodb: [SiMongodb, '#47A248'],
  'node.js': [SiNodedotjs, '#5FA04E'],
  nodejs: [SiNodedotjs, '#5FA04E'],
  'express.js': [SiExpress, '#cbd5e1'],
  express: [SiExpress, '#cbd5e1'],
  'jwt authentication': [SiJsonwebtokens, '#e879f9'],
  jwt: [SiJsonwebtokens, '#e879f9'],
  html: [SiHtml5, '#E34F26'],
  css: [SiCss, '#3b82f6'],
  javascript: [SiJavascript, '#F7DF1E'],
  react: [SiReact, '#61DAFB'],
  'react.js': [SiReact, '#61DAFB'],
  'react.ja': [SiReact, '#61DAFB'],
  'tailwind css': [SiTailwindcss, '#06B6D4'],
  tailwindcss: [SiTailwindcss, '#06B6D4'],
  c: [SiC, '#649AD2'],
  'c++': [SiCplusplus, '#649AD2'],
  python: [SiPython, '#8bb9e0'],
};

const norm = (s = '') => s.trim().toLowerCase();

const reorderCategories = (categories) => {
  const order = ['language', 'frontend', 'front end', 'backend', 'back end', 'ai', 'ml', 'database', 'version control', 'tools'];
  const rank = (name = '') => {
    const l = name.toLowerCase();
    const i = order.findIndex((e) => l.includes(e));
    return i === -1 ? order.length + 1 : i;
  };
  return [...categories].sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category));
};

/** One skill: glowing logo node with its name below (no percentages, no box). */
function SkillNode({ name, index, inView }) {
  const [Icon, color] = LOGOS[norm(name)] || [];
  const glow = color || '#22d3ee';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.03 * index }}
      whileHover={{ y: -5 }}
      className="group flex w-[76px] shrink-0 flex-col items-center gap-2.5"
    >
      <div className="relative grid h-16 w-16 place-items-center rounded-2xl holo-chip transition-colors duration-300 group-hover:border-cyan-400/80">
        {Icon ? (
          <Icon size={30} style={{ color: glow }} />
        ) : (
          <span className="text-base font-bold uppercase text-cyan-200">{name.replace(/[^a-z0-9]/gi, '').slice(0, 3)}</span>
        )}
        {/* hover glow */}
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `0 0 24px -3px ${glow}` }}
        />
      </div>
      <span className="text-center text-[11px] leading-tight text-[color:var(--lab-text-dim)] transition-colors group-hover:text-cyan-100">
        {name}
      </span>
    </motion.div>
  );
}

export const SkillsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.08, triggerOnce: true });
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/content/skills`);
      const data = await res.json();
      const sorted = [...data].sort(
        (a, b) => new Date(a.createdAt || a.data?.createdAt || 0) - new Date(b.createdAt || b.data?.createdAt || 0)
      );
      const grouped = {};
      sorted.forEach((s) => {
        const category = s.data?.category || s.category || 'Other';
        if (!grouped[category]) grouped[category] = { category, items: [] };
        grouped[category].items.push({ name: s.data?.name || s.name || 'Skill' });
      });
      setSkills(reorderCategories(Object.values(grouped)));
    } catch {
      /* keep empty on error */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  useEffect(() => {
    const onAuth = () => fetchSkills();
    const onUpdate = (e) => { if (e.detail?.type === 'skills') fetchSkills(); };
    window.addEventListener('auth-changed', onAuth);
    window.addEventListener('content-updated', onUpdate);
    return () => {
      window.removeEventListener('auth-changed', onAuth);
      window.removeEventListener('content-updated', onUpdate);
    };
  }, [fetchSkills]);

  return (
    <section ref={ref} className="relative overflow-hidden px-4 py-24">
      {/* ambient glow */}
      <div className="pointer-events-none absolute right-[10%] top-10 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-10 left-[8%] -z-10 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-[100px]" />

      <div className="mx-auto max-w-5xl">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full holo-chip px-4 py-1.5 text-[12px] uppercase tracking-[0.25em] text-cyan-200/90">
            <span className="lab-status-dot" /> Tech Stack
          </div>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-4xl font-display font-extrabold md:text-5xl gradient-text">Skill Modules</h2>
            {isLoggedIn && (
              <button
                onClick={() => navigate('/skills')}
                className="rounded-lg holo-chip p-2 text-cyan-200 transition hover:border-cyan-400"
                title="Manage Skills"
              >
                <Edit size={18} />
              </button>
            )}
          </div>
          <p className="mt-3 text-[color:var(--lab-text-dim)]">The languages, frameworks and tools powering the lab.</p>
        </motion.div>

        {loading ? (
          <p className="py-16 text-center text-[color:var(--lab-text-dim)]">Loading modules…</p>
        ) : skills.length === 0 ? (
          <div className="holo-panel mx-auto max-w-md rounded-2xl py-14 text-center">
            <p className="mb-2 text-3xl">🧠</p>
            <p className="text-[color:var(--lab-text-dim)]">No skills added yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((group, gi) => (
              <motion.div
                key={gi}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.06 * gi }}
                whileHover={{ y: -5 }}
                className="holo-panel hud-frame rounded-2xl p-6"
              >
                {/* category label */}
                <div className="mb-5 flex items-center gap-2.5">
                  <span className="lab-status-dot" />
                  <h3 className="flex-1 text-[13px] font-semibold uppercase tracking-[0.18em] text-cyan-200">{group.category}</h3>
                  <span className="rounded-md holo-chip px-1.5 py-0.5 text-[10px] text-[color:var(--lab-text-dim)]">{group.items.length}</span>
                </div>
                <span className="mb-5 block h-px w-full bg-gradient-to-r from-cyan-400/35 via-cyan-400/10 to-transparent" />
                {/* skill nodes */}
                <div className="flex flex-wrap gap-x-3 gap-y-5">
                  {group.items.map((s, i) => (
                    <SkillNode key={i} name={s.name} index={i} inView={inView} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

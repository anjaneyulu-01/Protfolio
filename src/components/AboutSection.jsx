import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

export const AboutSection = () => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [aboutData, setAboutData] = useState({
    _id: null,
    id: null,
    title: 'About Me',
    description: "I'm a passionate full-stack developer with a love for creating beautiful, functional web experiences.",
    details: "When I'm not coding, you'll find me exploring new technologies, contributing to open-source projects, or sharing knowledge with the developer community.",
    image: '',
    highlights: ['2nd-year B.Tech CSE (AI & ML)', 'DSA & Problem Solving', 'Full Stack Focus', 'Internships & OSS'],
    sectionIcon: '💻',
    sectionLabel: 'About Me',
    mainTitle: 'Creative and MERN-Stack Developer & Problem Solver',
    subtitle: 'DSA • AI/ML • Open Source Contributor'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(aboutData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAbout = async () => {
      try {
        const res = await fetch(`${API_BASE}/content/about`);
        const json = await res.json();
        const first = Array.isArray(json) ? json[0] : json;
        if (first?.data) {
          const newData = {
            _id: first._id || first.id,
            id: first._id || first.id,
            title: first.data.title || aboutData.title,
            description: first.data.description || aboutData.description,
            details: first.data.details || aboutData.details,
            image: first.data.image || aboutData.image,
            highlights: first.data.highlights || aboutData.highlights,
            sectionIcon: first.data.sectionIcon || '💻',
            sectionLabel: first.data.sectionLabel || 'About Me',
            mainTitle: first.data.mainTitle || 'Creative and MERN-Stack Developer & Problem Solver',
            subtitle: first.data.subtitle || 'DSA • AI/ML • Open Source Contributor'
          };
          setAboutData(newData);
          setEditForm(newData);
        }
      } catch (err) {
        // ...existing code...
      }
    };

    loadAbout();

    const handler = (evt) => {
      if (evt?.detail?.type === 'about') {
        loadAbout();
        setIsEditing(false);
      }
    };
    window.addEventListener('content-updated', handler);
    return () => window.removeEventListener('content-updated', handler);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const highlights = [
    '2nd Year CSE (AI & ML)',
    'DSA (LeetCode)',
    'MERN Stack',
    'Open Source Contributions'
  ];

  const [introText, techLine] = (() => {
    if (aboutData.description?.includes('Tech:')) {
      const [intro, tech] = aboutData.description.split('Tech:');
      return [intro.trim(), tech ? `Tech: ${tech.trim()}` : ''];
    }
    return [aboutData.description, ''];
  })();

  const bulletItems = aboutData.highlights?.length ? aboutData.highlights : highlights;

  const handleSaveHeader = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const payload = editForm;

      // Check if about data has an ID from the database
      const aboutId = aboutData?._id || aboutData?.id;
      const hasExisting = Boolean(aboutId);
      const url = hasExisting
        ? `${API_BASE}/content/about/${aboutId}`
        : `${API_BASE}/content/about`;
      const method = hasExisting ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Reload the data from the server
        const response = await fetch(`${API_BASE}/content/about`);
        const json = await response.json();
        const first = Array.isArray(json) ? json[0] : json;
        if (first?.data) {
          const newData = {
            _id: first._id || first.id,
            id: first._id || first.id,
            title: first.data.title || aboutData.title,
            description: first.data.description || aboutData.description,
            details: first.data.details || aboutData.details,
            image: first.data.image || aboutData.image,
            highlights: first.data.highlights || aboutData.highlights,
            sectionIcon: first.data.sectionIcon || '💻',
            sectionLabel: first.data.sectionLabel || 'About Me',
            mainTitle: first.data.mainTitle || 'Creative and MERN-Stack Developer & Problem Solver',
            subtitle: first.data.subtitle || 'DSA • AI/ML • Open Source Contributor'
          };
          setAboutData(newData);
          setEditForm(newData);
        }
        setIsEditing(false);
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'about' } }));
      } else {
        const errorText = await res.text();
        // ...existing code...
        alert('Failed to save changes: ' + errorText);
      }
    } catch (err) {
      // ...existing code...
      alert('Error saving changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section ref={ref} className="py-20 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="flex flex-col items-center text-center gap-3"
        >
          <div className="flex items-center gap-2 text-slate-300 text-lg">
            <span aria-hidden>{aboutData.sectionIcon || '💻'}</span>
            <span>{aboutData.sectionLabel || 'About Me'}</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight text-slate-100">
              {aboutData.mainTitle || 'Full Stack Developer'}
            </h2>
            <p className="text-base md:text-lg text-slate-400">{aboutData.subtitle || 'DSA • AI/ML • Open Source Contributor'}</p>
          </div>
          {isLoggedIn && (
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                setEditForm(aboutData);
                setIsEditing(true);
              }}
              className="p-3 rounded-lg glass hover:bg-white/10 transition-all"
              title="Edit Section Header"
            >
              <Edit size={22} />
            </motion.button>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 gap-12 items-start"
        >
          {/* Left - Image */}
          <motion.div variants={itemVariants} className="w-full max-w-[440px] mx-auto md:justify-self-center">
            <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              {aboutData.image ? (
                <img
                  src={aboutData.image}
                  alt={aboutData.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-6xl">👨‍💻</div>
              )}
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            variants={containerVariants}
            className="space-y-6 md:justify-self-start text-left max-w-2xl w-full mx-auto md:mx-0"
          >
            <motion.p
              variants={itemVariants}
              className="text-base md:text-lg text-slate-300 leading-relaxed max-w-prose"
            >
              {introText}
            </motion.p>

            {techLine && (
              <motion.p
                variants={itemVariants}
                className="text-base md:text-lg text-slate-400 leading-relaxed max-w-prose"
              >
                {techLine}
              </motion.p>
            )}

            {aboutData.details && (
              <motion.p
                variants={itemVariants}
                className="text-base md:text-lg text-slate-400 leading-relaxed max-w-prose"
              >
                {aboutData.details}
              </motion.p>
            )}

            <motion.ul
              variants={itemVariants}
              className="list-disc pl-5 space-y-2 text-slate-400 leading-relaxed max-w-prose"
            >
              {bulletItems.map((item, idx) => (
                <li key={idx} className="leading-relaxed text-slate-300">
                  {item}
                </li>
              ))}
            </motion.ul>

            <motion.div variants={itemVariants} className="h-px w-24 bg-white/10" />

            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl"
            >
              {bulletItems.map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="border border-white/10 rounded-lg px-3 py-2 bg-white/5 text-slate-200 text-sm font-semibold"
                >
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border border-slate-700 p-8 w-full max-w-2xl my-8 space-y-6"
            >
              <h2 className="text-2xl font-semibold text-slate-100">Edit About Me</h2>

              <div className="space-y-4">
                {/* Section Icon */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Section Icon/Emoji</label>
                  <input
                    type="text"
                    placeholder="💻"
                    value={editForm.sectionIcon || ''}
                    onChange={(e) => setEditForm({ ...editForm, sectionIcon: e.target.value })}
                    maxLength="2"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Section Label */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Section Label</label>
                  <input
                    type="text"
                    placeholder="About Me"
                    value={editForm.sectionLabel || ''}
                    onChange={(e) => setEditForm({ ...editForm, sectionLabel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Main Title */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Main Title</label>
                  <input
                    type="text"
                    placeholder="Full Stack Developer"
                    value={editForm.mainTitle || ''}
                    onChange={(e) => setEditForm({ ...editForm, mainTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Subtitle</label>
                  <input
                    type="text"
                    placeholder="DSA • AI/ML • Open Source Contributor"
                    value={editForm.subtitle || ''}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Software Developer & Tech Enthusiast"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Intro (short)</label>
                  <textarea
                    placeholder="2-3 lines about you"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows="5"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Details */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Details (next paragraph)</label>
                  <textarea
                    placeholder="Add a bit more context on what you focus on"
                    value={editForm.details || ''}
                    onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Bullet Points */}
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Bullet Points (4)</label>
                  <div className="space-y-2">
                    {(editForm.highlights || ['', '', '', '']).map((item, idx) => (
                      <input
                        key={idx}
                        type="text"
                        placeholder={`Point ${idx + 1}`}
                        value={item || ''}
                        onChange={(e) => {
                          const next = [...(editForm.highlights || ['', '', '', ''])];
                          next[idx] = e.target.value;
                          setEditForm({ ...editForm, highlights: next });
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHeader}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

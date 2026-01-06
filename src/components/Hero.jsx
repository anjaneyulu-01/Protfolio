import { motion } from 'framer-motion';
import { ChevronDown, Github, Linkedin, Mail, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

export const Hero = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [heroData, setHeroData] = useState({
    greeting: '👋 Welcome to my portfolio',
    title: 'Creative & MERN-Stack Developer & Problem Solver',
    subtitle: 'Building beautiful, scalable web experiences with modern technologies.',
    image: ''
  });

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
      } catch (err) {
        // ...existing code...
      }
    };

    loadHero();

    const handler = (evt) => {
      if (evt?.detail?.type === 'hero') {
        loadHero();
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
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: 'easeOut' },
    },
  };

  const floatingVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.5, duration: 1 },
    },
  };

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl -z-10 animate-pulse" />

      <motion.div
        className="text-center z-10 max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Greeting */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="inline-block px-4 py-2 rounded-full glass">
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
              {heroData.greeting}
            </span>
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight flex items-center justify-center gap-4 flex-wrap"
        >
          <span className="gradient-text">{heroData.title}</span>
          {heroData.image && (
            <span className="inline-flex w-16 h-16 rounded-full overflow-hidden border border-white/10">
              <img src={heroData.image} alt="Hero" className="w-full h-full object-cover" />
            </span>
          )}
          {isLoggedIn && (
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/admin')}
              className="p-2 rounded-lg glass hover:bg-white/10 transition-all text-sm"
              title="Edit Hero Section"
            >
              <Edit size={20} />
            </motion.button>
          )}
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants} className="text-xl text-gray-400 mb-8 leading-relaxed">
          {heroData.subtitle}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary group flex items-center justify-center"
          >
            View Resume
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </a>
          <a
            href="/resume.pdf"
            download
            className="btn-secondary flex items-center justify-center"
          >
            Download Resume
          </a>
        </motion.div>

        {/* Social links */}
        <motion.div variants={itemVariants} className="flex gap-4 justify-center">
          <motion.a
            href="https://github.com/anjaneyulu-01"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 glass rounded-lg hover:bg-white/20 transition-all"
            title="GitHub"
          >
            <Github size={24} />
          </motion.a>
          <motion.a
            href="https://www.linkedin.com/in/mr-anjaneyulu-a08377271/"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 glass rounded-lg hover:bg-white/20 transition-all"
            title="LinkedIn"
          >
            <Linkedin size={24} />
          </motion.a>
          <motion.a
            href="mailto:anjaneyulu.dev01@gmail.com"
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 glass rounded-lg hover:bg-white/20 transition-all"
            title="Email"
          >
            <Mail size={24} />
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        variants={floatingVariants}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <ChevronDown className="text-purple-400" size={32} />
      </motion.div>
    </section>
  );
};

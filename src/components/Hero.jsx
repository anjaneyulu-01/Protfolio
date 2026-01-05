import { motion } from 'framer-motion';
import { ChevronDown, Github, Linkedin, Mail, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Hero = () => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [heroData, setHeroData] = useState({
    greeting: '👋 Welcome to my portfolio',
    title: 'Creative Developer',
    subtitle: 'Building beautiful, scalable web experiences with modern technologies.',
  });

  useEffect(() => {
    // You can fetch hero data from backend if you create a specific endpoint
    // For now, it will use default values
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
              👋 Welcome to my portfolio
            </span>
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-7xl font-bold mb-6 leading-tight flex items-center justify-center gap-4 flex-wrap"
        >
          <span className="gradient-text">{heroData.title}</span>
          <span className="text-white"> & Full-Stack</span>
          <br />
          <span className="text-white">Problem Solver</span>
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
          <button className="btn-primary group">
            View My Work
            <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </button>
          <button className="btn-secondary">Download Resume</button>
        </motion.div>

        {/* Social links */}
        <motion.div variants={itemVariants} className="flex gap-4 justify-center">
          <motion.a
            href="#"
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 glass rounded-lg hover:bg-white/20 transition-all"
          >
            <Github size={24} />
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 glass rounded-lg hover:bg-white/20 transition-all"
          >
            <Linkedin size={24} />
          </motion.a>
          <motion.a
            href="#"
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 glass rounded-lg hover:bg-white/20 transition-all"
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

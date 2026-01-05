import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowRight, Code2, Zap, Target, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AboutSection = () => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [aboutData, setAboutData] = useState({
    description: "I'm a passionate full-stack developer with a love for creating beautiful, functional web experiences. With expertise in modern frameworks and a keen eye for design, I bridge the gap between creative vision and technical implementation.",
    details: "When I'm not coding, you'll find me exploring new technologies, contributing to open-source projects, or sharing knowledge with the developer community."
  });

  useEffect(() => {
    // You can fetch about data from backend if needed
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

  const stats = [
    { label: 'Projects Completed', value: '25+', icon: Code2 },
    { label: 'Years Experience', value: '4+', icon: Zap },
    { label: 'Clients Satisfied', value: '15+', icon: Target },
  ];

  return (
    <section ref={ref} className="py-20 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          {/* Left - Image */}
          <motion.div variants={itemVariants} className="relative">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden glass">
              <motion.div
                className="w-full h-full bg-gradient-to-br from-purple-600 to-orange-500 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <span className="text-8xl">👨‍💻</span>
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating stats */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -bottom-4 -left-4 glass rounded-xl p-4"
            >
              <p className="text-sm text-gray-400">Total Projects</p>
              <p className="text-2xl font-bold gradient-text">25+</p>
            </motion.div>
          </motion.div>

          {/* Right - Content */}
          <motion.div variants={containerVariants} className="space-y-8">
            <motion.div variants={itemVariants} className="flex items-center gap-4">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">About Me</h2>
                <div className="w-12 h-1 gradient-primary rounded-full" />
              </div>
              {isLoggedIn && (
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate('/about')}
                  className="p-3 rounded-lg glass hover:bg-white/10 transition-all"
                  title="Edit About Section"
                >
                  <Edit size={24} />
                </motion.button>
              )}
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-lg text-gray-400 leading-relaxed"
            >
              {aboutData.description}
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-lg text-gray-400 leading-relaxed"
            >
              {aboutData.details}
            </motion.p>

            {/* Stats grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 pt-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ y: -5 }}
                    className="glass rounded-lg p-4 text-center"
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                    <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* CTA */}
            <motion.button
              variants={itemVariants}
              whileHover={{ x: 5 }}
              className="btn-primary group inline-flex items-center"
            >
              Learn More About Me
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

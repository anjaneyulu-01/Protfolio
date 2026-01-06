import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const SkillsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const reorderCategories = (categories) => {
    const desiredOrder = [
      'languages',
      'programming languages',
      'language',
      'frontend',
      'front end',
      'backend',
      'back end',
      'ai/ml',
      'ai',
      'ml',
      'version control',
      'tools & platforms',
      'tools and platforms'
    ];

    const rank = (name = '') => {
      const lower = name.toLowerCase();
      const idx = desiredOrder.findIndex((entry) => lower.includes(entry));
      return idx === -1 ? desiredOrder.length + 1 : idx;
    };

    return [...categories].sort((a, b) => {
      const ra = rank(a.category);
      const rb = rank(b.category);
      if (ra !== rb) return ra - rb;
      return a.category.localeCompare(b.category);
    });
  };

  // Fetch skills from backend
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8005/content/skills');
        const data = await response.json();
        
        // Sort by creation date - oldest first
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.data?.createdAt || 0);
          const dateB = new Date(b.createdAt || b.data?.createdAt || 0);
          return dateA - dateB;
        });
        
        // Group skills by category
        const groupedSkills = {};
        sortedData.forEach((skill) => {
          const category = skill.data?.category || skill.category || 'Other';
          if (!groupedSkills[category]) {
            groupedSkills[category] = {
              category: category,
              items: [],
              icon: skill.data?.icon || skill.icon || '💻'
            };
          }
          groupedSkills[category].items.push({
            name: skill.data?.name || skill.name || 'Skill',
            level: parseInt(skill.data?.proficiency || skill.proficiency || 80)
          });
        });
        
        // Convert to array
        const transformedSkills = reorderCategories(Object.values(groupedSkills));
        setSkills(transformedSkills);
      } catch (error) {
          // Error handling removed
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, []);

  // Re-fetch when authentication changes
  useEffect(() => {
    const handleAuthChange = () => {
      const fetchSkills = async () => {
        try {
          const response = await fetch('http://127.0.0.1:8005/content/skills');
          const data = await response.json();
          
          // Sort by creation date - oldest first
          const sortedData = [...data].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.data?.createdAt || 0);
            const dateB = new Date(b.createdAt || b.data?.createdAt || 0);
            return dateA - dateB;
          });
          
          // Group skills by category
          const groupedSkills = {};
          sortedData.forEach((skill) => {
            const category = skill.data?.category || skill.category || 'Other';
            if (!groupedSkills[category]) {
              groupedSkills[category] = {
                category: category,
                items: [],
                icon: skill.data?.icon || skill.icon || '💻'
              };
            }
            groupedSkills[category].items.push({
              name: skill.data?.name || skill.name || 'Skill',
              level: parseInt(skill.data?.proficiency || skill.proficiency || 80)
            });
          });

          const transformedSkills = reorderCategories(Object.values(groupedSkills));
          setSkills(transformedSkills);
        } catch (error) {
            // Error handling removed
        }
      };
      fetchSkills();
    };

    const handleContentUpdate = (event) => {
      if (event.detail?.type === 'skills') {
        handleAuthChange();
      }
    };

    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('content-updated', handleContentUpdate);
    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('content-updated', handleContentUpdate);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  return (
    <section ref={ref} className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={containerVariants}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold">
              Skills & Expertise
            </motion.h2>
            {isLoggedIn && (
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/skills')}
                className="p-3 rounded-lg glass hover:bg-white/10 transition-all"
                title="Manage Skills"
              >
                <Edit size={24} />
              </motion.button>
            )}
          </div>
          <motion.div
            variants={itemVariants}
            className="w-12 h-1 gradient-primary rounded-full mx-auto mb-6"
          />
          <motion.p variants={itemVariants} className="text-gray-400 text-lg">
            Technologies and tools I've mastered over the years
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Loading skills...</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-2xl mb-4">🧠</p>
            <p className="text-gray-400 mb-4">No skills added yet</p>
            {isLoggedIn && (
              <button
                onClick={() => navigate('/skills')}
                className="btn-primary"
              >
                Add Your Skills
              </button>
            )}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid md:grid-cols-3 gap-8"
          >
            {skills.slice(0, 3).map((skillGroup, groupIndex) => (
            <motion.div
              key={groupIndex}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="glass rounded-2xl p-8"
            >
              <h3 className="text-xl font-bold mb-6 gradient-text">{skillGroup.category}</h3>

              <div className="space-y-6">
                {skillGroup.items.map((skill, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 0.1 * index + 0.5 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">{skill.name}</span>
                      <span className="text-sm text-purple-400">{skill.level}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full gradient-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={inView ? { width: `${skill.level}%` } : { width: 0 }}
                        transition={{ duration: 1, delay: 0.1 * index + 0.5 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}

        {!loading && skills.length > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/skills')}
              className="btn-primary"
            >
              View All Skills →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

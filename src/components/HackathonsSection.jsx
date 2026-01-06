import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Trophy, Edit, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const HackathonsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch hackathons from backend
  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8005/content/hackathons');
        const data = await response.json();
        
        const transformedHackathons = data.map((hack) => ({
          id: hack.id,
          title: hack.data.title || 'Hackathon',
          description: hack.data.description || '',
          achievement: hack.data.achievement || '',
          date: hack.data.date || '',
          image: hack.data.image || '🏁',
          link: hack.data.link || '#',
        }));
        
        setHackathons(transformedHackathons);
      } catch (error) {
        // ...existing code...
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, []);

  // Re-fetch when content updates
  useEffect(() => {
    const handleContentUpdate = (event) => {
      if (event.detail?.type === 'hackathons') {
        const fetchHackathons = async () => {
          try {
            const response = await fetch('http://127.0.0.1:8005/content/hackathons');
            const data = await response.json();
            const transformedHackathons = data.map((hack) => ({
              id: hack.id,
              title: hack.data.title || 'Hackathon',
              description: hack.data.description || '',
              achievement: hack.data.achievement || '',
              date: hack.data.date || '',
              image: hack.data.image || '🏁',
              link: hack.data.link || '#',
            }));
            setHackathons(transformedHackathons);
          } catch (error) {
            // ...existing code...
          }
        };
        fetchHackathons();
      }
    };

    window.addEventListener('content-updated', handleContentUpdate);
    return () => window.removeEventListener('content-updated', handleContentUpdate);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-600 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={containerVariants}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold">
              Hackathons & Competitions
            </motion.h2>
            {isLoggedIn && (
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/hackathons')}
                className="p-3 rounded-lg glass hover:bg-white/10 transition-all"
                title="Manage Hackathons"
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
            My competitive coding and innovation experiences
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Loading hackathons...</p>
          </div>
        ) : hackathons.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-2xl mb-4">🏁</p>
            <p className="text-gray-400 mb-4">No hackathons yet</p>
            {isLoggedIn && (
              <button
                onClick={() => navigate('/hackathons')}
                className="btn-primary"
              >
                Add Your First Hackathon
              </button>
            )}
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {hackathons.slice(0, 6).map((hackathon) => (
              <motion.div
                key={hackathon.id}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="group glass rounded-2xl p-6 cursor-pointer overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/0 to-blue-500/0 group-hover:from-green-600/10 group-hover:to-blue-500/10 transition-all duration-300" />

                <div className="relative z-10">
                  {hackathon.image && typeof hackathon.image === 'string' && hackathon.image.startsWith('http') ? (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={hackathon.image} 
                        alt={hackathon.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-5xl mb-4">{hackathon.image || '🏁'}</div>
                  )}
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:gradient-text transition-all">
                    {hackathon.title}
                  </h3>
                  
                  {hackathon.achievement && (
                    <div className="mb-3 px-3 py-1 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-600/30 rounded-full inline-flex items-center gap-2">
                      <Trophy size={16} className="text-yellow-400" />
                      <span className="text-sm text-yellow-300">{hackathon.achievement}</span>
                    </div>
                  )}
                  
                  {hackathon.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{hackathon.description}</p>
                  )}
                  
                  {hackathon.date && (
                    <p className="text-sm text-gray-500 mb-4">{hackathon.date}</p>
                  )}

                  {hackathon.link && hackathon.link !== '#' && (
                    <motion.a
                      href={hackathon.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      View Details
                      <ExternalLink size={16} />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {hackathons.length > 6 && (
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={itemVariants}
            className="text-center mt-12"
          >
            <button 
              onClick={() => navigate('/hackathons')}
              className="btn-primary"
            >
              View All Hackathons →
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

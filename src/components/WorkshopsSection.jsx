import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { BookOpen, Edit, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/apiBase';

export const WorkshopsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch workshops from backend
  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const response = await fetch(`${API_BASE}/content/workshops`);
        const data = await response.json();
        
        const transformedWorkshops = data.map((workshop) => ({
          id: workshop.id,
          title: workshop.data.title || 'Workshop',
          description: workshop.data.description || '',
          date: workshop.data.date || '',
          location: workshop.data.location || '',
          image: workshop.data.image || '📚',
          link: workshop.data.link || '#',
        }));
        
        setWorkshops(transformedWorkshops);
      } catch (error) {
        console.error('Failed to fetch workshops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, []);

  // Re-fetch when content updates
  useEffect(() => {
    const handleContentUpdate = (event) => {
      if (event.detail?.type === 'workshops') {
        const fetchWorkshops = async () => {
          try {
            const response = await fetch(`${API_BASE}/content/workshops`);
            const data = await response.json();
            const transformedWorkshops = data.map((workshop) => ({
              id: workshop.id,
              title: workshop.data.title || 'Workshop',
              description: workshop.data.description || '',
              date: workshop.data.date || '',
              location: workshop.data.location || '',
              image: workshop.data.image || '📚',
              link: workshop.data.link || '#',
            }));
            setWorkshops(transformedWorkshops);
          } catch (error) {
            console.error('Failed to fetch workshops:', error);
          }
        };
        fetchWorkshops();
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
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl" />
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
              Workshops & Events
            </motion.h2>
            {isLoggedIn && (
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/workshops')}
                className="p-3 rounded-lg glass hover:bg-white/10 transition-all"
                title="Manage Workshops"
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
            Learning opportunities and community events
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Loading workshops...</p>
          </div>
        ) : workshops.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-2xl mb-4">📚</p>
            <p className="text-gray-400 mb-4">No workshops yet</p>
            {isLoggedIn && (
              <button
                onClick={() => navigate('/workshops')}
                className="btn-primary"
              >
                Add Your First Workshop
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
            {workshops.slice(0, 6).map((workshop) => (
              <motion.div
                key={workshop.id}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="group glass rounded-2xl p-6 cursor-pointer overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-cyan-500/0 group-hover:from-blue-600/10 group-hover:to-cyan-500/10 transition-all duration-300" />

                <div className="relative z-10">
                  {workshop.image && typeof workshop.image === 'string' && workshop.image.startsWith('http') ? (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={workshop.image} 
                        alt={workshop.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-5xl mb-4">{workshop.image || '📚'}</div>
                  )}
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:gradient-text transition-all">
                    {workshop.title}
                  </h3>
                  
                  {workshop.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{workshop.description}</p>
                  )}
                  
                  {workshop.date && (
                    <p className="text-sm text-gray-500 mb-2">📅 {workshop.date}</p>
                  )}

                  {workshop.location && (
                    <p className="text-sm text-gray-500 mb-4">📍 {workshop.location}</p>
                  )}

                  {workshop.link && workshop.link !== '#' && (
                    <motion.a
                      href={workshop.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Learn More
                      <ExternalLink size={16} />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {workshops.length > 6 && (
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={itemVariants}
            className="text-center mt-12"
          >
            <button 
              onClick={() => navigate('/workshops')}
              className="btn-primary"
            >
              View All Workshops →
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

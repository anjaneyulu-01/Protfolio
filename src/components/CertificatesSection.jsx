import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Award, Edit, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const CertificatesSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch certificates from backend
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8005/content/certificates');
        const data = await response.json();
        
        const transformedCerts = data.map((cert) => ({
          id: cert.id,
          title: cert.data.title || cert.data.name || 'Certificate',
          issuer: cert.data.issuer || cert.data.organization || '',
          date: cert.data.date || '',
          image: cert.data.image || '🏆',
          link: cert.data.link || cert.data.credentialUrl || '#',
        }));
        
        setCertificates(transformedCerts);
      } catch (error) {
        // ...existing code...
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  // Re-fetch when content updates
  useEffect(() => {
    const handleContentUpdate = (event) => {
      if (event.detail?.type === 'certificates') {
        const fetchCertificates = async () => {
          try {
            const response = await fetch('http://127.0.0.1:8005/content/certificates');
            const data = await response.json();
            const transformedCerts = data.map((cert) => ({
              id: cert.id,
              title: cert.data.title || cert.data.name || 'Certificate',
              issuer: cert.data.issuer || cert.data.organization || '',
              date: cert.data.date || '',
              image: cert.data.image || '🏆',
              link: cert.data.link || cert.data.credentialUrl || '#',
            }));
            setCertificates(transformedCerts);
          } catch (error) {
            // ...existing code...
          }
        };
        fetchCertificates();
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
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-600 rounded-full blur-3xl" />
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
              Certificates & Awards
            </motion.h2>
            {isLoggedIn && (
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/certificates')}
                className="p-3 rounded-lg glass hover:bg-white/10 transition-all"
                title="Manage Certificates"
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
            Professional certifications and achievements
          </motion.p>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-2xl mb-4">🏆</p>
            <p className="text-gray-400 mb-4">No certificates yet</p>
            {isLoggedIn && (
              <button
                onClick={() => navigate('/certificates')}
                className="btn-primary"
              >
                Add Your First Certificate
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
            {certificates.slice(0, 6).map((cert) => (
              <motion.div
                key={cert.id}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="group glass rounded-2xl p-6 cursor-pointer overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/0 to-orange-500/0 group-hover:from-yellow-600/10 group-hover:to-orange-500/10 transition-all duration-300" />

                <div className="relative z-10">
                  {cert.image && typeof cert.image === 'string' && cert.image.startsWith('http') ? (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={cert.image} 
                        alt={cert.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-5xl mb-4">{cert.image || '🏆'}</div>
                  )}
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:gradient-text transition-all">
                    {cert.title}
                  </h3>
                  
                  {cert.issuer && (
                    <p className="text-sm text-purple-400 mb-2">{cert.issuer}</p>
                  )}
                  
                  {cert.date && (
                    <p className="text-sm text-gray-500 mb-4">{cert.date}</p>
                  )}

                  {cert.link && cert.link !== '#' && (
                    <motion.a
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      View Credential
                      <ExternalLink size={16} />
                    </motion.a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {certificates.length > 6 && (
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={itemVariants}
            className="text-center mt-12"
          >
            <button 
              onClick={() => navigate('/certificates')}
              className="btn-primary"
            >
              View All Certificates →
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ExternalLink, Github, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ProjectsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8005/content/projects');
        const data = await response.json();
        
        // Transform backend data to match component structure
        const transformedProjects = data.map((project) => ({
          id: project.id,
          title: project.data.title || 'Untitled Project',
          description: project.data.description || project.data.desc || '',
          tags: Array.isArray(project.data.tech) 
            ? project.data.tech 
            : (project.data.tech || '').split(',').map(t => t.trim()).filter(Boolean),
          category: project.data.category || 'fullstack',
          image: project.data.image || '💼',
          link: project.data.link || '#',
          github: project.data.github || project.data.link || '#',
        }));
        
        setProjects(transformedProjects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        // Keep empty array if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Re-fetch when authentication changes (user might have added/edited content)
  useEffect(() => {
    const handleAuthChange = () => {
      const fetchProjects = async () => {
        try {
          const response = await fetch('http://127.0.0.1:8005/content/projects');
          const data = await response.json();
          const transformedProjects = data.map((project) => ({
            id: project.id,
            title: project.data.title || 'Untitled Project',
            description: project.data.description || project.data.desc || '',
            tags: Array.isArray(project.data.tech) 
              ? project.data.tech 
              : (project.data.tech || '').split(',').map(t => t.trim()).filter(Boolean),
            category: project.data.category || 'fullstack',
            image: project.data.image || '💼',
            link: project.data.link || '#',
            github: project.data.github || project.data.link || '#',
          }));
          setProjects(transformedProjects);
        } catch (error) {
          console.error('Failed to fetch projects:', error);
        }
      };
      fetchProjects();
    };

    const handleContentUpdate = (event) => {
      if (event.detail?.type === 'projects') {
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

  const categories = ['all', 'fullstack', 'frontend', 'backend'];

  const filteredProjects =
    selectedCategory === 'all' ? projects : projects.filter((p) => p.category === selectedCategory);

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
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-600 rounded-full blur-3xl" />
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
              Featured Projects
            </motion.h2>
            {isLoggedIn && (
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/projects')}
                className="p-3 rounded-lg glass hover:bg-white/10 transition-all"
                title="Manage Projects"
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
            Showcasing my best work across different domains
          </motion.p>
        </motion.div>

        {/* Category filters */}
        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={itemVariants}
          className="flex flex-wrap gap-3 justify-center mb-12"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === cat
                  ? 'gradient-primary text-white'
                  : 'glass text-gray-300 hover:text-white'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        {/* Projects grid */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-2xl mb-4">📂</p>
            <p className="text-gray-400 mb-4">No projects yet</p>
            {isLoggedIn && (
              <button
                onClick={() => navigate('/projects')}
                className="btn-primary"
              >
                Add Your First Project
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
            {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="group glass rounded-2xl p-6 cursor-pointer overflow-hidden relative"
            >
              {/* Background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-orange-500/0 group-hover:from-purple-600/10 group-hover:to-orange-500/10 transition-all duration-300" />

              {/* Content */}
              <div className="relative z-10">
                {/* Icon/Image */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  {project.image}
                </motion.div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold mb-2 group-hover:gradient-text transition-all">
                  {project.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-purple-600/20 text-purple-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex gap-3">
                  <motion.a
                    href={project.link}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Visit
                    <ExternalLink size={16} />
                  </motion.a>
                  <motion.a
                    href={project.github}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Code
                    <Github size={16} />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}

        {/* CTA */}
        {projects.length > 0 && (
          <motion.div
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            variants={itemVariants}
            className="text-center mt-12"
          >
            <button 
              onClick={() => navigate('/projects')}
              className="btn-primary"
            >
              View All Projects →
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

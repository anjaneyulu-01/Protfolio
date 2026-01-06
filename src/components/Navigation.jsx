import { motion } from 'framer-motion';
import { useState } from 'react';
import { Menu, X, LogIn, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Projects', href: '#projects' },
    { label: 'Certificates', href: '#certificates' },
    { label: 'Hackathons', href: '#hackathons' },
    { label: 'Workshops', href: '#workshops' },
    { label: 'Contact', href: '#contact' },
  ];

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const menuVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-xl border-b border-[color:var(--card-border)]"
    >
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <motion.a href="#" className="text-2xl font-bold gradient-text">
          Portfolio
        </motion.a>

        {/* Desktop menu */}
        <div className="hidden md:flex gap-8">
          {menuItems.map((item, index) => (
            <motion.a
              key={index}
              href={item.href}
              whileHover={{ y: -2, color: '#8b5cf6' }}
              className="text-[color:var(--text-secondary)] hover:text-purple-400 transition-colors font-medium"
            >
              {item.label}
            </motion.a>
          ))}
        </div>

        {/* Right side controls */}
        <div className="hidden md:flex gap-3 items-center">
          {isLoggedIn ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate('/admin')}
                className="p-2 rounded-lg glass hover:bg-[var(--bg-overlay)] transition-all"
                title="Admin Dashboard"
              >
                <Settings size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={logout}
                className="p-2 rounded-lg glass hover:bg-[var(--bg-overlay)] transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <LogIn size={16} />
              Admin Login
            </motion.button>
          )}
        </div>

        {/* Mobile menu button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg glass"
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          variants={menuVariants}
          initial="hidden"
          animate="visible"
          className="md:hidden border-t border-[color:var(--card-border)] glass-secondary"
        >
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
            {menuItems.map((item, index) => (
              <motion.a
                key={index}
                href={item.href}
                variants={menuItemVariants}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 rounded-lg text-[color:var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[color:var(--text-primary)] transition-all"
              >
                {item.label}
              </motion.a>
            ))}
            <motion.button
              variants={menuItemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-primary"
            >
              Get In Touch
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

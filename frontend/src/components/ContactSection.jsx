import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Mail, Github, Linkedin } from 'lucide-react';

export const ContactSection = () => {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });

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

  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: 'anjaneyulu.dev01@gmail.com',
      href: 'mailto:anjaneyulu.dev01@gmail.com',
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      value: 'Mr Anjaneyulu',
      href: 'https://www.linkedin.com/in/mr-anjaneyulu-a08377271/',
    },
    {
      icon: Github,
      label: 'GitHub',
      value: 'anjaneyulu-01',
      href: 'https://github.com/anjaneyulu-01',
    },
  ];

  return (
    <section ref={ref} className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-20">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center mb-16"
        >
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-4">
            Let's Work Together
          </motion.h2>
          <motion.div
            variants={itemVariants}
            className="w-12 h-1 gradient-primary rounded-full mx-auto mb-6"
          />
          <motion.p variants={itemVariants} className="text-[color:var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Have an exciting project or opportunity? I'd love to hear from you. Let's create something
            amazing together.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {contactMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <motion.a
                key={index}
                href={method.href}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="glass rounded-2xl p-8 text-center group cursor-pointer"
              >
                <div className="inline-flex p-4 rounded-xl gradient-primary mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{method.label}</h3>
                <p className="text-[color:var(--text-secondary)] group-hover:text-[color:var(--text-primary)] transition-colors">{method.value}</p>
              </motion.a>
            );
          })}
        </motion.div>

        {/* Email form */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="max-w-2xl mx-auto"
        >
          <div className="glass rounded-2xl p-8">
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="bg-transparent border border-[color:var(--card-border)] rounded-lg px-4 py-3 text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)] focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="bg-transparent border border-[color:var(--card-border)] rounded-lg px-4 py-3 text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)] focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
                />
              </div>
              <input
                type="text"
                placeholder="Subject"
                className="w-full bg-transparent border border-[color:var(--card-border)] rounded-lg px-4 py-3 text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)] focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all"
              />
              <textarea
                placeholder="Your Message"
                rows="5"
                className="w-full bg-transparent border border-[color:var(--card-border)] rounded-lg px-4 py-3 text-[color:var(--text-primary)] placeholder-[color:var(--text-secondary)] focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all resize-none"
              ></textarea>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full btn-primary"
              >
                Send Message
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

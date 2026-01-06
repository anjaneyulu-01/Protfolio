import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { SkillsSection } from './components/SkillsSection';
import { ProjectsSection } from './components/ProjectsSection';
import { CertificatesSection } from './components/CertificatesSection';
import { HackathonsSection } from './components/HackathonsSection';
import { WorkshopsSection } from './components/WorkshopsSection';
import { ContactSection } from './components/ContactSection';
import { AdminDashboard } from './components/AdminDashboard';
import { About } from './pages/About';
import { Projects } from './pages/Projects';
import { Skills } from './pages/Skills';
import { Certificates } from './pages/Certificates';
import { Hackathons } from './pages/Hackathons';
import { Workshops } from './pages/Workshops';
import { Contact } from './pages/Contact';
import { Chat } from './pages/Chat';
import { Fun } from './pages/Fun';
import { Login } from './pages/Login';
import './styles/globals.css';
import './App.css';

function ModernPortfolio() {
  return (
    <main className="min-h-screen">
      <Navigation />
      
      <section id="home" className="pt-16">
        <Hero />
      </section>

      <section id="about">
        <AboutSection />
      </section>

      <section id="skills">
        <SkillsSection />
      </section>

      <section id="projects">
        <ProjectsSection />
      </section>

      <section id="certificates">
        <CertificatesSection />
      </section>

      <section id="hackathons">
        <HackathonsSection />
      </section>

      <section id="workshops">
        <WorkshopsSection />
      </section>

      <section id="contact">
        <ContactSection />
      </section>

      {/* Footer */}
      <footer className="border-t border-[color:var(--card-border)] glass-secondary py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-[color:var(--text-secondary)]">
          <p>
            © 2025 Your Name. Built with React, Tailwind, and Framer Motion. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<ModernPortfolio />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/certificates" element={<Certificates />} />
            <Route path="/hackathons" element={<Hackathons />} />
            <Route path="/workshops" element={<Workshops />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/fun" element={<Fun />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

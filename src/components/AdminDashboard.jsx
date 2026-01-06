import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Settings, Home, FileText, Briefcase, Award, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminData, setAdminData] = useState({
    heroTitle: 'Creative Developer & Full-Stack Problem Solver',
    heroSubtitle: 'Building beautiful, scalable web experiences with modern technologies.',
    heroGreeting: '👋 Welcome to my portfolio',
    heroImage: '',
    aboutText: 'I\'m a passionate full-stack developer with a love for creating beautiful, functional web experiences.',
    aboutImage: '',
    email: 'hello@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
  });

  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);

  const [heroId, setHeroId] = useState(null);
  const [aboutId, setAboutId] = useState(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAbout, setUploadingAbout] = useState(false);

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  // Fetch content from backend
  useEffect(() => {
    const fetchContent = async () => {
      if (!isLoggedIn) return;
      
      setContentLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Fetch projects
        const projectsRes = await fetch(`${API_BASE}/content/projects`, { headers });
        if (projectsRes.ok) {
          const data = await projectsRes.json();
          setProjects(data);
        }

        // Fetch skills
        const skillsRes = await fetch(`${API_BASE}/content/skills`, { headers });
        if (skillsRes.ok) {
          const data = await skillsRes.json();
          setSkills(data);
        }

        // Fetch certificates
        const certsRes = await fetch(`${API_BASE}/content/certificates`, { headers });
        if (certsRes.ok) {
          const data = await certsRes.json();
          setCertificates(data);
        }

        // Fetch hero content
        const heroRes = await fetch(`${API_BASE}/content/hero`);
        if (heroRes.ok) {
          const data = await heroRes.json();
          const first = Array.isArray(data) ? data[0] : data;
          if (first?.data) {
            setHeroId(first.id);
            setAdminData((prev) => ({
              ...prev,
              heroTitle: first.data.title || prev.heroTitle,
              heroSubtitle: first.data.subtitle || prev.heroSubtitle,
              heroGreeting: first.data.greeting || prev.heroGreeting,
              heroImage: first.data.image || prev.heroImage,
            }));
          }
        }

        // Fetch about content
        const aboutRes = await fetch(`${API_BASE}/content/about`);
        if (aboutRes.ok) {
          const data = await aboutRes.json();
          const first = Array.isArray(data) ? data[0] : data;
          if (first?.data) {
            setAboutId(first.id);
            setAdminData((prev) => ({
              ...prev,
              aboutText: first.data.description || prev.aboutText,
              aboutImage: first.data.image || prev.aboutImage,
            }));
          }
        }
      } catch (error) {
        // ...existing code...
      } finally {
        setContentLoading(false);
      }
    };

    fetchContent();
  }, [isLoggedIn]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'hero', label: 'Hero Section', icon: Briefcase },
    { id: 'about', label: 'About', icon: FileText },
    { id: 'content', label: 'Content', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleEdit = (field, value) => {
    setEditingField(field);
    setTempValue(value);
  };

  const handleSave = async (field) => {
    const updated = {
      ...adminData,
      [field]: tempValue,
    };
    setAdminData(updated);
    setEditingField(null);

    if (field.startsWith('hero')) {
      await saveHero(updated);
    }

    if (field === 'aboutText' || field === 'aboutImage') {
      await saveAbout(updated);
    }
  };

  const saveHero = async (data) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // ...existing code...
      return;
    }

    const payload = {
      title: data.heroTitle,
      subtitle: data.heroSubtitle,
      greeting: data.heroGreeting || '👋 Welcome to my portfolio',
      image: data.heroImage,
    };

    const url = heroId ? `${API_BASE}/content/hero/${heroId}` : `${API_BASE}/content/hero`;
    const method = heroId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      if (body.id) {
        setHeroId(body.id);
      }
      window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'hero' } }));
    } else {
      // ...existing code...
      alert('Failed to save hero section');
    }
  };

  const saveAbout = async (data) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // ...existing code...
      return;
    }

    const payload = {
      title: 'About Me',
      description: data.aboutText,
      image: data.aboutImage,
    };

    const url = aboutId ? `${API_BASE}/content/about/${aboutId}` : `${API_BASE}/content/about`;
    const method = aboutId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      if (body.id) {
        setAboutId(body.id);
      }
      window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'about' } }));
    } else {
      // ...existing code...
      alert('Failed to save about section');
    }
  };

  const uploadImage = async (file, onUrl, setUploading) => {
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const body = await res.json();
      if (res.ok && body.url) {
        onUrl(body.url);
      } else {
        // ...existing code...
        alert('Image upload failed');
      }
    } catch (err) {
      // ...existing code...
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate('/login?redirect=/admin');
    }
  }, [isLoggedIn, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return null; // avoid redirect flicker while session check is in-flight
  }

  if (!isLoggedIn) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 glass border-r border-white/10 p-6 hidden md:block"
      >
        <h1 className="text-2xl font-bold gradient-text mb-8">Dashboard</h1>

        <nav className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ x: 5 }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'gradient-primary text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </motion.button>
            );
          })}
        </nav>

        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleLogout}
          className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-all"
        >
          <LogOut size={20} />
          Logout
        </motion.button>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Dashboard Overview</h2>

              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Projects', value: projects.length, icon: '📊' },
                  { label: 'Skills Added', value: skills.length, icon: '⚡' },
                  { label: 'Certificates', value: certificates.length, icon: '🏆' },
                  { label: 'Last Update', value: 'Today', icon: '📅' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -5 }}
                    className="glass rounded-xl p-6"
                  >
                    <p className="text-4xl mb-2">{stat.icon}</p>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="glass rounded-xl p-6 mt-6">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('hero')}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all"
                  >
                    <p className="font-semibold">Edit Hero Section</p>
                    <p className="text-sm text-gray-400 mt-1">Update main title and subtitle</p>
                  </button>
                  <button
                    onClick={() => navigate('/projects')}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all"
                  >
                    <p className="font-semibold">Manage Projects</p>
                    <p className="text-sm text-gray-400 mt-1">{projects.length} projects • Add/Edit/Delete</p>
                  </button>
                  <button
                    onClick={() => navigate('/skills')}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all"
                  >
                    <p className="font-semibold">Manage Skills</p>
                    <p className="text-sm text-gray-400 mt-1">{skills.length} skills • Add/Edit/Delete</p>
                  </button>
                  <button
                    onClick={() => navigate('/certificates')}
                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left transition-all"
                  >
                    <p className="font-semibold">Manage Certificates</p>
                    <p className="text-sm text-gray-400 mt-1">{certificates.length} certificates • Add/Edit/Delete</p>
                  </button>
                </div>
              </div>

              <div className="glass rounded-xl p-6 mt-6">
                <h3 className="text-xl font-bold mb-4">Recent Content</h3>
                {/* Upload Resume Option */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2">Upload Resume (PDF)</label>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fileInput = e.target.elements.resumeFile;
                      const file = fileInput.files[0];
                      if (!file) return alert('Please select a PDF file.');
                      if (file.type !== 'application/pdf') return alert('Only PDF files are allowed.');
                      const formData = new FormData();
                      formData.append('resume', file);
                      try {
                        // This assumes you have an endpoint to handle resume upload
                        const token = localStorage.getItem('access_token');
                        const res = await fetch(`${API_BASE}/upload/resume`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` },
                          body: formData,
                        });
                        if (res.ok) {
                          alert('Resume uploaded successfully!');
                        } else {
                          alert('Failed to upload resume.');
                        }
                      } catch (err) {
                        alert('Error uploading resume.');
                      }
                    }}
                  >
                    <input
                      type="file"
                      name="resumeFile"
                      accept="application/pdf"
                      className="block mb-2"
                    />
                    <button type="submit" className="btn-primary">Upload Resume</button>
                  </form>
                  <div className="mt-2">
                    <a href="/resume.pdf" target="_blank" rel="noopener noreferrer" className="btn-secondary mr-2">View Resume</a>
                    <a href="/resume.pdf" download className="btn-secondary">Download Resume</a>
                  </div>
                </div>
                {contentLoading ? (
                  <p className="text-gray-400">Loading content...</p>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 3).map((project) => (
                      <div key={project._id} className="p-3 bg-white/5 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{project.title}</p>
                          <p className="text-sm text-gray-400">{project.technologies?.slice(0, 2).join(', ')}</p>
                        </div>
                        <span className="text-xs text-purple-400">Project</span>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-gray-400 text-center py-4">No projects yet. Add some from the Projects page!</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Hero Section</h2>

              <div className="glass rounded-xl p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Greeting</label>
                  <input
                    type="text"
                    value={adminData.heroGreeting}
                    onChange={(e) => setAdminData({ ...adminData, heroGreeting: e.target.value })}
                    onBlur={(e) => saveHero({ ...adminData, heroGreeting: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Main Title</label>
                  {editingField === 'heroTitle' ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSave('heroTitle')}
                        className="btn-primary text-sm"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEdit('heroTitle', adminData.heroTitle)}
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white cursor-pointer hover:border-purple-600 transition-colors"
                    >
                      {adminData.heroTitle}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Subtitle</label>
                  {editingField === 'heroSubtitle' ? (
                    <div className="flex gap-2">
                      <textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white resize-none"
                        rows="3"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSave('heroSubtitle')}
                        className="btn-primary text-sm"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEdit('heroSubtitle', adminData.heroSubtitle)}
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white cursor-pointer hover:border-purple-600 transition-colors"
                    >
                      {adminData.heroSubtitle}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Hero Image</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={adminData.heroImage}
                      onChange={(e) => setAdminData({ ...adminData, heroImage: e.target.value })}
                      onBlur={(e) => saveHero({ ...adminData, heroImage: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                      placeholder="https://..."
                    />
                    <label className="px-4 py-2 bg-white/10 rounded-lg cursor-pointer text-sm">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => uploadImage(e.target.files?.[0], (url) => {
                          setAdminData((prev) => ({ ...prev, heroImage: url }));
                          saveHero({ ...adminData, heroImage: url });
                        }, setUploadingHero)}
                        disabled={uploadingHero}
                      />
                      {uploadingHero ? 'Uploading...' : 'Upload'}
                    </label>
                  </div>
                  {adminData.heroImage && (
                    <div className="mt-3 w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                      <img src={adminData.heroImage} alt="Hero" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">About Section</h2>

              <div className="glass rounded-xl p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">About Text</label>
                  {editingField === 'aboutText' ? (
                    <div className="flex gap-2">
                      <textarea
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white resize-none"
                        rows="6"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSave('aboutText')}
                        className="btn-primary text-sm h-fit"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleEdit('aboutText', adminData.aboutText)}
                      className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white cursor-pointer hover:border-purple-600 transition-colors whitespace-pre-wrap"
                    >
                      {adminData.aboutText}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">About Image</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={adminData.aboutImage}
                      onChange={(e) => setAdminData({ ...adminData, aboutImage: e.target.value })}
                      onBlur={(e) => saveAbout({ ...adminData, aboutImage: e.target.value })}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                      placeholder="https://..."
                    />
                    <label className="px-4 py-2 bg-white/10 rounded-lg cursor-pointer text-sm">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => uploadImage(e.target.files?.[0], (url) => {
                          setAdminData((prev) => ({ ...prev, aboutImage: url }));
                          saveAbout({ ...adminData, aboutImage: url });
                        }, setUploadingAbout)}
                        disabled={uploadingAbout}
                      />
                      {uploadingAbout ? 'Uploading...' : 'Upload'}
                    </label>
                  </div>
                  {adminData.aboutImage && (
                    <div className="mt-3 w-32 h-32 rounded-lg overflow-hidden border border-white/10">
                      <img src={adminData.aboutImage} alt="About" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Contact Information</h2>

              <div className="glass rounded-xl p-8 space-y-6">
                {[
                  { key: 'email', label: 'Email Address' },
                  { key: 'phone', label: 'Phone Number' },
                  { key: 'location', label: 'Location' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-semibold mb-2">{field.label}</label>
                    {editingField === field.key ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(field.key)}
                          className="btn-primary text-sm"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => handleEdit(field.key, adminData[field.key])}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white cursor-pointer hover:border-purple-600 transition-colors"
                      >
                        {adminData[field.key]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Settings</h2>

              <div className="glass rounded-xl p-8 space-y-4">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <span>Dark Mode</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="text-sm text-gray-400">Enabled</span>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <span>Email Notifications</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="text-sm text-gray-400">Enabled</span>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <span>Analytics Tracking</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="text-sm text-gray-400">Enabled</span>
                  </label>
                </div>

                <button className="w-full btn-primary mt-6">Save Settings</button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

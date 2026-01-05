import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/Content.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

export const About = () => {
  const [about, setAbout] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    details: '',
    image: '',
    highlights: ['', '', '', ''],
    sectionIcon: '💻',
    sectionLabel: 'About Me',
    mainTitle: 'Creative and MERN-Stack Developer & Problem Solver',
    subtitle: 'DSA • AI/ML • Open Source Contributor'
  });
  const [uploading, setUploading] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const response = await fetch(`${API_BASE}/content/about`);
      const data = await response.json();
      // Handle both array and single object responses
      const first = Array.isArray(data) ? data[0] : data;
      setAbout(first);
    } catch (error) {
      console.error('Failed to fetch about:', error);
    }
  };

  const handleEdit = () => {
    setForm({
      title: about?.data?.title || '',
      description: about?.data?.description || '',
      details: about?.data?.details || '',
      image: about?.data?.image || '',
      highlights: about?.data?.highlights || ['', '', '', ''],
      sectionIcon: about?.data?.sectionIcon || '💻',
      sectionLabel: about?.data?.sectionLabel || 'About Me',
      mainTitle: about?.data?.mainTitle || 'Creative and MERN-Stack Developer & Problem Solver',
      subtitle: about?.data?.subtitle || 'DSA • AI/ML • Open Source Contributor'
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const hasExisting = Boolean(about?.id);
      const url = hasExisting
        ? `${API_BASE}/content/about/${about.id}`
        : `${API_BASE}/content/about`;
      const method = hasExisting ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      if (response.ok) {
        await fetchAbout();
        setIsEditing(false);
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'about' } }));
      } else {
        console.error('Failed to save about section:', await response.text());
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.url) {
        setForm({ ...form, image: data.url });
      } else {
        console.error('Image upload failed:', data.detail || data.message || 'Unknown error');
        alert('Failed to upload image.');
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="content-page">
      <Header />
      <div className="container">
        {!isEditing && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }} aria-hidden>
                {about?.data?.sectionIcon || '💻'}
              </span>
              <span style={{ fontSize: 22, color: '#cbd5e1' }}>
                {about?.data?.sectionLabel || 'About Me'}
              </span>
            </div>
            <h1
              style={{
                margin: '0 auto',
                maxWidth: 720,
                fontSize: '26px',
                lineHeight: 1.2,
                fontWeight: 650,
                color: '#e2e8f0'
              }}
            >
              {about?.data?.mainTitle || 'Creative and MERN-Stack Developer & Problem Solver'}
            </h1>
            <p
              style={{
                margin: '6px auto 0',
                maxWidth: 720,
                fontSize: '16px',
                lineHeight: 1.5,
                fontWeight: 500,
                color: '#94a3b8'
              }}
            >
              {about?.data?.subtitle || 'DSA • AI/ML • Open Source Contributor'}
            </p>
          </div>
        )}

        {isLoggedIn && !isEditing && (
          <button onClick={handleEdit} className="edit-btn">
            ✏️ Edit
          </button>
        )}

        {isEditing ? (
          <div className="form-container">
            <div className="form-card">
              <h2>Edit About Me</h2>
              
              <div className="form-group">
                <label htmlFor="sectionIcon">Section Icon/Emoji</label>
                <input
                  id="sectionIcon"
                  type="text"
                  placeholder="💻"
                  value={form.sectionIcon}
                  onChange={(e) => setForm({ ...form, sectionIcon: e.target.value })}
                  className="form-input"
                  maxLength="2"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sectionLabel">Section Label</label>
                <input
                  id="sectionLabel"
                  type="text"
                  placeholder="About Me"
                  value={form.sectionLabel}
                  onChange={(e) => setForm({ ...form, sectionLabel: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="mainTitle">Main Title</label>
                <input
                  id="mainTitle"
                  type="text"
                  placeholder="Full Stack Developer"
                  value={form.mainTitle}
                  onChange={(e) => setForm({ ...form, mainTitle: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subtitle">Subtitle</label>
                <input
                  id="subtitle"
                  type="text"
                  placeholder="DSA • AI/ML • Open Source Contributor"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g., Software Developer & Tech Enthusiast"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Intro (short)</label>
                <textarea
                  id="description"
                  placeholder="2-3 lines about you"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-textarea"
                  rows="8"
                />
              </div>

              <div className="form-group">
                <label htmlFor="details">Details (next paragraph)</label>
                <textarea
                  id="details"
                  placeholder="Add a bit more context on what you focus on"
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  className="form-textarea"
                  rows="6"
                />
              </div>
              <div className="form-group">
                <label>Bullet Points (4)</label>
                {form.highlights.map((item, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={item}
                    placeholder={`Point ${idx + 1}`}
                    onChange={(e) => {
                      const next = [...form.highlights];
                      next[idx] = e.target.value;
                      setForm({ ...form, highlights: next });
                    }}
                    className="form-input"
                    style={{ marginBottom: 8 }}
                  />
                ))}
              </div>

              <div className="form-group">
                <label htmlFor="image">Profile Image</label>
                <input
                  id="image"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="form-input"
                />
                <div className="upload-row">
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
                  </label>
                  {form.image && <span className="url-hint">Using uploaded URL</span>}
                </div>
                {form.image && (
                  <div className="image-preview">
                    <img src={form.image} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button onClick={() => setIsEditing(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '28px',
              boxShadow: '0 18px 40px rgba(0,0,0,0.25)'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '28px',
                alignItems: 'start'
              }}
            >
              <div style={{ maxWidth: 420, margin: '0 auto', width: '100%', paddingTop: 0 }}>
                <div
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    background: 'rgba(255,255,255,0.02)'
                  }}
                >
                  <img
                    src={about?.data?.image || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1200&q=80'}
                    alt={about?.data?.title || 'Profile'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </div>

              <div style={{ maxWidth: 620, width: '100%', margin: '0 auto', textAlign: 'left', paddingTop: 0 }}>
                <div style={{ height: 4, width: 48, background: 'linear-gradient(90deg,#7c3aed,#38bdf8)', borderRadius: 9999, marginBottom: 18 }} />
                <p
                  style={{
                    margin: 0,
                    fontSize: 17,
                    lineHeight: 1.7,
                    color: '#cbd5e1',
                    maxWidth: '58ch'
                  }}
                >
                  {about?.data?.description ||
                    'I am a 2nd-year B.Tech CSE (AI & ML) student focused on building reliable products with solid fundamentals in DSA and full-stack development.'}
                </p>

                {about?.data?.details && (
                  <p
                    style={{
                      margin: '14px 0 0',
                      fontSize: 16,
                      lineHeight: 1.7,
                      color: '#94a3b8',
                      maxWidth: '60ch'
                    }}
                  >
                    {about.data.details}
                  </p>
                )}

                <div style={{ marginTop: 16 }}>
                  <ul style={{ listStyle: 'disc', paddingLeft: 20, margin: 0, color: '#94a3b8', lineHeight: 1.8, maxWidth: '62ch', rowGap: 10, display: 'grid' }}>
                    {(about?.data?.highlights || ['2nd-year B.Tech CSE (AI & ML)', 'DSA & Problem Solving', 'Full Stack Focus', 'Internships & OSS']).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ margin: '20px 0', height: 1, background: 'rgba(255,255,255,0.08)' }} />

                <div>
                  <h3 style={{ margin: '0 0 10px', color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>Quick Highlights</h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 10,
                      maxWidth: 520
                    }}
                  >
                  {(about?.data?.highlights || ['2nd-year B.Tech CSE (AI & ML)', 'DSA & Problem Solving', 'Full Stack Focus', 'Internships & OSS']).map((item) => (
                      <div
                        key={item}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.02)',
                          color: '#cbd5e1',
                          fontSize: 14,
                          fontWeight: 600
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

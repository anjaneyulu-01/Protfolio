import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/Content.css';

export const About = () => {
  const [about, setAbout] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', image: '' });
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/about');
      const data = await response.json();
      // Handle both array and single object responses
      setAbout(Array.isArray(data) ? data[0] : data);
    } catch (error) {
      console.error('Failed to fetch about:', error);
    }
  };

  const handleEdit = () => {
    setForm({
      title: about?.title || '',
      description: about?.description || '',
      image: about?.image || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });
      if (response.ok) {
        await fetchAbout();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  return (
    <div className="content-page">
      <Header />
      <div className="container">
        <div className="content-header">
          <h1>😊 About Me</h1>
          <p>Get to know who I am, my journey, and what drives me</p>
        </div>

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
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  placeholder="Tell us about yourself, your passion, goals, and journey..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-textarea"
                  rows="8"
                />
              </div>

              <div className="form-group">
                <label htmlFor="image">Profile Image URL</label>
                <input
                  id="image"
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="form-input"
                />
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
          <div className="content-card">
            {about?.data?.icon && (
              <div className="content-icon">{about.data.icon}</div>
            )}
            <h2>{about?.data?.title || 'About Me'}</h2>
            <p>{about?.data?.content || 'Loading...'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

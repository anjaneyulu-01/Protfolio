import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/Content.css';

export const Hackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', achievement: '', link: '', image: '' });
  const [uploading, setUploading] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/hackathons');
      const data = await response.json();
      setHackathons(data || []);
    } catch (error) {
      console.error('Failed to fetch hackathons:', error);
    }
  };

  const handleAdd = () => {
    setForm({ title: '', description: '', date: '', achievement: '', link: '', image: '' });
    setEditingHackathon(null);
    setShowModal(true);
  };

  const handleEdit = (hackathon) => {
    setForm(hackathon.data);
    setEditingHackathon(hackathon);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editingHackathon 
        ? `http://127.0.0.1:8005/content/hackathons/${editingHackathon.id}`
        : 'http://127.0.0.1:8005/content/hackathons';
      
      const response = await fetch(url, {
        method: editingHackathon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (response.ok) {
        await fetchHackathons();
        setShowModal(false);
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'hackathons' } }));
      }
    } catch (error) {
      console.error('Failed to save hackathon:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this hackathon?')) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8005/content/hackathons/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        await fetchHackathons();
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'hackathons' } }));
      }
    } catch (error) {
      console.error('Failed to delete hackathon:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://127.0.0.1:8005/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setForm({ ...form, image: data.url });
        alert('Image uploaded successfully!');
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="content-page">
      <Header />
      <div className="container">
        <div className="content-header">
          <h1>🏁 Hackathons</h1>
          <p>My competitive coding and innovation experiences</p>
        </div>

        {isLoggedIn && (
          <button onClick={handleAdd} className="add-btn">
            ➕ Add Hackathon
          </button>
        )}

        <div className="content-grid">
          {hackathons.map((hackathon) => (
            <div key={hackathon.id} className="content-card">
              {hackathon.data.image && (
                <img src={hackathon.data.image} alt={hackathon.data.title} className="card-image" />
              )}
              <h3>{hackathon.data.title}</h3>
              {hackathon.data.role && <p className="cert-issuer">{hackathon.data.role}</p>}
              {hackathon.data.description && <p>{hackathon.data.description}</p>}
              {hackathon.data.achievement && (
                <div className="achievement-badge">🏆 {hackathon.data.achievement}</div>
              )}
              {hackathon.data.date && <p className="cert-date">{hackathon.data.date}</p>}
              {hackathon.data.link && (
                <a href={hackathon.data.link} target="_blank" rel="noopener noreferrer" className="project-link">
                  View Details →
                </a>
              )}
              {isLoggedIn && (
                <div className="card-actions">
                  <button onClick={() => handleEdit(hackathon)} className="btn-edit">✏️</button>
                  <button onClick={() => handleDelete(hackathon.id)} className="btn-delete">🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal" onClick={(e) => e.target.className === 'modal' && setShowModal(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingHackathon ? 'Edit Hackathon' : 'Add New Hackathon'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="title">Hackathon Title *</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g., HackTech 2025"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    placeholder="Describe what you built and your experience..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="form-textarea"
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input
                      id="date"
                      type="text"
                      placeholder="e.g., Jan 2025"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="achievement">Achievement</label>
                    <input
                      id="achievement"
                      type="text"
                      placeholder="e.g., 1st Place"
                      value={form.achievement}
                      onChange={(e) => setForm({ ...form, achievement: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="link">Project Link (optional)</label>
                  <input
                    id="link"
                    type="text"
                    placeholder="https://github.com/yourrepo"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Hackathon Image</label>
                  <div className="image-upload-section">
                    <div className="image-upload-group">
                      <label className="upload-label">Upload Image</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file-input"
                        disabled={uploading}
                      />
                      {uploading && <p className="upload-status">⏳ Uploading image...</p>}
                    </div>
                    
                    <div className="image-divider">or</div>
                    
                    <div className="image-url-group">
                      <label htmlFor="imageUrl">Paste Image URL</label>
                      <input
                        id="imageUrl"
                        type="text"
                        placeholder="https://example.com/image.jpg"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {form.image && (
                    <div className="image-preview-section">
                      <img src={form.image} alt="Preview" className="image-preview" />
                      <button 
                        onClick={() => setForm({ ...form, image: '' })} 
                        className="btn-remove-image"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary">
                  {editingHackathon ? 'Update' : 'Add'} Hackathon
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

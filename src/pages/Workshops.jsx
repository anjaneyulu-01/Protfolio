import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/Content.css';

export const Workshops = () => {
  const [workshops, setWorkshops] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', location: '', link: '', image: '' });
  const [uploading, setUploading] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/workshops');
      const result = await response.json();
      const data = result.data || result;
      setWorkshops(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch workshops:', error);
      setWorkshops([]);
    }
  };

  const handleAdd = () => {
    setForm({ title: '', description: '', date: '', location: '', link: '', image: '' });
    setEditingWorkshop(null);
    setShowModal(true);
  };

  const handleEdit = (workshop) => {
    setForm({
      title: workshop.data.title || '',
      description: workshop.data.description || '',
      date: workshop.data.date || '',
      location: workshop.data.location || '',
      link: workshop.data.link || '',
      image: workshop.data.image || ''
    });
    setEditingWorkshop(workshop);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      alert('Workshop title is required');
      return;
    }
    
    try {
      const url = editingWorkshop 
        ? `http://127.0.0.1:8005/content/workshops/${editingWorkshop.id}`
        : 'http://127.0.0.1:8005/content/workshops';
      
      // Map form fields to API expected fields
      const payload = {
        title: form.title,
        description: form.description,
        date: form.date,
        location: form.location,
        link: form.link,
        image: form.image
      };
      
      // Get token from localStorage as fallback
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };
      
      const response = await fetch(url, {
        method: editingWorkshop ? 'PUT' : 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchWorkshops();
        setShowModal(false);
        alert('Workshop saved successfully!');
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'workshops' } }));
      } else {
        alert('Failed to save workshop: ' + (data.message || 'Unknown error'));
        console.error('Save error:', data);
      }
    } catch (error) {
      console.error('Failed to save workshop:', error);
      alert('Failed to save workshop: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workshop?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      const response = await fetch(`http://127.0.0.1:8005/content/workshops/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });
      
      if (response.ok) {
        await fetchWorkshops();
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'workshops' } }));
      }
    } catch (error) {
      console.error('Failed to delete workshop:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Uploading image:', file.name);
      
      // Get token from localStorage as fallback
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      const response = await fetch('http://127.0.0.1:8005/upload-image', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        console.log('✅ Image uploaded:', data.url);
        setForm({ ...form, image: data.url });
        alert('Image uploaded successfully!');
      } else {
        const errorMsg = data.detail || data.message || 'Unknown error';
        console.error('❌ Upload failed:', errorMsg);
        alert('Failed to upload image: ' + errorMsg);
      }
    } catch (error) {
      console.error('❌ Failed to upload image:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="content-page">
      <Header />
      <div className="container">
        <div className="content-header">
          <h1>📚 Workshops & Events</h1>
          <p>Learning opportunities and community events attended</p>
        </div>

        {isLoggedIn && (
          <button onClick={handleAdd} className="add-btn">
            ➕ Add Workshop
          </button>
        )}

        <div className="content-grid">
          {workshops.map((workshop) => (
            <div key={workshop.id} className="content-card">
              {workshop.data.image && workshop.data.image.startsWith('http') ? (
                <img src={workshop.data.image} alt={workshop.data.title} className="card-image" />
              ) : workshop.data.image ? (
                <div className="card-icon">{workshop.data.image}</div>
              ) : null}
              <h3>{workshop.data.title}</h3>
              {workshop.data.description && <p className="workshop-description">{workshop.data.description}</p>}
              {workshop.data.date && <p className="workshop-date">📅 {workshop.data.date}</p>}
              {workshop.data.location && <p className="workshop-location">📍 {workshop.data.location}</p>}
              {workshop.data.link && (
                <a href={workshop.data.link} target="_blank" rel="noopener noreferrer" className="project-link">
                  View Details →
                </a>
              )}
              {isLoggedIn && (
                <div className="card-actions">
                  <button onClick={() => handleEdit(workshop)} className="btn-edit">✏️</button>
                  <button onClick={() => handleDelete(workshop.id)} className="btn-delete">🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal" onClick={(e) => e.target.className === 'modal' && setShowModal(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingWorkshop ? 'Edit Workshop' : 'Add New Workshop'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="title">Workshop Title *</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g., React Advanced Patterns"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    placeholder="Brief description of the workshop"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="form-input"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    id="date"
                    type="text"
                    placeholder="e.g., January 2025"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    placeholder="e.g., Online / City Name"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="link">Workshop Link</label>
                  <input
                    id="link"
                    type="text"
                    placeholder="https://example.com/workshop"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Workshop Image</label>
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
                  {editingWorkshop ? 'Update' : 'Add'} Workshop
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

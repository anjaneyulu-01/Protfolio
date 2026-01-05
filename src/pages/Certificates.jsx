import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/Content.css';

export const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCert, setEditingCert] = useState(null);
  const [form, setForm] = useState({ title: '', issuer: '', date: '', link: '', image: '' });
  const [uploading, setUploading] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/certificates');
      const result = await response.json();
      // Handle both direct array response and wrapped response
      const data = result.data || result;
      setCertificates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      setCertificates([]);
    }
  };

  const handleAdd = () => {
    setForm({ title: '', issuer: '', date: '', link: '', image: '' });
    setEditingCert(null);
    setShowModal(true);
  };

  const handleEdit = (cert) => {
    // Map API fields to form fields
    setForm({
      title: cert.data.title || '',
      issuer: cert.data.issuer || '',
      date: cert.data.issueDate ? new Date(cert.data.issueDate).toISOString().split('T')[0] : cert.data.date || '',
      link: cert.data.credentialUrl || cert.data.link || '',
      image: cert.data.image || ''
    });
    setEditingCert(cert);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      alert('Certificate title is required');
      return;
    }
    
    try {
      const url = editingCert 
        ? `http://127.0.0.1:8005/content/certificates/${editingCert.id}`
        : 'http://127.0.0.1:8005/content/certificates';
      
      // Map form fields to API expected fields
      const payload = {
        title: form.title,
        issuer: form.issuer,
        issueDate: form.date || new Date().toISOString().split('T')[0],
        credentialUrl: form.link,
        image: form.image
      };
      
      // Get token from localStorage as fallback
      const token = localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      };
      
      const response = await fetch(url, {
        method: editingCert ? 'PUT' : 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchCertificates();
        setShowModal(false);
        alert('Certificate saved successfully!');
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'certificates' } }));
      } else {
        alert('Failed to save certificate: ' + (data.message || 'Unknown error'));
        console.error('Save error:', data);
      }
    } catch (error) {
      console.error('Failed to save certificate:', error);
      alert('Failed to save certificate: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this certificate?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      
      const response = await fetch(`http://127.0.0.1:8005/content/certificates/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });
      
      if (response.ok) {
        await fetchCertificates();
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'certificates' } }));
      }
    } catch (error) {
      console.error('Failed to delete certificate:', error);
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
          <h1>🏆 Certificates & Achievements</h1>
          <p>Recognitions and certifications earned along my journey</p>
        </div>

        {isLoggedIn && (
          <button onClick={handleAdd} className="add-btn">
            ➕ Add Certificate
          </button>
        )}

        <div className="content-grid">
          {certificates.map((cert) => (
            <div key={cert.id} className="content-card">
              {cert.data.icon && (
                <div className="content-icon">{cert.data.icon}</div>
              )}
              {cert.data.image && (
                <img src={cert.data.image} alt={cert.data.title} className="card-image" />
              )}
              <h3>{cert.data.title}</h3>
              <p className="cert-issuer">{cert.data.issuer}</p>
              {cert.data.date && <p className="cert-date">{cert.data.date}</p>}
              {cert.data.link && (
                <a href={cert.data.link} target="_blank" rel="noopener noreferrer" className="project-link">
                  View Certificate →
                </a>
              )}
              {isLoggedIn && (
                <div className="card-actions">
                  <button onClick={() => handleEdit(cert)} className="btn-edit">✏️</button>
                  <button onClick={() => handleDelete(cert.id)} className="btn-delete">🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal" onClick={(e) => e.target.className === 'modal' && setShowModal(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingCert ? 'Edit Certificate' : 'Add New Certificate'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="title">Certificate Title *</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g., AWS Solutions Architect"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="issuer">Issuer</label>
                  <input
                    id="issuer"
                    type="text"
                    placeholder="e.g., Coursera, AWS, Google"
                    value={form.issuer}
                    onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date Issued</label>
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
                  <label htmlFor="link">Certificate Link</label>
                  <input
                    id="link"
                    type="text"
                    placeholder="https://example.com/certificate"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Certificate Image</label>
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
                  {editingCert ? 'Update' : 'Add'} Certificate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config/apiBase';
import '../styles/Content.css';

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', tech: '', category: 'fullstack', liveLink: '', githubLink: '', image: '' });
  const [uploading, setUploading] = useState(false);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/content/projects`);
      const data = await response.json();
      const normalized = (data || []).map((item) => ({
        id: item.id || item._id,
        data: item.data || item,
        ...item.data,
      }));
      setProjects(normalized);
    } catch (error) {
      // ...existing code...
    }
  };

  const handleAdd = () => {
    setForm({ title: '', description: '', tech: '', category: 'fullstack', liveLink: '', githubLink: '', image: '' });
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEdit = (project) => {
    setForm({
      title: project.data.title || '',
      description: project.data.desc || project.data.description || '',
      tech: Array.isArray(project.data.tech) ? project.data.tech.join(', ') : project.data.tech || '',
      category: (project.data.category || 'fullstack').toString().toLowerCase().replace(/\s+/g, ''),
      liveLink: project.data.liveLink || project.data.link || '',
      githubLink: project.data.githubLink || '',
      image: project.data.image || ''
    });
    setEditingProject(project);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const url = editingProject 
        ? `${API_BASE}/content/projects/${editingProject.id}`
        : `${API_BASE}/content/projects`;
      
      const response = await fetch(url, {
        method: editingProject ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          category: form.category || 'Full Stack',
          // keep compatibility: store link as liveLink fallback
          link: form.liveLink || '',
        })
      });

      if (response.ok) {
        await fetchProjects();
        setShowModal(false);
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'projects' } }));
      }
    } catch (error) {
      // ...existing code...
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setForm({ ...form, image: data.url });
        alert('Image uploaded successfully!');
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Failed to upload image${err.detail ? `: ${err.detail}` : ''}`);
      }
    } catch (error) {
      // ...existing code...
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/content/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (response.ok) {
        await fetchProjects();
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'projects' } }));
      }
    } catch (error) {
      // ...existing code...
    }
  };

  return (
    <div className="content-page">
      <Header />
      <div className="container">
        <div className="content-header">
          <h1>💼 My Projects</h1>
          <p>Showcasing my work and technical achievements</p>
        </div>

        {isLoggedIn && (
          <button onClick={handleAdd} className="add-btn">
            ➕ Add Project
          </button>
        )}

        <div className="content-grid">
          {projects.map((project) => (
            <div key={project.id} className="content-card">
              {(project.data.image || project.image) && (
                <img src={project.data.image || project.image} alt={project.data.title} className="card-image" />
              )}
              <h3>{project.data.title}</h3>
              <p>{project.data.desc || project.data.description || 'No description'}</p>
              {project.data.tech && (
                <div className="tech-stack">
                  {Array.isArray(project.data.tech) ? project.data.tech.join(', ') : project.data.tech}
                </div>
              )}
              {(project.data.liveLink || project.data.link) && (
                <a
                  href={project.data.liveLink || project.data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link"
                >
                  Live Demo →
                </a>
              )}
              {project.data.githubLink && (
                <a
                  href={project.data.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link"
                >
                  GitHub Repo →
                </a>
              )}
              {isLoggedIn && (
                <div className="card-actions">
                  <button onClick={() => handleEdit(project)} className="btn-edit">✏️</button>
                  <button onClick={() => handleDelete(project.id)} className="btn-delete">🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal" onClick={(e) => e.target.className === 'modal' && setShowModal(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="title">Project Title *</label>
                  <input
                    id="title"
                    type="text"
                    placeholder="e.g., AI Portfolio Platform"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    placeholder="Describe your project, features, and your role..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="form-textarea"
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tech">Tech Stack</label>
                  <input
                    id="tech"
                    type="text"
                    placeholder="e.g., React, Node.js, MongoDB"
                    value={form.tech}
                    onChange={(e) => setForm({ ...form, tech: e.target.value })}
                    className="form-input"
                  />
                </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="form-input"
                    >
                      <option value="fullstack">Full Stack</option>
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                    </select>
                  </div>

                <div className="form-group">
                  <label htmlFor="liveLink">Live Link (optional)</label>
                  <input
                    id="liveLink"
                    type="text"
                    placeholder="https://yoursite.com"
                    value={form.liveLink}
                    onChange={(e) => setForm({ ...form, liveLink: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="githubLink">Git Repository</label>
                  <input
                    id="githubLink"
                    type="text"
                    placeholder="https://github.com/yourrepo"
                    value={form.githubLink}
                    onChange={(e) => setForm({ ...form, githubLink: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Project Image</label>
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
                  {editingProject ? 'Update' : 'Add'} Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

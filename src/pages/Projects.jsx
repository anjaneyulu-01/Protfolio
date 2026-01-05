import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/Content.css';

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', tech: '', link: '', image: '' });
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/projects');
      const data = await response.json();
      setProjects(data || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleAdd = () => {
    setForm({ title: '', description: '', tech: '', link: '', image: '' });
    setEditingProject(null);
    setShowModal(true);
  };

  const handleEdit = (project) => {
    setForm({
      title: project.data.title || '',
      description: project.data.desc || project.data.description || '',
      tech: Array.isArray(project.data.tech) ? project.data.tech.join(', ') : project.data.tech || '',
      link: project.data.link || '',
      image: project.data.image || ''
    });
    setEditingProject(project);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editingProject 
        ? `http://127.0.0.1:8005/content/projects/${editingProject.id}`
        : 'http://127.0.0.1:8005/content/projects';
      
      const response = await fetch(url, {
        method: editingProject ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (response.ok) {
        await fetchProjects();
        setShowModal(false);
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'projects' } }));
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8005/content/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        await fetchProjects();
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'projects' } }));
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
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
              {project.data.image && (
                <img src={project.data.image} alt={project.data.title} className="card-image" />
              )}
              <h3>{project.data.title}</h3>
              <p>{project.data.desc || project.data.description || 'No description'}</p>
              {project.data.tech && (
                <div className="tech-stack">
                  {Array.isArray(project.data.tech) ? project.data.tech.join(', ') : project.data.tech}
                </div>
              )}
              {project.data.link && project.data.link !== '#' && (
                <a href={project.data.link} target="_blank" rel="noopener noreferrer" className="project-link">
                  View Project →
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
                  <label htmlFor="link">Project Link</label>
                  <input
                    id="link"
                    type="text"
                    placeholder="https://github.com/yourrepo or https://yoursite.com"
                    value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="image">Project Image</label>
                  <input
                    id="image"
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="form-input"
                  />
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

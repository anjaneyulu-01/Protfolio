import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/Content.css';

export const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form, setForm] = useState({ name: '', level: '', icon: '' });
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/skills');
      const data = await response.json();
      setSkills(data || []);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    }
  };

  const handleAdd = () => {
    setForm({ name: '', level: '', icon: '' });
    setEditingSkill(null);
    setShowModal(true);
  };

  const handleEdit = (skill) => {
    setForm(skill.data);
    setEditingSkill(skill);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const url = editingSkill 
        ? `http://127.0.0.1:8005/content/skills/${editingSkill.id}`
        : 'http://127.0.0.1:8005/content/skills';
      
      const response = await fetch(url, {
        method: editingSkill ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (response.ok) {
        await fetchSkills();
        setShowModal(false);
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'skills' } }));
      }
    } catch (error) {
      console.error('Failed to save skill:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this skill?')) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8005/content/skills/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        await fetchSkills();
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'skills' } }));
      }
    } catch (error) {
      console.error('Failed to delete skill:', error);
    }
  };

  return (
    <div className="content-page">
      <Header />
      <div className="container">
        <div className="content-header">
          <h1>🧠 My Skills</h1>
          <p>Technologies and tools I work with</p>
        </div>

        {isLoggedIn && (
          <button onClick={handleAdd} className="add-btn">
            ➕ Add Skill
          </button>
        )}

        <div className="skills-grid">
          {skills.map((skill) => (
            <div key={skill.id} className="skill-card">
              <div className="skill-icon">{skill.data.icon || '💻'}</div>
              <h3>{skill.data.category || skill.data.name}</h3>
              {skill.data.items && Array.isArray(skill.data.items) ? (
                <ul className="skill-items">
                  {skill.data.items.map((item, idx) => (
                    <li key={idx}>{item.name} <span className="skill-level">{item.level}</span></li>
                  ))}
                </ul>
              ) : (
                <div className="skill-level">{skill.data.level || 'Expert'}</div>
              )}
              {isLoggedIn && (
                <div className="card-actions">
                  <button onClick={() => handleEdit(skill)} className="btn-edit">✏️</button>
                  <button onClick={() => handleDelete(skill.id)} className="btn-delete">🗑️</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal" onClick={(e) => e.target.className === 'modal' && setShowModal(false)}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="name">Skill Name *</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g., JavaScript, Python, React"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="level">Proficiency Level</label>
                  <input
                    id="level"
                    type="text"
                    placeholder="e.g., Expert, Intermediate, Beginner"
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="icon">Icon (emoji)</label>
                  <input
                    id="icon"
                    type="text"
                    placeholder="e.g., 💻 🐍 ⚛️"
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-primary">
                  {editingSkill ? 'Update' : 'Add'} Skill
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

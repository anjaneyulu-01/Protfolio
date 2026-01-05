import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/Content.css';

export const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', proficiency: 50, icon: '' });
  const { isLoggedIn } = useAuth();

  const desiredOrder = [
    'languages',
    'programming languages',
    'language',
    'frontend',
    'front end',
    'backend',
    'back end',
    'ai/ml',
    'ai',
    'ml',
    'version control',
    'tools & platforms',
    'tools and platforms'
  ];

  const rankCategory = (name = '') => {
    const lower = name.toLowerCase();
    const idx = desiredOrder.findIndex((entry) => lower.includes(entry));
    return idx === -1 ? desiredOrder.length + 1 : idx;
  };

  const buildGroupedSkills = (list) => {
    const grouped = {};
    list.forEach((skill) => {
      const category = skill.category || skill.data?.category || 'Other';
      const icon = skill.icon || skill.data?.icon || '💻';
      if (!grouped[category]) {
        grouped[category] = { category, icon, items: [] };
      }
      grouped[category].items.push(skill);
    });

    return Object.values(grouped).sort((a, b) => {
      const ra = rankCategory(a.category);
      const rb = rankCategory(b.category);
      if (ra !== rb) return ra - rb;
      return a.category.localeCompare(b.category);
    });
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/content/skills');
      const data = await response.json();
      const normalized = (data || []).map((item) => ({
        id: item.id || item._id,
        data: item.data || item,
        ...item.data,
      }));
      // Sort by creation date - oldest first
      normalized.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.data?.createdAt || 0);
        const dateB = new Date(b.createdAt || b.data?.createdAt || 0);
        return dateA - dateB;
      });
      setSkills(normalized);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    }
  };

  const handleAdd = () => {
    setForm({ name: '', category: '', proficiency: 50, icon: '' });
    setEditingSkill(null);
    setShowModal(true);
  };

  const handleEdit = (skill) => {
    setForm({
      name: skill.name,
      category: skill.category,
      proficiency: skill.proficiency,
      icon: skill.icon || ''
    });
    setEditingSkill(skill);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category) {
      alert('Skill name and category are required');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const url = editingSkill 
        ? `http://127.0.0.1:8005/content/skills/${editingSkill.id}`
        : 'http://127.0.0.1:8005/content/skills';
      
      const response = await fetch(url, {
        method: editingSkill ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      const data = await response.json();
      
      if (response.ok) {
        await fetchSkills();
        setShowModal(false);
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'skills' } }));
      } else {
        alert(`Error: ${data.message || 'Failed to save skill'}`);
      }
    } catch (error) {
      console.error('Failed to save skill:', error);
      alert('Error saving skill: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this skill?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8005/content/skills/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (response.ok) {
        await fetchSkills();
        // Notify other components that content has changed
        window.dispatchEvent(new CustomEvent('content-updated', { detail: { type: 'skills' } }));
      } else {
        alert('Failed to delete skill');
      }
    } catch (error) {
      console.error('Failed to delete skill:', error);
      alert('Error deleting skill');
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
          {buildGroupedSkills(skills).map((group) => (
            <div key={group.category} className="skill-card">
              <div className="skill-icon">{group.icon}</div>
              <h3>{group.category}</h3>
              <div className="skill-category" style={{ marginBottom: 8 }}>Category</div>

              <div className="space-y-3" style={{ width: '100%' }}>
                {group.items.map((skill) => (
                  <div key={skill.id} style={{ width: '100%' }}>
                    <div className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{skill.name}</span>
                      <span className="text-sm" style={{ color: '#a78bfa' }}>{skill.proficiency}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 9999, height: 8 }}>
                      <div
                        style={{
                          width: `${skill.proficiency}%`,
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 9999
                        }}
                      />
                    </div>
                    {isLoggedIn && (
                      <div className="card-actions" style={{ marginTop: 10 }}>
                        <button onClick={() => handleEdit(skill)} className="btn-edit">✏️</button>
                        <button onClick={() => handleDelete(skill.id)} className="btn-delete">🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                  <label htmlFor="category">Category *</label>
                  <input
                    id="category"
                    type="text"
                    placeholder="e.g., Frontend, Backend, Database"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="proficiency">Proficiency Level (1-100)</label>
                  <input
                    id="proficiency"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="50"
                    value={form.proficiency}
                    onChange={(e) => setForm({ ...form, proficiency: parseInt(e.target.value) || 50 })}
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

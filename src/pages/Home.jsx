import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import '../styles/Home.css';

export const Home = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const menuItems = [
    { icon: '😊', label: 'About', path: '/about' },
    { icon: '💼', label: 'Projects', path: '/projects' },
    { icon: '🏁', label: 'Hackathons', path: '/hackathons' },
    { icon: '🧠', label: 'Skills', path: '/skills' },
    { icon: '🏆', label: 'Achievements', path: '/certificates' },
    { icon: '🎉', label: 'Fun', path: '/fun' },
    { icon: '🔑', label: 'Contact', path: '/contact' }
  ];

  return (
    <div className="home-page">
      <div className="nav-buttons">
        <Link to="/login" className="login-btn" title="Login" aria-label="Login">
          <img src="/user.svg" alt="User login" width="26" height="26" />
        </Link>
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <h1>Hey, I'm ANJANEYULU👋</h1>
      <h2>AI Portfolio</h2>

      <img className="avatar" src="/avatar.svg" alt="Avatar" />

      <div className="search" onClick={() => navigate('/chat')}>
        <input type="text" placeholder="Ask me anything..." readOnly />
        <button>➤</button>
      </div>

      <div className="menu">
        {menuItems.map((item, index) => (
          <div key={index} className="menu-item" onClick={() => navigate(item.path)}>
            {item.icon} <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

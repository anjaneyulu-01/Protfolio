import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, logout } = useAuth();

  return (
    <div className="nav-buttons">
      <Link to="/" className="back-btn">← Back to Home</Link>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {isLoggedIn && (
          <button onClick={logout} className="back-btn" style={{ background: 'var(--btn-gradient)', color: 'white' }}>
            Logout
          </button>
        )}
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
};

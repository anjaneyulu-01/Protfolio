import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
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
      </div>
    </div>
  );
};

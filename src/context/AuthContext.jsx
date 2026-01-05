import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext();
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8005';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();

    const handler = () => checkAuth();
    window.addEventListener('auth-changed', handler);
    return () => window.removeEventListener('auth-changed', handler);
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/auth/check`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      const data = await response.json();

      if (data?.logged) {
        setIsLoggedIn(true);
        setUser({ email: data.email, isAdmin: data.is_admin });
      } else {
        setIsLoggedIn(false);
        setUser(null);
        // Clear stale local token if backend says session is invalid
        if (token) {
          localStorage.removeItem('access_token');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (token) => {
    if (token) {
      localStorage.setItem('access_token', token);
    }
    setIsLoggedIn(true);
    setLoading(false);
    window.dispatchEvent(new CustomEvent('auth-changed'));
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      setIsLoggedIn(false);
      setUser(null);
      setLoading(false);
      window.dispatchEvent(new CustomEvent('auth-changed'));
    }
  };

  const value = useMemo(() => ({
    isLoggedIn,
    loading,
    user,
    login,
    logout,
    checkAuth
  }), [isLoggedIn, loading, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

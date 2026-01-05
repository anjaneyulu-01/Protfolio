import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8005/auth/check', {
        credentials: 'include'
      });
      const data = await response.json();
      setIsLoggedIn(data.logged || false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    setIsLoggedIn(true);
    window.dispatchEvent(new CustomEvent('auth-changed'));
  };

  const logout = async () => {
    try {
      await fetch('http://127.0.0.1:8005/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsLoggedIn(false);
      window.dispatchEvent(new CustomEvent('auth-changed'));
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpPanel, setShowOtpPanel] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  
  // Check for redirect parameter
  const urlParams = new URLSearchParams(window.location.search);
  const redirectPath = urlParams.get('redirect') || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8005/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Login failed' }));
        alert('Login failed: ' + (error.detail || ''));
        return;
      }

      const data = await response.json();
      if (data && data.otp_sent) {
        sessionStorage.setItem('pending_login_email', email);
        setShowOtpPanel(true);
        setOtpMessage(data.message || 'OTP sent to owner email');
      } else {
        alert('Login failed to send OTP.');
      }
    } catch (error) {
      alert('Login error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loginEmail = sessionStorage.getItem('pending_login_email');
      const response = await fetch('http://127.0.0.1:8005/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, otp })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'OTP verification failed' }));
        alert('OTP invalid: ' + (error.detail || ''));
        return;
      }

      const data = await response.json();
      if (data && data.token) {
        localStorage.setItem('access_token', data.token);
      }

      sessionStorage.removeItem('pending_login_email');
      login();
      navigate(redirectPath);
    } catch (error) {
      alert('OTP verification error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8005/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setOtpMessage(data.message || 'OTP resent successfully');
      }
    } catch (error) {
      alert('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="content-page">
        <Header />
        <div className="container login-container">
          <h1>Welcome back!</h1>
          <p className="lead">You are already logged in.</p>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ marginBottom: '12px' }}>Signed in as <strong>{email || 'Admin'}</strong></p>
            <button onClick={logout} className="btn btn-logout">
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-page">
      <Header />
      <div className="container login-container">
        <h1>Welcome back</h1>
        <p className="lead">Sign in to access additional features of the portfolio</p>

        {!showOtpPanel ? (
          <form onSubmit={handleLogin}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="actions">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ marginTop: '12px' }}>
            <p>OTP has been sent to the owner's email. Please check your email and enter the code below.</p>
            <form onSubmit={handleVerifyOtp}>
              <label htmlFor="otp">One-time code</label>
              <input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
              <div className="actions">
                <button type="submit" className="btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify code'}
                </button>
                <button type="button" className="secondary" onClick={handleResendOtp} disabled={loading}>
                  Resend
                </button>
              </div>
              <div className="small">{otpMessage}</div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

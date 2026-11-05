import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { Lock, Mail, CheckCircle2 } from 'lucide-react';

export default function Login({ onLogin, onNavigate, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      await onLogin({ email, password, rememberMe });
    } catch (err) {
      const msg = err.message || 'Invalid email or password.';
      setErrorMessage(msg);
      if (showToast) showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '48px',
          alignItems: 'center'
        }}
        className="auth-container"
      >
        <style>{`
          @media (max-width: 860px) {
            .auth-container {
              grid-template-columns: 1fr !important;
              gap: 32px !important;
            }
          }
        `}</style>

        {/* Left Side: Branding & Statement */}
        <div>
          <div
            onClick={() => onNavigate('home')}
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '6px',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#000000' }}>
              SkillSwap
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                padding: '2px 6px',
                borderRadius: '6px'
              }}
            >
              Campus
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 3.8vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: '#111111',
              marginBottom: '20px'
            }}
          >
            “Your campus is full of people who know something you want to learn.”
          </h1>

          <p style={{ fontSize: '1.05rem', color: '#666666', lineHeight: 1.6, marginBottom: '32px' }}>
            Connect directly with fellow students across engineering, design, arts, and business. Share your mastery, learn new crafts.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} strokeWidth={2.2} />
              <span style={{ fontSize: '0.9rem', color: '#333333', fontWeight: 500 }}>
                100% verified student profiles via college domain
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} strokeWidth={2.2} />
              <span style={{ fontSize: '0.9rem', color: '#333333', fontWeight: 500 }}>
                Direct chat & zero platform commissions
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Glass Login Card */}
        <GlassCard
          style={{
            padding: '36px 32px',
            borderRadius: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.06)'
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111111', marginBottom: '6px' }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#666666' }}>
              Enter your college email to access your learning dashboard
            </p>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '18px'
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#222222',
                  marginBottom: '6px'
                }}
              >
                College Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#888888'
                  }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="student@campus.edu"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#222222' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => showToast('Password reset link sent to registered email.')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.78rem',
                    color: '#666666',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#888888'
                  }}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#000000', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.82rem', color: '#555555', cursor: 'pointer' }}>
                Remember me on this campus device
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.95rem',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Create Account link */}
          <div style={{ textAlign: 'center', marginTop: '26px' }}>
            <span style={{ fontSize: '0.85rem', color: '#666666' }}>
              Don't have an account?{' '}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              style={{
                background: 'none',
                border: 'none',
                color: '#000000',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Create one
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login({ onLogin, onNavigate, showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({ email });
    showToast('Logged in successfully.');
  };

  const handleDemoLogin = () => {
    setEmail('ram@campus.edu');
    setPassword('demopassword');
    onLogin({ email: 'ram@campus.edu' });
    showToast('Signed in as Ram (Demo Student)');
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

          {/* Quick Demo Student Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: '12px',
              backgroundColor: '#F3F3EF',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              color: '#111111',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} />
            Quick Demo Login as Ram (3rd Year CSE)
          </button>

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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: '0.95rem' }}
            >
              Login
            </button>
          </form>

          {/* Social Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '22px 0',
              color: '#888888',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <span style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0, 0, 0, 0.08)' }} />
            <span>or</span>
            <span style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0, 0, 0, 0.08)' }} />
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '11px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          {/* Create Account link */}
          <div style={{ textAlign: 'center', marginTop: '22px' }}>
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

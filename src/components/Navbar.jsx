import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, ArrowRight, ArrowLeft, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar({
  activePage,
  onNavigate,
  onBack,
  isLoggedIn,
  currentUser,
  onLogout
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'discover', label: 'Discover' },
    { id: 'skills', label: 'Skills' },
    { id: 'students', label: 'Students' },
    { id: 'how-it-works', label: 'How it Works' }
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        transition: 'all 0.25s ease',
        backgroundColor: scrolled
          ? 'rgba(247, 247, 245, 0.88)'
          : 'rgba(247, 247, 245, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: scrolled
          ? '1px solid rgba(0, 0, 0, 0.08)'
          : '1px solid rgba(0, 0, 0, 0.03)',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.03)' : 'none'
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Left: Brand & Optional Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {activePage !== 'home' && onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Go back to previous page (Backspace)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: '#FFFFFF',
                color: '#111111',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#111111';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.color = '#111111';
              }}
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
          )}

          <div
            onClick={() => onNavigate('home')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              userSelect: 'none'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#111111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <img
                src="./avatars/default_logo.svg"
                alt="SkillSwap Campus Logo"
                style={{ width: '22px', height: '22px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  color: '#000000',
                  fontFamily: 'inherit'
                }}
              >
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
          </div>
      </div>

      {/* Center: Desktop Nav Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '28px'
          }}
          className="desktop-nav"
        >
          <style>{`
            @media (min-width: 820px) {
              .desktop-nav { display: flex !important; }
              .mobile-toggle { display: none !important; }
            }
          `}</style>

          {navLinks.map((link) => {
            const isActive = activePage === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigate(link.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#000000' : '#555555',
                  cursor: 'pointer',
                  padding: '6px 2px',
                  position: 'relative',
                  transition: 'color 0.15s ease'
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: '#000000',
                      borderRadius: '2px'
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '12px'
          }}
          className="desktop-nav"
        >
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`btn btn-sm ${activePage === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <LayoutDashboard size={15} />
                Dashboard
              </button>

              <div
                onClick={() => onNavigate('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px 8px 4px 4px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
                title="View your student profile"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="avatar"
                  style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111111' }}>
                  {currentUser?.name ? currentUser.name.split(' ')[0] : 'Profile'}
                </span>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="btn btn-ghost btn-sm"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="btn btn-primary btn-sm"
              >
                Get Started
                <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '10px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'rgba(247, 247, 245, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            padding: '16px 24px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => {
                onNavigate(link.id);
                setMobileMenuOpen(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                fontSize: '1rem',
                fontWeight: activePage === link.id ? 700 : 500,
                color: activePage === link.id ? '#000000' : '#555555',
                padding: '10px 0',
                cursor: 'pointer'
              }}
            >
              {link.label}
            </button>
          ))}

          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <LayoutDashboard size={16} />
                  Open Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Users,
  Award,
  Share2,
  MessageSquare,
  UserCheck,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({
  activePage,
  onNavigate,
  currentUser,
  unreadMessagesCount = 1,
  pendingConnectionsCount = 1,
  onLogout
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'discover', label: 'Discover Skills', icon: Compass },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'my-skills', label: 'My Skills', icon: Award },
    {
      id: 'connections',
      label: 'Connections',
      icon: UserCheck,
      badge: pendingConnectionsCount > 0 ? pendingConnectionsCount : null
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null
    },
    { id: 'how-it-works', label: 'How it Works', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      style={{
        width: '260px',
        flexShrink: 0,
        minHeight: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40
      }}
      className="app-sidebar"
    >
      <style>{`
        @media (max-width: 900px) {
          .app-sidebar {
            display: none !important;
          }
        }
      `}</style>

      <div>
        {/* Brand header */}
        <div
          onClick={() => onNavigate('dashboard')}
          style={{
            padding: '20px 24px 18px 24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: '#111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <img
              src="/avatars/default_logo.svg"
              alt="SkillSwap Campus Logo"
              style={{ width: '19px', height: '19px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: '#000000'
              }}
            >
              SkillSwap
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                padding: '2px 5px',
                borderRadius: '4px'
              }}
            >
              Campus
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ padding: '16px 12px' }}>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#999999',
              padding: '0 12px 8px 12px'
            }}
          >
            Platform
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive ? '#000000' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#444444',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
                      e.currentTarget.style.color = '#111111';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#444444';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        backgroundColor: isActive ? '#FFFFFF' : '#111111',
                        color: isActive ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Bottom Profile Mini-Card */}
      <div
        style={{
          padding: '14px',
          margin: '12px',
          borderRadius: '16px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div
          onClick={() => onNavigate('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
          }}
          title="Go to student profile"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="avatar"
            style={{ width: '38px', height: '38px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#111111',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {currentUser?.name || 'Your Profile'}
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#777777',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {(currentUser?.department ? currentUser.department.split(' ')[0] : 'Set up profile')} • {currentUser?.year || '1st Year'}
            </div>
          </div>
          <ChevronRight size={15} color="#888888" />
        </div>

        <div
          style={{
            marginTop: '10px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.75rem',
              color: '#666666',
              cursor: 'pointer',
              fontWeight: 500,
              padding: '2px 0'
            }}
          >
            Preferences
          </button>
          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.75rem',
              color: '#999999',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
              padding: '2px 0'
            }}
            title="Log out of session"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

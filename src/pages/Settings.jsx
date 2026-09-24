import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import SkillChip from '../components/SkillChip';
import {
  User,
  Shield,
  Bell,
  Trash2,
  Check,
  Save,
  Lock,
  Plus,
  Eye,
  AlertTriangle
} from 'lucide-react';

export default function Settings({
  currentUser,
  onUpdateProfile,
  onOpenAddSkill,
  onNavigate,
  showToast
}) {
  const [activeSection, setActiveSection] = useState('personal'); // personal | skills | account | danger

  // Form states
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [year, setYear] = useState(currentUser?.year || '1st Year');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || './avatars/default_avatar.svg');

  // Account states
  const [notifyRequests, setNotifyRequests] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSavePersonal = (e) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      email,
      department,
      year,
      bio,
      avatar
    });
    showToast('Personal information updated successfully.');
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (newPassword) {
      setCurrentPassword('');
      setNewPassword('');
      showToast('Password and security preferences updated.');
    } else {
      showToast('Notification and privacy preferences updated.');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your campus profile? This cannot be undone.')) {
      showToast('Account scheduled for deactivation.');
      onNavigate('home');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 24px 80px 24px' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#111111',
            marginBottom: '6px'
          }}
        >
          Profile Settings
        </h1>
        <p style={{ fontSize: '1rem', color: '#6B6B6B' }}>
          Manage your personal information, skill listings, and account preferences.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: '32px',
          alignItems: 'flex-start'
        }}
        className="settings-layout"
      >
        <style>{`
          @media (max-width: 760px) {
            .settings-layout {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* Sidebar Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'personal', label: 'Personal Information', icon: User },
            { id: 'skills', label: 'Skills Management', icon: Shield },
            { id: 'account', label: 'Account & Privacy', icon: Bell },
            { id: 'danger', label: 'Danger Zone', icon: Trash2, danger: true }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? '#000000' : 'transparent',
                  color: isActive
                    ? '#FFFFFF'
                    : tab.danger
                    ? '#C92A2A'
                    : '#444444',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div>
          {/* SECTION: Personal Information */}
          {activeSection === 'personal' && (
            <GlassCard style={{ padding: '32px', backgroundColor: '#FFFFFF' }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                  Personal Information
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#666666', margin: '4px 0 0 0' }}>
                  Update how your name, branch, and bio appear across campus.
                </p>
              </div>

              <form onSubmit={handleSavePersonal}>
                {/* Profile Picture / Avatar Logo Selector */}
                <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '8px' }}>
                    Profile Picture / Avatar Logo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <img
                      src={avatar}
                      alt={name}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #111111',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        backgroundColor: '#F5F5F3'
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#666666' }}>
                        Choose a default logo, avatar icon, or campus profile:
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                          { id: './avatars/default_avatar.svg', label: 'Default Avatar Logo' },
                          { id: './avatars/default_logo.svg', label: 'SkillSwap Exchange Logo' },
                          { id: './avatars/lasya_bodapati.png', label: 'Campus Student' },
                          { id: './avatars/rahul.png', label: 'Rahul' }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setAvatar(opt.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '999px',
                              border: avatar === opt.id ? '2px solid #111111' : '1px solid rgba(0,0,0,0.12)',
                              backgroundColor: avatar === opt.id ? 'rgba(0,0,0,0.06)' : '#FFFFFF',
                              color: '#111111',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              fontWeight: avatar === opt.id ? 700 : 500,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <img
                              src={opt.id}
                              alt={opt.label}
                              style={{ width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: '#FFFFFF',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                    College Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. yourname@campus.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: '#FFFFFF',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      color: '#111111',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#888888', marginTop: '4px', display: 'block' }}>
                    Used for receiving campus match updates and connection requests.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor: '#FFFFFF',
                        fontFamily: 'inherit',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                      Year
                    </label>
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        backgroundColor: '#FFFFFF',
                        fontFamily: 'inherit',
                        fontSize: '0.85rem',
                        outline: 'none'
                      }}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                    Bio
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell campus peers about your learning goals and projects..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: '#FFFFFF',
                      fontFamily: 'inherit',
                      fontSize: '0.875rem',
                      lineHeight: 1.45,
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary">
                    <Save size={15} />
                    Save Changes
                  </button>
                </div>
              </form>
            </GlassCard>
          )}

          {/* SECTION: Skills */}
          {activeSection === 'skills' && (
            <GlassCard style={{ padding: '32px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                    Skills Management
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#666666', margin: '4px 0 0 0' }}>
                    Add or modify what you teach and learn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenAddSkill}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={14} />
                  + Add Skill
                </button>
              </div>

              {/* Teaching skills */}
              <div style={{ marginBottom: '28px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#888888', display: 'block', marginBottom: '10px' }}>
                  Teaching Skills ({currentUser?.skillsTeaching?.length || 0}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {currentUser?.skillsTeaching?.map((s) => (
                    <SkillChip key={s.id} name={s.name} level={s.level} />
                  ))}
                </div>
              </div>

              {/* Learning skills */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#888888', display: 'block', marginBottom: '10px' }}>
                  Learning Goals ({currentUser?.skillsLearning?.length || 0}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {currentUser?.skillsLearning?.map((s) => (
                    <SkillChip key={s.id} name={s.name} variant="outline" />
                  ))}
                </div>
              </div>

              <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <button
                  type="button"
                  onClick={() => onNavigate('my-skills')}
                  className="btn btn-secondary btn-sm"
                >
                  Open Full My Skills Manager
                </button>
              </div>
            </GlassCard>
          )}

          {/* SECTION: Account & Privacy */}
          {activeSection === 'account' && (
            <GlassCard style={{ padding: '32px', backgroundColor: '#FFFFFF' }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                  Account & Privacy
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#666666', margin: '4px 0 0 0' }}>
                  Control your security credentials and notifications.
                </p>
              </div>

              <form onSubmit={handleSaveAccount}>
                {/* Change Password */}
                <div style={{ marginBottom: '28px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>
                    Change Password
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#555555', marginBottom: '4px' }}>
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          fontFamily: 'inherit',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: '#555555', marginBottom: '4px' }}>
                        New Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          fontFamily: 'inherit',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Notifications & Visibility */}
                <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(0,0,0,0.08)', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px' }}>
                    Notifications & Campus Visibility
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={notifyRequests}
                        onChange={(e) => setNotifyRequests(e.target.checked)}
                        style={{ accentColor: '#000000' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#333333' }}>
                        Email notification when a classmate requests a connection
                      </span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={notifyMessages}
                        onChange={(e) => setNotifyMessages(e.target.checked)}
                        style={{ accentColor: '#000000' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#333333' }}>
                        Direct message alerts on active skill swaps
                      </span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={profileVisible}
                        onChange={(e) => setProfileVisible(e.target.checked)}
                        style={{ accentColor: '#000000' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: '#333333' }}>
                        Show my profile in campus search and skill discovery results
                      </span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary">
                    <Save size={15} />
                    Update Preferences
                  </button>
                </div>
              </form>
            </GlassCard>
          )}

          {/* SECTION: Danger Zone */}
          {activeSection === 'danger' && (
            <GlassCard
              style={{
                padding: '32px',
                backgroundColor: '#FFFFFF',
                border: '1px solid rgba(201, 42, 42, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertTriangle size={20} color="#C92A2A" />
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#C92A2A', margin: 0 }}>
                  Danger Zone
                </h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#666666', lineHeight: 1.5, marginBottom: '24px' }}>
                Deleting your account permanently removes your teaching listings, ratings, reviews, and active conversation logs.
              </p>

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="btn btn-primary"
                style={{ backgroundColor: '#C92A2A', borderColor: '#C92A2A', color: '#FFFFFF' }}
              >
                <Trash2 size={16} />
                Delete Campus Profile
              </button>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

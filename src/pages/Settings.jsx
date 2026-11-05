import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import SkillChip from '../components/SkillChip';
import ProfilePhotoPicker from '../components/ProfilePhotoPicker';
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
  AlertTriangle,
  X
} from 'lucide-react';

export default function Settings({
  currentUser,
  onUpdateProfile,
  onDeleteAccount,
  onOpenAddSkill,
  onNavigate,
  showToast
}) {
  const [activeSection, setActiveSection] = useState('personal'); // personal | skills | account | danger

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isDemoUser = Boolean(currentUser?.isDemo || currentUser?.is_demo);

  // Form states
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [year, setYear] = useState(currentUser?.year || '1st Year');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || './avatars/default_avatar.svg');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Synchronize local form inputs whenever currentUser updates from the backend
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setDepartment(currentUser.department || '');
      setYear(currentUser.year || '1st Year');
      setBio(currentUser.bio || '');
      setAvatar(currentUser.avatar || './avatars/default_avatar.svg');
    }
  }, [currentUser]);

  // Account states
  const [notifyRequests, setNotifyRequests] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await onUpdateProfile({
        name,
        department,
        year,
        bio,
        avatar
      });
      setSuccessMessage('Profile information updated successfully.');
      showToast('Personal information updated successfully.');
    } catch (err) {
      const msg = err.message || 'Failed to update profile.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
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

  const handleDeleteAccountClick = () => {
    if (isDemoUser) {
      showToast('Demo accounts cannot be deleted to preserve the campus walkthrough.', 'error');
      return;
    }
    setDeleteConfirmationInput('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmationInput.trim() !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
      setShowDeleteModal(false);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please try again.');
      setIsDeleting(false);
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
                    marginBottom: '20px'
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    marginBottom: '20px'
                  }}
                >
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSavePersonal}>
                {/* Profile Photo Picker Section */}
                <ProfilePhotoPicker
                  photo={avatar}
                  onPhotoChange={(newPhoto) => setAvatar(newPhoto)}
                  onPhotoRemove={() => setAvatar('./avatars/default_avatar.svg')}
                  disabled={loading}
                  isDemo={Boolean(currentUser?.isDemo)}
                  label="Profile Picture / Custom Photo"
                />

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
                    readOnly
                    value={email}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: '#F7F7F5',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      color: '#666666',
                      cursor: 'not-allowed',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#888888', marginTop: '4px', display: 'block' }}>
                    College domain email is fixed to your campus account and verified at registration.
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
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    <Save size={15} />
                    {loading ? 'Saving...' : 'Save Changes'}
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
              <p style={{ fontSize: '0.875rem', color: '#666666', lineHeight: 1.5, marginBottom: '20px' }}>
                Permanently delete your student profile, custom avatar, teaching skills, and learning goals from the campus database.
              </p>

              {isDemoUser ? (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    color: '#991B1B',
                    fontSize: '0.85rem',
                    lineHeight: 1.45,
                    marginBottom: '16px'
                  }}
                >
                  <strong>Demo account protected:</strong> The shared demo student profile cannot be deleted to preserve the campus walkthrough.
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleDeleteAccountClick}
                disabled={isDemoUser}
                className="btn btn-primary"
                style={{
                  backgroundColor: isDemoUser ? '#E5E7EB' : '#C92A2A',
                  borderColor: isDemoUser ? '#E5E7EB' : '#C92A2A',
                  color: isDemoUser ? '#9CA3AF' : '#FFFFFF',
                  cursor: isDemoUser ? 'not-allowed' : 'pointer'
                }}
              >
                <Trash2 size={16} />
                Delete Campus Profile
              </button>
            </GlassCard>
          )}

          {/* Account Deletion Confirmation Modal */}
          {showDeleteModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                zIndex: 1000
              }}
            >
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  maxWidth: '480px',
                  width: '100%',
                  padding: '28px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(201, 42, 42, 0.3)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#FEF2F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#DC2626'
                      }}
                    >
                      <AlertTriangle size={20} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#111111' }}>
                      Delete Campus Profile
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isDeleting) {
                        setShowDeleteModal(false);
                        setDeleteError('');
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      color: '#666666',
                      padding: '4px'
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '20px' }}>
                  <p style={{ marginTop: 0, marginBottom: '12px', fontWeight: 600, color: '#DC2626' }}>
                    Warning: This action is permanent and cannot be undone.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Your account, profile info, and uploaded photos will be permanently removed.</li>
                    <li>Pending connection requests will be cancelled immediately.</li>
                    <li>Shared conversations and learning sessions will be preserved for your peers, displaying your name as "Deleted student".</li>
                    <li>All active sessions on all devices will be terminated.</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                    Type <strong style={{ color: '#DC2626' }}>DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationInput}
                    onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                    placeholder="DELETE"
                    disabled={isDeleting}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em'
                    }}
                  />
                </div>

                {deleteError && (
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      color: '#991B1B',
                      fontSize: '0.82rem'
                    }}
                  >
                    {deleteError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteError('');
                    }}
                    disabled={isDeleting}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '9px 16px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting || deleteConfirmationInput.trim() !== 'DELETE'}
                    className="btn btn-primary btn-sm"
                    style={{
                      padding: '9px 16px',
                      backgroundColor: '#DC2626',
                      borderColor: '#DC2626',
                      color: '#FFFFFF',
                      opacity: deleteConfirmationInput.trim() === 'DELETE' && !isDeleting ? 1 : 0.6,
                      cursor: deleteConfirmationInput.trim() === 'DELETE' && !isDeleting ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {isDeleting ? 'Deleting Account...' : 'Permanently Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

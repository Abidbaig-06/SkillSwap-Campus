import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export default function AddSkillModal({ isOpen, onClose, onAddSkill, initialType = 'teach' }) {
  const [skillType, setSkillType] = useState(initialType); // 'teach' | 'learn'
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Programming');
  const [level, setLevel] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Synchronize modal state whenever opened
  useEffect(() => {
    if (isOpen) {
      const type = initialType || 'teach';
      setSkillType(type);
      setName('');
      setCategory(type === 'learn' ? 'General' : 'Programming');
      setLevel(type === 'learn' ? 'Beginner' : 'Intermediate');
      setLoading(false);
      setErrorMessage('');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const popularSuggestions = [
    'React', 'Python', 'UI/UX Design', 'Figma', 'Photography',
    'Video Editing', 'Public Speaking', 'Machine Learning', 'Data Structures',
    'Financial Modeling', 'Git & GitHub', 'Content Writing'
  ];

  const handleTabChange = (type) => {
    setSkillType(type);
    if (errorMessage) setErrorMessage('');
    if (type === 'teach' && level === 'Beginner') {
      setLevel('Intermediate');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Please enter a skill name.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await onAddSkill({
        type: skillType,
        skill: {
          name: trimmedName,
          level,
          category
        }
      });

      setName('');
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to add skill.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 16px 28px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Add a Skill
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#666666', margin: '3px 0 0 0' }}>
              Add what you can teach or what you're excited to learn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#444444'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher: Teach vs Learn */}
        <div style={{ padding: '16px 28px 0 28px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: '#F1F1EE',
              borderRadius: '12px',
              padding: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => handleTabChange('teach')}
              style={{
                border: 'none',
                background: skillType === 'teach' ? '#FFFFFF' : 'transparent',
                color: skillType === 'teach' ? '#111111' : '#666666',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '9px 12px',
                borderRadius: '9px',
                cursor: 'pointer',
                boxShadow: skillType === 'teach' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              I Can Teach
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('learn')}
              style={{
                border: 'none',
                background: skillType === 'learn' ? '#FFFFFF' : 'transparent',
                color: skillType === 'learn' ? '#111111' : '#666666',
                fontWeight: 600,
                fontSize: '0.85rem',
                padding: '9px 12px',
                borderRadius: '9px',
                cursor: 'pointer',
                boxShadow: skillType === 'learn' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              I Want to Learn
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 28px 26px 28px' }}>
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: 500,
                marginBottom: '16px'
              }}
            >
              {errorMessage}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
              Skill Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Next.js, Figma, Premiere Pro..."
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

          {/* Quick Suggestions */}
          <div style={{ marginBottom: '18px' }}>
            <span style={{ display: 'block', fontSize: '0.72rem', color: '#888888', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
              Popular on campus:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {popularSuggestions.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setName(s)}
                  style={{
                    background: '#F5F5F2',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: '9999px',
                    padding: '3px 9px',
                    fontSize: '0.75rem',
                    color: '#333333',
                    cursor: 'pointer'
                  }}
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="Programming">Programming</option>
                <option value="Design">Design</option>
                <option value="Communication">Communication</option>
                <option value="Photography">Photography</option>
                <option value="Video">Video</option>
                <option value="Business">Business</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                Proficiency Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              <Plus size={15} />
              {loading ? 'Adding Skill...' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

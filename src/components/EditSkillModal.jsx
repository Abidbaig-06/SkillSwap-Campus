import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function EditSkillModal({ isOpen, onClose, skill, onUpdateSkill }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Programming');
  const [level, setLevel] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isTeaching = skill?.type === 'teach';

  useEffect(() => {
    if (isOpen && skill) {
      setName(skill.name || '');
      setCategory(skill.category || (isTeaching ? 'Programming' : 'General'));
      setLevel(skill.level || (isTeaching ? 'Intermediate' : 'Beginner'));
      setErrorMessage('');
      setLoading(false);
    }
  }, [isOpen, skill, isTeaching]);

  if (!isOpen || !skill) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Skill name cannot be empty.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await onUpdateSkill({
        id: skill.id || skill._id,
        name: trimmedName,
        level,
        category
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update skill.');
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
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111111' }}>
              Edit {isTeaching ? 'Teaching Skill' : 'Learning Goal'}
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#666666', margin: '3px 0 0 0' }}>
              Update your proficiency or skill details for this {isTeaching ? 'teaching offer' : 'learning interest'}
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
            <label
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#222222',
                marginBottom: '6px'
              }}
            >
              Skill Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#222222',
                  marginBottom: '6px'
                }}
              >
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
                <option value="Engineering">Engineering</option>
                <option value="General">General</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#222222',
                  marginBottom: '6px'
                }}
              >
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
              <Check size={15} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


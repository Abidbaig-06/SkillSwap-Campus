import React, { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';

export default function ConnectModal({ student, isOpen, onClose, onSendRequest, currentUser }) {
  const [note, setNote] = useState(
    `Hey ${student?.name?.split(' ')[0] || 'there'}! I saw your profile on SkillSwap Campus and would love to connect and swap skills with you.`
  );
  const [selectedOfferSkill, setSelectedOfferSkill] = useState(
    currentUser?.skillsTeaching?.[0]?.name || 'React'
  );
  const [targetSkill, setTargetSkill] = useState(
    student?.canTeach?.[0]?.name || (typeof student?.canTeach?.[0] === 'string' ? student.canTeach[0] : 'their skills')
  );

  if (!isOpen || !student) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendRequest({
      studentId: student.id,
      studentName: student.name,
      offeredSkill: selectedOfferSkill,
      targetSkill: targetSkill,
      note: note
    });
    onClose();
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
              Connect with {student.name}
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#666666', margin: '3px 0 0 0' }}>
              {student.department} • {student.year}
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
          {/* Peer Card Preview */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px',
              backgroundColor: '#F9F9F7',
              borderRadius: '16px',
              marginBottom: '20px',
              border: '1px solid rgba(0, 0, 0, 0.06)'
            }}
          >
            <img
              src={student.avatar}
              alt={student.name}
              className="avatar"
              style={{ width: '46px', height: '46px' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                What they can teach:
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111111', marginTop: '2px' }}>
                {student.canTeach?.map((s) => (typeof s === 'string' ? s : s.name)).join(', ')}
              </div>
            </div>
          </div>

          {/* Skill you want to learn from them */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
              Skill you'd like to learn:
            </label>
            <select
              value={targetSkill}
              onChange={(e) => setTargetSkill(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: '#FFFFFF',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              {student.canTeach?.map((s, idx) => {
                const name = typeof s === 'string' ? s : s.name;
                return <option key={idx} value={name}>{name}</option>;
              })}
            </select>
          </div>

          {/* Skill you offer in return */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
              Skill you can share in return:
            </label>
            <select
              value={selectedOfferSkill}
              onChange={(e) => setSelectedOfferSkill(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                backgroundColor: '#FFFFFF',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              {currentUser?.skillsTeaching?.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.level})
                </option>
              ))}
            </select>
          </div>

          {/* Personal Note */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
              Personal message:
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
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

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              <Send size={15} />
              Send Connection Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

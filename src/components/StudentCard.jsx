import React from 'react';
import GlassCard from './GlassCard';
import SkillChip from './SkillChip';
import { Star, ArrowUpRight, UserPlus, Check } from 'lucide-react';

export default function StudentCard({
  student,
  onViewProfile,
  onConnect,
  isConnected = false,
  showMatch = true
}) {
  return (
    <GlassCard
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
      }}
    >
      <div>
        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={student.avatar}
                alt={student.name}
                className="avatar"
                style={{ width: '52px', height: '52px', objectFit: 'cover' }}
              />
              {student.status === 'online' && (
                <span
                  title="Online on campus"
                  style={{
                    position: 'absolute',
                    bottom: '1px',
                    right: '1px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#111111',
                    border: '2px solid #FFFFFF'
                  }}
                />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                {student.name}
              </h3>
              <p style={{ fontSize: '0.825rem', color: '#6B6B6B', margin: '2px 0 0 0' }}>
                {student.department} • {student.year}
              </p>
            </div>
          </div>

          {/* Match or Rating Pill */}
          {showMatch && student.matchPercent ? (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
                background: '#111111',
                color: '#FFFFFF',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap'
              }}
            >
              {student.matchPercent}% Match
            </span>
          ) : student.rating ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#111111',
                background: 'rgba(0,0,0,0.04)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              <Star size={13} fill="#111111" strokeWidth={0} />
              <span>{student.rating}</span>
            </div>
          ) : null}
        </div>

        {/* Bio */}
        {student.bio && (
          <p
            style={{
              fontSize: '0.86rem',
              color: '#4B4B4B',
              lineHeight: 1.45,
              marginBottom: '18px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            "{student.bio}"
          </p>
        )}

        {/* Can Teach Section */}
        <div style={{ marginBottom: '14px' }}>
          <span
            style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#888888',
              marginBottom: '7px'
            }}
          >
            Can Teach
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {student.canTeach?.map((s, idx) => (
              <SkillChip
                key={idx}
                name={typeof s === 'string' ? s : (s.skill || s.name)}
                level={typeof s === 'object' ? s.level : undefined}
                size="sm"
              />
            ))}
          </div>
        </div>

        {/* Wants to Learn Section */}
        {((student.wantsToLearn && student.wantsToLearn.length > 0) || (student.wantToLearn && student.wantToLearn.length > 0)) && (
          <div style={{ marginBottom: '20px' }}>
            <span
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#888888',
                marginBottom: '7px'
              }}
            >
              Wants to Learn
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(student.wantsToLearn || student.wantToLearn).map((s, idx) => (
                <SkillChip
                  key={idx}
                  name={typeof s === 'string' ? s : (s.skill || s.name)}
                  level={typeof s === 'object' ? s.level : undefined}
                  size="sm"
                  variant="outline"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={() => onViewProfile && onViewProfile(student)}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%' }}
        >
          View Profile
          <ArrowUpRight size={14} />
        </button>

        <button
          type="button"
          onClick={() => onConnect && onConnect(student)}
          disabled={isConnected}
          className={`btn btn-sm ${isConnected ? 'btn-outline' : 'btn-primary'}`}
          style={{ width: '100%' }}
        >
          {isConnected ? (
            <>
              <Check size={14} />
              Connected
            </>
          ) : (
            <>
              <UserPlus size={14} />
              Connect
            </>
          )}
        </button>
      </div>
    </GlassCard>
  );
}

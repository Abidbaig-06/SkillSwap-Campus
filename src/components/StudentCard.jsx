import React, { useState } from 'react';
import GlassCard from './GlassCard';
import SkillChip from './SkillChip';
import { Star, ArrowUpRight, UserPlus, Check, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export default function StudentCard({
  student,
  onViewProfile,
  onConnect,
  isConnected = false,
  showMatch = true
}) {
  const [isWhyMatchOpen, setIsWhyMatchOpen] = useState(false);
  const matchEvidence = student.matchEvidence || (typeof student.matchPercent === 'number' ? {
    matchPercent: student.matchPercent,
    matchType: student.matchPercent >= 85 ? 'mutual' : student.matchPercent >= 65 ? 'one_way' : student.matchPercent === 55 ? 'department' : student.matchPercent === 50 ? 'guest' : 'no_overlap',
    theyCanTeachYou: student.theyCanTeachYou || [],
    youCanTeachThem: student.youCanTeachThem || [],
    formulaExplanation: ''
  } : null);

  return (
    <GlassCard
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        border: student.isDemo ? '1px solid rgba(0, 0, 0, 0.14)' : '1px solid rgba(0, 0, 0, 0.08)'
      }}
    >
      <div>
        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={student.avatar || './avatars/default_avatar.svg'}
                alt={student.name}
                className="avatar"
                onError={(e) => { e.currentTarget.src = './avatars/default_avatar.svg'; }}
                style={{ width: '52px', height: '52px', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                  {student.name}
                </h3>
                {student.isVerified && !student.isDemo && (
                  <CheckCircle2 size={15} fill="#111111" color="#FFFFFF" title="Verified College Student" />
                )}
              </div>
              <p style={{ fontSize: '0.825rem', color: '#6B6B6B', margin: '2px 0 0 0' }}>
                {student.department} • {student.year}
              </p>
              {student.isDemo && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: 'rgba(0, 0, 0, 0.06)',
                    color: '#111111',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    marginTop: '4px'
                  }}
                >
                  <Sparkles size={10} />
                  Demo Guide
                </span>
              )}
            </div>
          </div>

          {/* Match or Rating Pill */}
          {showMatch && typeof student.matchPercent === 'number' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span
                title="Calculated from mutual teaching and learning skill overlap"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  background: student.matchPercent >= 85 ? '#0A5C36' : student.matchPercent >= 65 ? '#111111' : '#4B4B4B',
                  color: '#FFFFFF',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap'
                }}
              >
                {student.matchPercent}% Match
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWhyMatchOpen((prev) => !prev);
                }}
                className="btn-ghost"
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: '#555555',
                  padding: '1px 4px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px'
                }}
                aria-expanded={isWhyMatchOpen}
                aria-label="Toggle why this match explanation"
              >
                Why this match?
                {isWhyMatchOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            </div>
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

        {/* Expandable "Why this match?" panel */}
        {isWhyMatchOpen && (
          <div
            style={{
              backgroundColor: '#F8F9FA',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '0.8rem',
              lineHeight: 1.45
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor:
                    matchEvidence?.matchType === 'mutual'
                      ? 'rgba(10, 92, 54, 0.12)'
                      : matchEvidence?.matchType === 'one_way'
                      ? 'rgba(0, 0, 0, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  color: matchEvidence?.matchType === 'mutual' ? '#0A5C36' : '#111111'
                }}
              >
                {matchEvidence?.matchType === 'mutual' && '🤝 Mutual Swap'}
                {matchEvidence?.matchType === 'one_way' && '🎯 One-Way Mentorship'}
                {matchEvidence?.matchType === 'department' && '🏛️ Same Department'}
                {matchEvidence?.matchType === 'no_overlap' && '🌐 Campus Peer'}
                {(!matchEvidence || matchEvidence?.matchType === 'guest') && '👋 Guest Preview'}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#111111' }}>
                {student.matchPercent}%
              </span>
            </div>

            {matchEvidence?.matchType === 'guest' ? (
              <p style={{ margin: '0 0 6px 0', color: '#4B4B4B' }}>
                Log in or sign up to see personalized matching based on what you want to learn and teach.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '6px' }}>
                {matchEvidence?.theyCanTeachYou?.length > 0 && (
                  <p style={{ margin: 0, color: '#111111', fontWeight: 500 }}>
                    • You can learn <strong style={{ color: '#0A5C36' }}>{matchEvidence.theyCanTeachYou.join(', ')}</strong> from {student.name}.
                  </p>
                )}
                {matchEvidence?.youCanTeachThem?.length > 0 && (
                  <p style={{ margin: 0, color: '#111111', fontWeight: 500 }}>
                    • You can teach {student.name} <strong style={{ color: '#0A5C36' }}>{matchEvidence.youCanTeachThem.join(', ')}</strong>.
                  </p>
                )}
                {(!matchEvidence?.theyCanTeachYou?.length && !matchEvidence?.youCanTeachThem?.length) && (
                  <p style={{ margin: 0, color: '#4B4B4B' }}>
                    {matchEvidence?.matchType === 'department'
                      ? `No direct skill overlap yet, but you both share the ${student.department} department.`
                      : `No direct skill overlap found yet. Connect with ${student.name} to explore new collaborative skills.`}
                  </p>
                )}
              </div>
            )}

            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #E2E8F0', fontSize: '0.68rem', color: '#6B7280' }}>
              <span>
                Deterministic formula: 85–100% mutual match (base 85% + 5%/skill), 65–80% 1-way (base 65% + 5%/skill), 55% department bonus, 45% campus baseline. Not an AI projection or guaranteed outcome.
              </span>
            </div>
          </div>
        )}

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

import React from 'react';
import GlassCard from './GlassCard';
import { ArrowRight, Users } from 'lucide-react';

export default function SkillCard({ skill, onExplore }) {
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
        {/* Top category & Count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#6B6B6B',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '3px 9px',
              borderRadius: '9999px'
            }}
          >
            {skill.category}
          </span>

          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#111111',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Users size={13} strokeWidth={2} />
            {skill.teacherCount} students teaching
          </span>
        </div>

        {/* Skill Title */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111111', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          {skill.title}
        </h3>

        {/* Description */}
        <p style={{ fontSize: '0.85rem', color: '#555555', lineHeight: 1.45, marginBottom: '20px' }}>
          {skill.description}
        </p>

        {/* Level Range */}
        <div
          style={{
            fontSize: '0.78rem',
            color: '#777777',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#111111' }}></span>
          <span>{skill.levelRange}</span>
        </div>
      </div>

      <div>
        {/* Avatar Stack + Explore Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Overlapping Avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {skill.avatarList?.slice(0, 4).map((av, idx) => (
              <img
                key={idx}
                src={av}
                alt="Instructor"
                className="avatar"
                style={{
                  width: '28px',
                  height: '28px',
                  marginLeft: idx === 0 ? 0 : '-8px',
                  border: '2px solid #FFFFFF'
                }}
              />
            ))}
            {skill.teacherCount > 4 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  marginLeft: '6px',
                  color: '#666666'
                }}
              >
                +{skill.teacherCount - 4} more
              </span>
            )}
          </div>

          {/* Explore Button */}
          <button
            type="button"
            onClick={() => onExplore && onExplore(skill)}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600 }}
          >
            Explore
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

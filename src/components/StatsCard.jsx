import React from 'react';
import GlassCard from './GlassCard';

export default function StatsCard({ title, value, subtitle, icon: Icon, onClick }) {
  return (
    <GlassCard
      onClick={onClick}
      style={{
        padding: '22px 24px',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#6B6B6B',
            letterSpacing: '0.01em'
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#111111'
            }}
          >
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: '#111111'
          }}
        >
          {typeof value === 'number' && value < 10 ? `0${value}` : value}
        </span>
      </div>

      {subtitle && (
        <p style={{ fontSize: '0.78rem', color: '#888888', marginTop: '6px', marginBottom: 0 }}>
          {subtitle}
        </p>
      )}
    </GlassCard>
  );
}

import React from 'react';
import GlassCard from './GlassCard';
import { MessageSquare, ArrowUpRight, Check, X, Clock } from 'lucide-react';

export default function ConnectionCard({
  connection,
  onMessage,
  onViewProfile,
  onAccept,
  onDecline
}) {
  const isPending = connection.status?.startsWith('pending');
  const isIncoming = connection.status === 'pending_incoming';

  return (
    <GlassCard
      style={{
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={connection.avatar}
              alt={connection.name}
              className="avatar"
              style={{ width: '48px', height: '48px' }}
            />
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                {connection.name}
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#6B6B6B', margin: '2px 0 0 0' }}>
                {connection.department} • {connection.year}
              </p>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: isPending ? '#F2F2EE' : '#EFEFEA',
              color: '#444444',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {isPending && <Clock size={11} />}
            {connection.type}
          </span>
        </div>

        {/* Note if pending */}
        {connection.note && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 12px',
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              borderRadius: '10px',
              fontSize: '0.825rem',
              color: '#333333',
              fontStyle: 'italic',
              lineHeight: 1.4
            }}
          >
            "{connection.note}"
          </div>
        )}

        {/* You both share info */}
        <div
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#6B6B6B' }}>
            You both share:
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111111' }}>
            {connection.sharedSkill}
          </span>
        </div>
      </div>

      {/* Buttons */}
      {isIncoming ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onAccept && onAccept(connection)}
            className="btn btn-primary btn-sm"
          >
            <Check size={14} />
            Accept
          </button>
          <button
            type="button"
            onClick={() => onDecline && onDecline(connection)}
            className="btn btn-outline btn-sm"
          >
            <X size={14} />
            Decline
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onMessage && onMessage(connection)}
            className="btn btn-primary btn-sm"
          >
            <MessageSquare size={14} />
            Message
          </button>
          <button
            type="button"
            onClick={() => onViewProfile && onViewProfile(connection)}
            className="btn btn-secondary btn-sm"
          >
            View Profile
            <ArrowUpRight size={14} />
          </button>
        </div>
      )}
    </GlassCard>
  );
}

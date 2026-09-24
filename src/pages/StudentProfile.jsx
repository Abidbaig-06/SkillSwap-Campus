import React from 'react';
import GlassCard from '../components/GlassCard';
import SkillChip from '../components/SkillChip';
import {
  ArrowLeft,
  MessageSquare,
  UserPlus,
  Star,
  CheckCircle2,
  Calendar,
  Award,
  Users,
  Share2,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';

export default function StudentProfile({
  student,
  onBack,
  onConnect,
  onMessage,
  isConnected = false
}) {
  if (!student) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p>Student profile not found.</p>
        <button type="button" onClick={onBack} className="btn btn-secondary">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px 80px 24px' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: '24px', paddingLeft: 0 }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Top Profile Header Card */}
      <GlassCard
        style={{
          padding: '36px 32px',
          borderRadius: '24px',
          marginBottom: '32px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          {/* Avatar and Basic info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={student.avatar}
                alt={student.name}
                className="avatar"
                style={{ width: '88px', height: '88px', border: '3px solid #FFFFFF' }}
              />
              {student.status === 'online' && (
                <span
                  title="Online on campus"
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#111111',
                    border: '3px solid #FFFFFF'
                  }}
                />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, color: '#111111', letterSpacing: '-0.03em' }}>
                  {student.name || 'Campus Student'}
                </h1>
                <CheckCircle2 size={18} fill="#111111" color="#FFFFFF" />
              </div>
              <p style={{ fontSize: '0.95rem', color: '#666666', margin: '4px 0 8px 0', fontWeight: 500 }}>
                {student.department ? `${student.department} • ` : ''}{student.year || 'Student'}
              </p>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={15}
                      fill={star <= Math.round(student.rating || 0) ? '#111111' : 'none'}
                      stroke="#111111"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111111' }}>
                  {student.rating ? student.rating.toFixed(1) : 'New'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#777777' }}>
                  ({student.reviewsCount || 0} peer reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => onMessage(student)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '10px 18px' }}
            >
              <MessageSquare size={16} />
              Message
            </button>
            <button
              type="button"
              onClick={() => onConnect(student)}
              disabled={isConnected}
              className={`btn btn-sm ${isConnected ? 'btn-outline' : 'btn-primary'}`}
              style={{ padding: '10px 20px' }}
            >
              {isConnected ? (
                <>
                  <Check size={16} />
                  Connected
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Connect
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bio snippet */}
        {student.bio ? (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
            <p style={{ fontSize: '1rem', color: '#444444', lineHeight: 1.6, margin: 0 }}>
              “{student.bio}”
            </p>
          </div>
        ) : null}
      </GlassCard>

      {/* Grid: Skills I Can Teach & Skills I Want to Learn */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}
      >
        {/* Can Teach */}
        <GlassCard style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
            Skills I Can Teach
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#666666', marginBottom: '18px' }}>
            Areas of practical experience and project mentorship
          </p>
          {student.canTeach && student.canTeach.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {student.canTeach.map((s, idx) => (
                <SkillChip
                  key={idx}
                  name={typeof s === 'string' ? s : (s.skill || s.name)}
                  level={typeof s === 'object' ? s.level : undefined}
                  size="md"
                />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#888888', fontStyle: 'italic', margin: 0 }}>
              No teaching skills listed yet.
            </p>
          )}
        </GlassCard>

        {/* Wants to Learn */}
        <GlassCard style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>
            Skills I Want to Learn
          </h2>
          <p style={{ fontSize: '0.825rem', color: '#666666', marginBottom: '18px' }}>
            Excited to exchange knowledge and take lessons from peers
          </p>
          {((student.wantsToLearn && student.wantsToLearn.length > 0) || (student.wantToLearn && student.wantToLearn.length > 0)) ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {(student.wantsToLearn || student.wantToLearn).map((s, idx) => (
                <SkillChip
                  key={idx}
                  name={typeof s === 'string' ? s : (s.skill || s.name)}
                  level={typeof s === 'object' ? s.level : undefined}
                  size="md"
                  variant="outline"
                />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#888888', fontStyle: 'italic', margin: 0 }}>
              No learning goals listed yet.
            </p>
          )}
        </GlassCard>
      </div>

      {/* Learning Activity Cards */}
      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
          Learning Activity
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}
        >
          <GlassCard style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#111111' }}>
              <Award size={18} />
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#666666' }}>Skills Shared</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111111' }}>
              {student.activity?.skillsShared ?? 0}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#111111' }}>
              <Users size={18} />
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#666666' }}>Connections</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111111' }}>
              {student.activity?.connections ?? 0}
            </div>
          </GlassCard>

          <GlassCard style={{ padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: '#111111' }}>
              <Calendar size={18} />
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#666666' }}>Learning Sessions</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#111111' }}>
              {student.activity?.sessions ?? 0}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Reviews / Peer Feedback */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 0 }}>
            Reviews / Peer Feedback
          </h2>
          <span style={{ fontSize: '0.825rem', color: '#666666' }}>
            Verified student exchange testimonials
          </span>
        </div>

        {student.reviews && student.reviews.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {student.reviews.map((rev) => (
              <GlassCard key={rev.id} style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111111' }}>
                      {rev.author}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#777777', marginLeft: '8px' }}>
                      {rev.dept}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={i < rev.rating ? '#111111' : 'none'}
                          stroke="#111111"
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#888888' }}>
                      {rev.date}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#444444', lineHeight: 1.5, margin: 0 }}>
                  "{rev.text}"
                </p>
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard style={{ padding: '32px', textAlign: 'center', color: '#666666' }}>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              No peer reviews logged yet. Be the first to swap a skill with {student.name}!
            </p>
            <button
              type="button"
              onClick={() => onConnect(student)}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '14px' }}
            >
              Send Connection Request
            </button>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

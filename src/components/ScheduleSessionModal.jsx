import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle, Sparkles, Loader2, UserCheck } from 'lucide-react';

export default function ScheduleSessionModal({
  isOpen,
  onClose,
  mode = 'propose', // 'propose' | 'reschedule'
  connection = null,
  partner = null,
  session = null,
  currentUser = null,
  onSessionScheduled = () => {}
}) {
  const viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Format default datetime-local string (tomorrow at 10:00 AM)
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // State
  const [title, setTitle] = useState('');
  const [skillName, setSkillName] = useState('');
  const [role, setRole] = useState('teacher'); // 'teacher' (currentUser teaches) | 'learner' (currentUser learns)
  const [startTimeLocal, setStartTimeLocal] = useState(getDefaultDateTime());
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [learningObjectives, setLearningObjectives] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Target partner info
  const resolvedPartner = partner || session?.partner || (
    connection ? (connection.requester?.id === currentUser?.id ? connection.recipient : connection.requester) : null
  );

  // Initialize form fields on open
  useEffect(() => {
    if (!isOpen) {
      setErrorMsg('');
      setIsSubmitting(false);
      return;
    }

    setErrorMsg('');
    setIsSubmitting(false);

    if (mode === 'reschedule' && session) {
      setTitle(session.title || '');
      setSkillName(session.skillName || '');
      setDurationMinutes(session.durationMinutes || 60);
      setRescheduleReason('');
      if (session.startTime) {
        const d = new Date(session.startTime);
        const pad = (n) => String(n).padStart(2, '0');
        setStartTimeLocal(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      } else {
        setStartTimeLocal(getDefaultDateTime());
      }
    } else {
      // Propose mode
      const defaultSkill = connection?.offeredSkill || connection?.targetSkill || currentUser?.skillsTeaching?.[0]?.name || '';
      setSkillName(defaultSkill);
      setTitle(defaultSkill ? `Mastering ${defaultSkill} with ${resolvedPartner?.name || 'Partner'}` : 'Peer Learning Session');
      setRole('teacher');
      setDurationMinutes(60);
      setLearningObjectives('');
      setStartTimeLocal(getDefaultDateTime());
    }
  }, [isOpen, mode, session, connection, resolvedPartner, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const startUtcDate = new Date(startTimeLocal);
    if (isNaN(startUtcDate.getTime())) {
      setErrorMsg('Please select a valid date and time.');
      return;
    }

    if (startUtcDate.getTime() <= Date.now()) {
      setErrorMsg('Session start time must be scheduled in the future.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'reschedule' && session) {
        const response = await fetch(`/SkillSwap-Campus/api/sessions/${session.id || session._id}/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startTime: startUtcDate.toISOString(),
            durationMinutes: Number(durationMinutes),
            reason: rescheduleReason.trim()
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit reschedule request.');
        }

        onSessionScheduled(data.session);
        onClose();
      } else {
        // Propose new session
        const connectionId = connection?.id || connection?._id || session?.connectionId;
        if (!connectionId) {
          throw new Error('Connection reference is missing.');
        }

        const teacherId = role === 'teacher' ? currentUser.id : resolvedPartner.id;
        const learnerId = role === 'teacher' ? resolvedPartner.id : currentUser.id;

        const payload = {
          connectionId,
          title: title.trim(),
          skillName: skillName.trim(),
          teacher: teacherId,
          learner: learnerId,
          learningObjectives: learningObjectives.trim(),
          startTime: startUtcDate.toISOString(),
          durationMinutes: Number(durationMinutes),
          timezone: viewerTimezone,
          clientRequestId: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        };

        const response = await fetch('/SkillSwap-Campus/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to schedule peer session.');
        }

        onSessionScheduled(data.session);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong while saving the session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%' }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 18px 28px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111111'
              }}
            >
              <Calendar size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                {mode === 'reschedule' ? 'Propose New Time' : 'Schedule Peer Learning Session'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#666666', margin: '2px 0 0 0' }}>
                Partner: <strong style={{ color: '#111111' }}>{resolvedPartner?.name || 'Campus Student'}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
          {errorMsg && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#991B1B',
                fontSize: '0.875rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {mode === 'propose' && (
            <>
              {/* Session Topic / Title */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: '#222222'
                  }}
                >
                  Topic / Lesson Title <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master CSS Flexbox & Grid Layouts"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.15)',
                    fontSize: '0.925rem',
                    background: '#FFFFFF',
                    color: '#111111'
                  }}
                />
              </div>

              {/* Skill being exchanged */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '6px',
                    color: '#222222'
                  }}
                >
                  Skill Being Taught <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g. React, Python, UI Design"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.15)',
                    fontSize: '0.925rem',
                    background: '#FFFFFF',
                    color: '#111111'
                  }}
                />
              </div>

              {/* Roles: Who is teaching? */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                    color: '#222222'
                  }}
                >
                  Who is teaching this session?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: role === 'teacher' ? '2px solid #000000' : '1px solid rgba(0, 0, 0, 0.12)',
                      background: role === 'teacher' ? '#000000' : '#FFFFFF',
                      color: role === 'teacher' ? '#FFFFFF' : '#333333',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>I will teach</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 400 }}>
                      {resolvedPartner?.name || 'Partner'} learns
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('learner')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: role === 'learner' ? '2px solid #000000' : '1px solid rgba(0, 0, 0, 0.12)',
                      background: role === 'learner' ? '#000000' : '#FFFFFF',
                      color: role === 'learner' ? '#FFFFFF' : '#333333',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{resolvedPartner?.name?.split(' ')[0] || 'Partner'} teaches</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 400 }}>
                      I will learn
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Date & Time with Timezone */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#222222'
                }}
              >
                {mode === 'reschedule' ? 'New Proposed Date & Time' : 'Date & Time'} <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#666666',
                  background: 'rgba(0, 0, 0, 0.05)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                Timezone: {viewerTimezone}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="datetime-local"
                required
                value={startTimeLocal}
                onChange={(e) => setStartTimeLocal(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.15)',
                  fontSize: '0.925rem',
                  background: '#FFFFFF',
                  color: '#111111'
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#222222'
              }}
            >
              Session Duration <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {[30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  style={{
                    padding: '9px 4px',
                    borderRadius: '10px',
                    border: durationMinutes === mins ? '2px solid #000000' : '1px solid rgba(0, 0, 0, 0.12)',
                    background: durationMinutes === mins ? '#000000' : '#FFFFFF',
                    color: durationMinutes === mins ? '#FFFFFF' : '#333333',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          {mode === 'propose' ? (
            /* Learning Objectives */
            <div style={{ marginBottom: '22px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: '#222222'
                }}
              >
                Learning Objectives / Agenda
              </label>
              <textarea
                rows={3}
                value={learningObjectives}
                onChange={(e) => setLearningObjectives(e.target.value)}
                placeholder="What topics or skills will you cover during this session?"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.15)',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  background: '#FFFFFF',
                  color: '#111111',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          ) : (
            /* Reschedule Reason */
            <div style={{ marginBottom: '22px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '6px',
                  color: '#222222'
                }}
              >
                Reason for Rescheduling (Optional)
              </label>
              <textarea
                rows={2}
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Exam conflict at 10 AM, proposing afternoon instead"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.15)',
                  fontSize: '0.9rem',
                  resize: 'vertical',
                  background: '#FFFFFF',
                  color: '#111111',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '11px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                background: '#FFFFFF',
                color: '#333333',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '11px 24px',
                borderRadius: '12px',
                border: 'none',
                background: '#000000',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>{mode === 'reschedule' ? 'Send Reschedule Request' : 'Propose Session'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Loader2,
  User,
  Check,
  Globe
} from 'lucide-react';

export default function SessionDetailsModal({
  isOpen,
  onClose,
  session: initialSession,
  currentUser,
  onOpenDiscussion = () => {},
  onOpenReschedule = () => {},
  onSessionUpdated = () => {}
}) {
  const [session, setSession] = useState(initialSession);
  const [notes, setNotes] = useState([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState('');

  // New Note State
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteActionError, setNoteActionError] = useState('');

  // Editing Note State
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState('');

  // Action status
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  const sessionId = session?.id || session?._id;

  // Load notes whenever session changes
  const fetchNotes = async () => {
    if (!sessionId) return;
    setIsLoadingNotes(true);
    setNotesError('');
    try {
      const res = await fetch(`/SkillSwap-Campus/api/sessions/${sessionId}/notes`);
      if (!res.ok) {
        throw new Error('Failed to load session notes.');
      }
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      setNotesError(err.message);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchNotes();
      setShowAddNote(false);
      setNoteText('');
      setResourceTitle('');
      setResourceUrl('');
      setActionError('');
      setNoteActionError('');
    }
  }, [isOpen, sessionId]);

  if (!isOpen || !session) return null;

  const currentUserId = currentUser?.id || currentUser?._id;
  const isTeacher = session.teacher?.id === currentUserId || session.teacher === currentUserId;
  const isLearner = session.learner?.id === currentUserId || session.learner === currentUserId;
  const isMyProposal = session.proposedBy === currentUserId || session.isMyProposal;
  const partner = session.partner || (isTeacher ? session.learner : session.teacher);

  const startUtc = new Date(session.startTime);
  const endUtc = session.endTime ? new Date(session.endTime) : new Date(startUtc.getTime() + (session.durationMinutes || 60) * 60000);
  const hasStarted = Date.now() >= startUtc.getTime();

  // Completed status check
  const completedBy = Array.isArray(session.completedBy) ? session.completedBy : [];
  const hasConfirmedCompletion = completedBy.includes(currentUserId) || session.hasConfirmedCompletion;
  const isFullyCompleted = session.status === 'completed';

  // Format date display
  const formatDateRange = (dStart, dEnd) => {
    const optionsDate = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const optionsTime = { hour: 'numeric', minute: '2-digit' };
    try {
      const dateStr = dStart.toLocaleDateString(undefined, optionsDate);
      const timeStart = dStart.toLocaleTimeString(undefined, optionsTime);
      const timeEnd = dEnd.toLocaleTimeString(undefined, optionsTime);
      return `${dateStr} • ${timeStart} - ${timeEnd}`;
    } catch {
      return 'Scheduled Time';
    }
  };

  // Status Badge Helper
  const renderStatusBadge = () => {
    switch (session.status) {
      case 'confirmed':
        return (
          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#DCFCE7', color: '#166534', fontWeight: 600, fontSize: '0.8rem' }}>
            Confirmed
          </span>
        );
      case 'proposed':
        return (
          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#FEF9C3', color: '#854D0E', fontWeight: 600, fontSize: '0.8rem' }}>
            {isMyProposal ? 'Proposal Sent' : 'Needs Your Response'}
          </span>
        );
      case 'completed':
        return (
          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#E0E7FF', color: '#3730A3', fontWeight: 600, fontSize: '0.8rem' }}>
            Completed ({session.durationMinutes || 60}m)
          </span>
        );
      case 'declined':
        return (
          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#FEE2E2', color: '#991B1B', fontWeight: 600, fontSize: '0.8rem' }}>
            Declined
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#F3F4F6', color: '#4B5563', fontWeight: 600, fontSize: '0.8rem' }}>
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  // API Action triggers
  const handleApiAction = async (endpoint, method = 'PATCH', body = {}) => {
    setIsProcessingAction(true);
    setActionError('');
    try {
      const payload = {
        version: session.version,
        ...body
      };
      const res = await fetch(`/SkillSwap-Campus/api/sessions/${sessionId}/${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed.');
      }
      setSession(data.session);
      onSessionUpdated(data.session);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Add Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmittingNote(true);
    setNoteActionError('');

    const resources = [];
    if (resourceUrl.trim()) {
      resources.push({
        title: resourceTitle.trim() || 'Reference Link',
        url: resourceUrl.trim()
      });
    }

    try {
      const res = await fetch(`/SkillSwap-Campus/api/sessions/${sessionId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: noteText.trim(),
          resources
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add lesson note.');
      }

      setNotes((prev) => [data.note, ...prev]);
      setNoteText('');
      setResourceTitle('');
      setResourceUrl('');
      setShowAddNote(false);
    } catch (err) {
      setNoteActionError(err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Edit Note
  const handleSaveEditNote = async (noteId) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`/SkillSwap-Campus/api/sessions/${sessionId}/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update note.');
      setNotes((prev) => prev.map((n) => (n.id === noteId ? data.note : n)));
      setEditingNoteId(null);
      setEditText('');
    } catch (err) {
      setNoteActionError(err.message);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const res = await fetch(`/SkillSwap-Campus/api/sessions/${sessionId}/notes/${noteId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete note.');
      }
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setNoteActionError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%', maxHeight: '88vh' }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '24px 28px 18px 28px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {renderStatusBadge()}
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#4B5563',
                  background: 'rgba(0,0,0,0.05)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}
              >
                {session.skillName}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: '#111111' }}>
              {session.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          {/* Action error banner */}
          {actionError && (
            <div
              style={{
                marginBottom: '18px',
                padding: '12px 16px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '12px',
                color: '#991B1B',
                fontSize: '0.875rem',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>{actionError}</div>
            </div>
          )}

          {/* Reschedule Proposal Notification Banner */}
          {session.rescheduleProposal && session.status === 'confirmed' && (
            <div
              style={{
                marginBottom: '20px',
                padding: '14px 18px',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="#D97706" />
                <strong style={{ fontSize: '0.9rem', color: '#92400E' }}>
                  {session.rescheduleProposal.isMyReschedule
                    ? 'You requested a new session time'
                    : `${partner?.name || 'Partner'} proposed to reschedule`}
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#78350F' }}>
                Proposed: {formatDateRange(new Date(session.rescheduleProposal.startTime), new Date(session.rescheduleProposal.endTime))} ({session.rescheduleProposal.durationMinutes}m)
              </p>
              {session.rescheduleProposal.reason && (
                <p style={{ margin: 0, fontSize: '0.825rem', color: '#92400E', fontStyle: 'italic' }}>
                  "{session.rescheduleProposal.reason}"
                </p>
              )}

              {!session.rescheduleProposal.isMyReschedule && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => handleApiAction('reschedule/accept', 'PATCH')}
                    style={{
                      padding: '7px 14px',
                      background: '#D97706',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Accept New Time
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingAction}
                    onClick={() => handleApiAction('reschedule/decline', 'PATCH')}
                    style={{
                      padding: '7px 14px',
                      background: 'transparent',
                      color: '#78350F',
                      border: '1px solid rgba(120, 53, 15, 0.3)',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Keep Current Time
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Schedule Time & Timezone Card */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: '#F9FAFB',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111111'
                }}
              >
                <Calendar size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.925rem', color: '#111111' }}>
                  {formatDateRange(startUtc, endUtc)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={13} />
                  <span>Viewer Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone || session.timezone || 'UTC'}</span>
                  <span>• {session.durationMinutes} mins</span>
                </div>
              </div>
            </div>

            {/* Discussion Button */}
            {session.conversationId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDiscussion(session.conversationId, partner);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  background: '#FFFFFF',
                  color: '#111111',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <MessageSquare size={15} />
                <span>Open Discussion</span>
              </button>
            )}
          </div>

          {/* Participants */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
            {/* Teacher */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                Instructor / Teacher
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={session.teacher?.avatar || './avatars/default_avatar.svg'}
                  onError={(e) => { e.currentTarget.src = './avatars/default_avatar.svg'; }}
                  alt={session.teacher?.name}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111111' }}>
                    {session.teacher?.name} {session.teacher?.id === currentUserId && '(You)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {session.teacher?.department} • {session.teacher?.year}
                  </div>
                </div>
              </div>
            </div>

            {/* Learner */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '14px',
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.08)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '8px' }}>
                Student / Learner
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={session.learner?.avatar || './avatars/default_avatar.svg'}
                  onError={(e) => { e.currentTarget.src = './avatars/default_avatar.svg'; }}
                  alt={session.learner?.name}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111111' }}>
                    {session.learner?.name} {session.learner?.id === currentUserId && '(You)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {session.learner?.department} • {session.learner?.year}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Objectives */}
          {session.learningObjectives && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111111', marginBottom: '6px' }}>
                Learning Objectives / Agenda
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#F9FAFB',
                  color: '#374151',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {session.learningObjectives}
              </div>
            </div>
          )}

          {/* Session Lifecycle Actions Bar */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: '#F3F4F6',
              marginBottom: '26px'
            }}
          >
            {/* If Proposed */}
            {session.status === 'proposed' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                {!isMyProposal ? (
                  <>
                    <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500 }}>
                      Do you want to confirm this session?
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => handleApiAction('accept', 'PATCH')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#000000',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Accept Proposal
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingAction}
                        onClick={() => handleApiAction('decline', 'PATCH')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: '1px solid rgba(0, 0, 0, 0.15)',
                          background: '#FFFFFF',
                          color: '#DC2626',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                      Waiting for {partner?.name || 'partner'} to accept your proposal.
                    </span>
                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => handleApiAction('cancel', 'PATCH', { reason: 'Cancelled by proposer' })}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.15)',
                        background: '#FFFFFF',
                        color: '#6B7280',
                        fontSize: '0.825rem',
                        cursor: 'pointer'
                      }}
                    >
                      Withdraw Proposal
                    </button>
                  </>
                )}
              </div>
            )}

            {/* If Confirmed */}
            {session.status === 'confirmed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#111111' }}>
                    {hasConfirmedCompletion ? (
                      <span style={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} />
                        You verified completion. Waiting for {partner?.name || 'partner'}.
                      </span>
                    ) : (
                      <span>
                        {hasStarted
                          ? 'Session has started. Both participants confirm completion to log exchange hours.'
                          : 'Confirmed learning session.'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Completion button */}
                    {!hasConfirmedCompletion && (
                      <button
                        type="button"
                        disabled={isProcessingAction || !hasStarted}
                        title={!hasStarted ? 'Completion can be confirmed once the session starts' : ''}
                        onClick={() => handleApiAction('complete', 'POST')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '10px',
                          border: 'none',
                          background: hasStarted ? '#059669' : '#9CA3AF',
                          color: '#FFFFFF',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: hasStarted ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Check size={16} />
                        <span>Confirm Completed</span>
                      </button>
                    )}

                    {/* Reschedule button */}
                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => {
                        onClose();
                        onOpenReschedule(session);
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.15)',
                        background: '#FFFFFF',
                        color: '#111111',
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>Reschedule</span>
                    </button>

                    {/* Cancel session button */}
                    <button
                      type="button"
                      disabled={isProcessingAction}
                      onClick={() => {
                        const reason = prompt('Reason for cancelling this session:');
                        if (reason !== null) {
                          handleApiAction('cancel', 'PATCH', { reason });
                        }
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(220, 38, 38, 0.3)',
                        background: '#FFFFFF',
                        color: '#DC2626',
                        fontSize: '0.825rem',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* If Completed */}
            {isFullyCompleted && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontSize: '0.875rem' }}>
                <CheckCircle2 size={18} />
                <span>
                  This session is fully completed! {session.durationMinutes} minutes ({Math.round(session.durationMinutes / 6) / 10} hours) credited to your dashboard profile.
                </span>
              </div>
            )}

            {/* If Cancelled or Declined */}
            {(session.status === 'cancelled' || session.status === 'declined') && (
              <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                This session was {session.status}.
                {session.cancellationReason && ` Reason: "${session.cancellationReason}"`}
              </div>
            )}
          </div>

          {/* Session Notes & Shared Resources Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#111111" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                  Lesson Notes & Resources
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#6B7280', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '10px' }}>
                  {notes.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNote(!showAddNote)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.12)',
                  background: showAddNote ? '#111111' : '#FFFFFF',
                  color: showAddNote ? '#FFFFFF' : '#111111',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                {showAddNote ? <X size={14} /> : <Plus size={14} />}
                <span>{showAddNote ? 'Cancel' : 'Add Note'}</span>
              </button>
            </div>

            {/* Add Note Form */}
            {showAddNote && (
              <form
                onSubmit={handleAddNote}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: '#F9FAFB',
                  border: '1px solid rgba(0,0,0,0.08)',
                  marginBottom: '16px'
                }}
              >
                {noteActionError && (
                  <div style={{ color: '#DC2626', fontSize: '0.8rem', marginBottom: '10px' }}>
                    {noteActionError}
                  </div>
                )}
                <div style={{ marginBottom: '10px' }}>
                  <textarea
                    rows={3}
                    required
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write key takeaways, homework, or instructions..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0,0,0,0.15)',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                    placeholder="Link title (e.g. GitHub Repo)"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.15)',
                      fontSize: '0.825rem'
                    }}
                  />
                  <input
                    type="url"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="Resource URL (https://...)"
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.15)',
                      fontSize: '0.825rem'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddNote(false)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.15)',
                      background: '#FFFFFF',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#000000',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isSubmittingNote ? <Loader2 size={14} className="animate-spin" /> : null}
                    <span>Save Note</span>
                  </button>
                </div>
              </form>
            )}

            {/* Notes List */}
            {isLoadingNotes ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>
                <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                Loading lesson notes...
              </div>
            ) : notesError ? (
              <div style={{ padding: '16px', color: '#DC2626', fontSize: '0.85rem' }}>
                {notesError}
              </div>
            ) : notes.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: '#F9FAFB',
                  borderRadius: '12px',
                  color: '#6B7280',
                  fontSize: '0.85rem'
                }}
              >
                No notes or resources attached yet. Share study materials, code links, or summaries!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notes.map((note) => {
                  const isAuthor = note.authorId === currentUserId;
                  const isEditing = editingNoteId === note.id;

                  return (
                    <div
                      key={note.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(0,0,0,0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            src={note.authorAvatar || './avatars/default_avatar.svg'}
                            onError={(e) => { e.currentTarget.src = './avatars/default_avatar.svg'; }}
                            alt={note.authorName}
                            style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.825rem', color: '#111111' }}>
                            {note.authorName} {isAuthor && '(You)'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                            {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {isAuthor && !isEditing && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(note.id);
                                setEditText(note.text);
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#6B7280',
                                cursor: 'pointer',
                                padding: '3px'
                              }}
                              title="Edit Note"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteNote(note.id)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#DC2626',
                                cursor: 'pointer',
                                padding: '3px'
                              }}
                              title="Delete Note"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div style={{ marginTop: '8px' }}>
                          <textarea
                            rows={3}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '8px',
                              border: '1px solid rgba(0,0,0,0.2)',
                              fontSize: '0.85rem',
                              fontFamily: 'inherit'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setEditingNoteId(null)}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(0,0,0,0.15)',
                                background: '#FFFFFF',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEditNote(note.id)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#000000',
                                color: '#FFFFFF',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {note.text}
                        </div>
                      )}

                      {/* Resource links */}
                      {Array.isArray(note.resources) && note.resources.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                          {note.resources.map((res, idx) => (
                            <a
                              key={idx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                background: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                color: '#1D4ED8',
                                fontSize: '0.78rem',
                                textDecoration: 'none',
                                fontWeight: 500
                              }}
                            >
                              <ExternalLink size={12} />
                              <span>{res.title || res.url}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


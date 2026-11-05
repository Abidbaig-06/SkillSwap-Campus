import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  User,
  Search,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Inbox
} from 'lucide-react';
import ScheduleSessionModal from '../components/ScheduleSessionModal';
import SessionDetailsModal from '../components/SessionDetailsModal';

export default function Sessions({
  currentUser,
  onNavigate = () => {},
  onOpenDiscussion = () => {},
  showToast = () => {},
  onSessionUpdated: propOnSessionUpdated = () => {}
}) {
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'pending' | 'completed' | 'cancelled'
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionProcessingId, setActionProcessingId] = useState(null);

  // Modals state
  const [selectedSessionForDetails, setSelectedSessionForDetails] = useState(null);
  const [rescheduleSessionTarget, setRescheduleSessionTarget] = useState(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  // Fetch sessions
  const fetchSessions = async (tab = activeTab) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/SkillSwap-Campus/api/sessions?status=${tab}`);
      if (!res.ok) {
        throw new Error('Failed to load learning sessions.');
      }
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(activeTab);
  }, [activeTab]);

  const currentUserId = currentUser?.id || currentUser?._id;

  // Filtered by search query
  const filteredSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.skillName?.toLowerCase().includes(q) ||
      s.partner?.name?.toLowerCase().includes(q)
    );
  });

  const handleSessionUpdated = (updatedSession) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
    if (selectedSessionForDetails?.id === updatedSession.id) {
      setSelectedSessionForDetails(updatedSession);
    }
    propOnSessionUpdated(updatedSession);
    fetchSessions(activeTab);
  };

  // Direct quick actions
  const handleQuickAccept = async (e, s) => {
    e.stopPropagation();
    const sessionId = typeof s === 'string' ? s : (s?.id || s?._id);
    const sessionObj = typeof s === 'object' ? s : sessions.find((item) => (item.id || item._id) === sessionId);
    if (!sessionId || actionProcessingId === sessionId) return;
    setActionProcessingId(sessionId);
    setErrorMsg('');
    try {
      const res = await fetch(`/SkillSwap-Campus/api/sessions/${sessionId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: sessionObj?.version })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to accept proposal.');
      }
      showToast(`Session "${data.session?.title || sessionObj?.title || 'Learning Session'}" accepted and confirmed!`, 'success');
      handleSessionUpdated(data.session);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to accept proposal.');
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleQuickDecline = async (e, s) => {
    e.stopPropagation();
    const sessionId = typeof s === 'string' ? s : (s?.id || s?._id);
    const sessionObj = typeof s === 'object' ? s : sessions.find((item) => (item.id || item._id) === sessionId);
    if (!sessionId || actionProcessingId === sessionId) return;
    setActionProcessingId(sessionId);
    setErrorMsg('');
    try {
      const res = await fetch(`/SkillSwap-Campus/api/sessions/${sessionId}/decline`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: sessionObj?.version })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to decline proposal.');
      }
      showToast('Session proposal declined.', 'info');
      handleSessionUpdated(data.session);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to decline proposal.');
    } finally {
      setActionProcessingId(null);
    }
  };

  const formatDateDisplay = (dateString, durationMinutes) => {
    try {
      const d = new Date(dateString);
      const datePart = d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      const timePart = d.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit'
      });
      return `${datePart} • ${timePart} (${durationMinutes} mins)`;
    } catch {
      return 'Date to be scheduled';
    }
  };

  return (
    <div className="content-wrapper" style={{ maxWidth: '1100px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#111111', margin: 0 }}>
            Learning Sessions
          </h1>
          <p style={{ color: '#6B7280', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
            Plan, coordinate, and review your peer tutoring exchanges with verified campus peers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('connections')}
          style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: '#000000',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Calendar size={16} />
          <span>Schedule with a Connection</span>
        </button>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 18px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'pending', label: 'Proposals' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled & Declined' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#000000' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#4B5563',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search filter */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9CA3AF'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, skill, student..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '10px',
              border: '1px solid rgba(0, 0, 0, 0.12)',
              background: '#FFFFFF',
              fontSize: '0.85rem',
              color: '#111111'
            }}
          />
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div
          style={{
            marginBottom: '20px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchSessions(activeTab)}
            style={{
              background: 'transparent',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#991B1B',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#6B7280' }}>
          <div
            style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '3px solid rgba(0, 0, 0, 0.1)',
              borderTopColor: '#000000',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '12px'
            }}
          />
          <div style={{ fontSize: '0.9rem' }}>Loading sessions...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredSessions.length === 0 ? (
        /* Empty state */
        <div
          className="glass-panel"
          style={{
            padding: '50px 24px',
            textAlign: 'center',
            borderRadius: '20px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#6B7280'
            }}
          >
            <Calendar size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111111', margin: '0 0 6px 0' }}>
            {activeTab === 'upcoming' && 'No Upcoming Sessions'}
            {activeTab === 'pending' && 'No Pending Proposals'}
            {activeTab === 'completed' && 'No Completed Sessions Yet'}
            {activeTab === 'cancelled' && 'No Cancelled Sessions'}
          </h3>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 20px' }}>
            {activeTab === 'upcoming' &&
              'Connect with other campus students and propose a peer learning session to get started.'}
            {activeTab === 'pending' &&
              'Proposals from your connections or ones you requested will appear here for review.'}
            {activeTab === 'completed' &&
              'Completed sessions and accumulated exchange hours will be safely recorded here.'}
            {activeTab === 'cancelled' &&
              'Declined or cancelled session invitations will be listed here.'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              background: '#000000',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.85rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Discover Students
          </button>
        </div>
      ) : (
        /* Sessions Grid */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          {filteredSessions.map((s) => {
            const isTeacher = s.teacher?.id === currentUserId || s.teacher === currentUserId;
            const isMyProposal = s.proposedBy === currentUserId || s.isMyProposal;
            const partner = s.partner || (isTeacher ? s.learner : s.teacher);

            return (
              <div
                key={s.id}
                className="glass-panel glass-panel-hover"
                onClick={() => setSelectedSessionForDetails(s)}
                style={{
                  padding: '20px 24px',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* Top Row: Title, Skill, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: isTeacher ? '#FEF3C7' : '#E0E7FF',
                          color: isTeacher ? '#92400E' : '#3730A3',
                          textTransform: 'uppercase'
                        }}
                      >
                        {isTeacher ? 'You are Teaching' : 'You are Learning'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.06)',
                          color: '#374151'
                        }}
                      >
                        {s.skillName}
                      </span>
                      {s.rescheduleProposal && s.status === 'confirmed' && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: '#FFFBEB',
                            color: '#B45309',
                            border: '1px solid #FDE68A'
                          }}
                        >
                          Reschedule Requested
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111111', margin: 0 }}>
                      {s.title}
                    </h3>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {s.status === 'confirmed' && (
                      <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#DCFCE7', color: '#166534', fontWeight: 600, fontSize: '0.78rem' }}>
                        Confirmed
                      </span>
                    )}
                    {s.status === 'proposed' && (
                      <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#FEF9C3', color: '#854D0E', fontWeight: 600, fontSize: '0.78rem' }}>
                        {isMyProposal ? 'Proposal Sent' : 'Awaiting Response'}
                      </span>
                    )}
                    {s.status === 'completed' && (
                      <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#E0E7FF', color: '#3730A3', fontWeight: 600, fontSize: '0.78rem' }}>
                        Completed ({s.durationMinutes}m)
                      </span>
                    )}
                    {(s.status === 'declined' || s.status === 'cancelled') && (
                      <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#FEE2E2', color: '#991B1B', fontWeight: 600, fontSize: '0.78rem' }}>
                        {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Info Row: Date/Time + Partner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#4B5563'
                      }}
                    >
                      <Clock size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111111' }}>
                        {formatDateDisplay(s.startTime, s.durationMinutes)}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#6B7280' }}>
                        Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone || s.timezone || 'UTC'}
                      </div>
                    </div>
                  </div>

                  {/* Partner Avatar & Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={partner?.avatar || './avatars/default_avatar.svg'}
                      onError={(e) => { e.currentTarget.src = './avatars/default_avatar.svg'; }}
                      alt={partner?.name}
                      style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#111111' }}>
                        {partner?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {partner?.department}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div
                  style={{
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {s.conversationId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDiscussion(s.conversationId, partner);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          color: '#374151',
                          fontWeight: 500,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <MessageSquare size={13} />
                        <span>Discussion</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSessionForDetails(s);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(0, 0, 0, 0.12)',
                        color: '#374151',
                        fontWeight: 500,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <BookOpen size={13} />
                      <span>Details & Notes</span>
                    </button>
                  </div>

                  {/* Conditional Quick Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {s.status === 'proposed' && !isMyProposal && (
                      <>
                        <button
                          type="button"
                          disabled={actionProcessingId === (s.id || s._id)}
                          onClick={(e) => handleQuickAccept(e, s)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: '#000000',
                            color: '#FFFFFF',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: actionProcessingId === (s.id || s._id) ? 'not-allowed' : 'pointer',
                            opacity: actionProcessingId === (s.id || s._id) ? 0.6 : 1
                          }}
                        >
                          {actionProcessingId === (s.id || s._id) ? 'Accepting...' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          disabled={actionProcessingId === (s.id || s._id)}
                          onClick={(e) => handleQuickDecline(e, s)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: '#FFFFFF',
                            color: '#DC2626',
                            border: '1px solid rgba(220, 38, 38, 0.3)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: actionProcessingId === (s.id || s._id) ? 'not-allowed' : 'pointer',
                            opacity: actionProcessingId === (s.id || s._id) ? 0.6 : 1
                          }}
                        >
                          {actionProcessingId === (s.id || s._id) ? 'Declining...' : 'Decline'}
                        </button>
                      </>
                    )}

                    {s.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRescheduleSessionTarget(s);
                          setIsRescheduleOpen(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          color: '#111111',
                          fontWeight: 500,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <RotateCcw size={12} />
                        <span>Reschedule</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details & Notes Modal */}
      {selectedSessionForDetails && (
        <SessionDetailsModal
          isOpen={Boolean(selectedSessionForDetails)}
          onClose={() => setSelectedSessionForDetails(null)}
          session={selectedSessionForDetails}
          currentUser={currentUser}
          onOpenDiscussion={onOpenDiscussion}
          onOpenReschedule={(sess) => {
            setSelectedSessionForDetails(null);
            setRescheduleSessionTarget(sess);
            setIsRescheduleOpen(true);
          }}
          onSessionUpdated={handleSessionUpdated}
        />
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && rescheduleSessionTarget && (
        <ScheduleSessionModal
          isOpen={isRescheduleOpen}
          mode="reschedule"
          session={rescheduleSessionTarget}
          currentUser={currentUser}
          onClose={() => {
            setIsRescheduleOpen(false);
            setRescheduleSessionTarget(null);
          }}
          onSessionScheduled={(updatedSession) => {
            handleSessionUpdated(updatedSession);
            setIsRescheduleOpen(false);
            setRescheduleSessionTarget(null);
          }}
        />
      )}
    </div>
  );
}


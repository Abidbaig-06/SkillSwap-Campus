import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import StatsCard from '../components/StatsCard';
import StudentCard from '../components/StudentCard';
import {
  Award,
  Compass,
  Clock,
  ShieldCheck,
  Zap,
  Info,
  Plus,
  ArrowRight,
  Layers,
  Sparkles,
  Calendar,
  Activity,
  Users,
  TrendingUp,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { presentationSteps } from '../data/mockData';

export default function Dashboard({
  currentUser,
  students = [],
  campusStats = null,
  personalStats = null,
  upcomingSessions = [],
  onNavigate,
  onSelectStudent,
  onConnectStudent,
  onOpenAddSkill,
  onOpenDiscussion = () => {}
}) {
  const [matchFilter, setMatchFilter] = useState('all'); // 'all', 'high_synergy', 'cross_dept', 'same_dept'
  const [showPresentationGuide, setShowPresentationGuide] = useState(false);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Filter students based on algorithm tab
  const getFilteredStudents = () => {
    const sorted = [...students].sort(
      (a, b) => (b.matchPercent || 0) - (a.matchPercent || 0)
    );

    if (matchFilter === 'high_synergy') {
      return sorted.filter((s) => (s.matchPercent || 0) >= 80);
    }
    if (matchFilter === 'cross_dept') {
      return sorted.filter(
        (s) => s.department && s.department !== currentUser?.department
      );
    }
    if (matchFilter === 'same_dept') {
      return sorted.filter(
        (s) => s.department && s.department === currentUser?.department
      );
    }
    return sorted;
  };

  const filteredStudents = getFilteredStudents();

  const realPeersCount = students.filter((s) => !s.isDemo).length;
  const demoGuidesCount = students.filter((s) => s.isDemo).length;

  const currentUserId = currentUser?.id || currentUser?._id;

  const formatSessionTime = (dateString, durationMinutes) => {
    try {
      const d = new Date(dateString);
      const datePart = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${datePart} • ${timePart} (${durationMinutes} mins)`;
    } catch {
      return 'Scheduled Time';
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px 64px 24px' }}>
      {/* Top Greeting & Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '28px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '3px 9px',
                borderRadius: '999px',
                backgroundColor: '#111111',
                color: '#FFFFFF'
              }}
            >
              <Zap size={11} fill="#FFFFFF" />
              Campus Peer Hub
            </span>
            <span style={{ fontSize: '0.8rem', color: '#6B6B6B' }}>
              {currentUser?.department || 'Engineering'} • {currentUser?.year || '1st Year'}
            </span>
          </div>

          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: '#000000',
              margin: '0 0 6px 0',
              lineHeight: 1.15
            }}
          >
            {getGreetingTime()}, {currentUser?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#666666', margin: 0, maxWidth: '620px' }}>
            Your peer-to-peer knowledge bank is active. You have <strong>{currentUser?.skillsTeaching?.length || 0} teaching {currentUser?.skillsTeaching?.length === 1 ? 'skill' : 'skills'}</strong> listed in the campus database.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowPresentationGuide(!showPresentationGuide)}
            className="btn btn-secondary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: showPresentationGuide ? '#111111' : '#FFFFFF',
              color: showPresentationGuide ? '#FFFFFF' : '#111111',
              border: '1px solid rgba(0,0,0,0.12)'
            }}
          >
            <Info size={14} />
            {showPresentationGuide ? 'Hide Board Guide' : 'Board Presentation Guide'}
          </button>

          <button
            type="button"
            onClick={onOpenAddSkill}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={15} />
            Add Skill
          </button>

          <button
            type="button"
            onClick={() => onNavigate('sessions')}
            className="btn btn-secondary btn-sm"
          >
            <Calendar size={15} />
            Sessions
          </button>

          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="btn btn-primary btn-sm"
          >
            <Compass size={15} />
            Discover Peers
          </button>
        </div>
      </div>

      {/* Presentation Mode Callout Card (Visible when toggled) */}
      {showPresentationGuide && (
        <GlassCard
          style={{
            padding: '24px 28px',
            marginBottom: '32px',
            backgroundColor: '#111111',
            color: '#FFFFFF',
            border: '1px solid #333333',
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Layers size={16} color="#FFFFFF" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                Whiteboard Presentation Cheat Sheet (For Evaluators & Faculty)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowPresentationGuide(false)}
              style={{ background: 'transparent', border: 'none', color: '#888888', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Close
            </button>
          </div>

          <p style={{ fontSize: '0.85rem', color: '#AAAAAA', margin: '0 0 16px 0', lineHeight: 1.5 }}>
            Key architecture points to highlight when demonstrating the SkillSwap Campus peer-to-peer exchange platform:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.825rem', color: '#DDDDDD' }}>
            {presentationSteps.map((step, idx) => (
              <div key={idx} style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>
                  {step.step}: {step.title}
                </div>
                <p style={{ margin: 0, color: '#CCCCCC' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 4 Core Metric Stats Cards (Truthful Counts from MongoDB) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '18px',
          marginBottom: '28px'
        }}
      >
        <StatsCard
          title="Skills I Share"
          value={personalStats?.skillsShared ?? currentUser?.skillsTeaching?.length ?? 0}
          subtitle={
            (currentUser?.skillsTeaching || []).slice(0, 2).map((s) => s.name).join(', ') || 'No teaching skills yet'
          }
          icon={Award}
          onClick={() => onNavigate('my-skills')}
        />
        <StatsCard
          title="Skills I'm Learning"
          value={personalStats?.skillsLearning ?? currentUser?.skillsLearning?.length ?? 0}
          subtitle={
            (currentUser?.skillsLearning || []).slice(0, 2).map((s) => s.name).join(', ') || 'No learning goals yet'
          }
          icon={Compass}
          onClick={() => onNavigate('my-skills')}
        />
        <StatsCard
          title="Exchange Hours"
          value={`${personalStats?.totalExchangeHours ?? 0.0} hrs`}
          subtitle={`${personalStats?.teachingHours ?? 0}h teaching • ${personalStats?.learningHours ?? 0}h learning`}
          icon={Clock}
          onClick={() => onNavigate('sessions')}
        />
        <StatsCard
          title="Peer Reputation"
          value="5.0 ★"
          subtitle="Verified campus profile"
          icon={ShieldCheck}
          onClick={() => onNavigate('settings')}
        />
      </div>

      {/* Campus Community Scope Card */}
      <GlassCard
        style={{
          padding: '22px 28px',
          marginBottom: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '24px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.08)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B6B6B', marginBottom: '4px' }}>
            Campus Community Overview
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#111111' }}>
            {campusStats?.realStudentsCount ?? realPeersCount} Registered Classmates • {campusStats?.demoStudentsCount ?? demoGuidesCount} Guided Demo Mentors
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#666666', margin: '4px 0 0 0' }}>
            {campusStats?.skillsOfferedCount ?? 0} distinct skills offered across {campusStats?.departmentsCount ?? 0} academic departments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('discover')}
          className="btn btn-secondary btn-sm"
        >
          Explore All Peers
          <ArrowRight size={14} />
        </button>
      </GlassCard>

      {/* Upcoming Peer Sessions (Live Confirmed Records from MongoDB) */}
      <div style={{ marginBottom: '46px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#111111" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#111111', margin: 0 }}>
                Scheduled Peer Learning Sessions
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666666', margin: '4px 0 0 0' }}>
              Confirmed peer tutoring meetups and shared study dialogues.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('sessions')}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <span>View All Sessions</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {upcomingSessions && upcomingSessions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {upcomingSessions.map((session) => {
              const isTeacher = session.teacher?.id === currentUserId || session.teacher === currentUserId;
              const partner = session.partner || (isTeacher ? session.learner : session.teacher);

              return (
                <GlassCard
                  key={session.id || session._id}
                  style={{
                    padding: '20px 22px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          padding: '2px 8px',
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
                          fontSize: '0.725rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.05)',
                          color: '#4B5563'
                        }}
                      >
                        {session.skillName}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px 0', color: '#111111' }}>
                      {session.title}
                    </h4>

                    <div style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                      <Clock size={13} />
                      <span>{formatSessionTime(session.startTime, session.durationMinutes)}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <img
                        src={partner?.avatar || './avatars/default_avatar.svg'}
                        onError={(e) => { e.currentTarget.src = './avatars/default_avatar.svg'; }}
                        alt={partner?.name}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111111' }}>
                          {partner?.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {partner?.department}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
                    {session.conversationId && (
                      <button
                        type="button"
                        onClick={() => onOpenDiscussion(session.conversationId, partner)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <MessageSquare size={13} />
                        <span>Chat</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate('sessions')}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <span>Manage</span>
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        ) : (
          <GlassCard style={{ padding: '36px 24px', textAlign: 'center', backgroundColor: '#FFFFFF', color: '#666666' }}>
            <Calendar size={32} color="#999999" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#111111', margin: '0 0 4px 0' }}>
              No upcoming sessions scheduled yet
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#666666', maxWidth: '440px', margin: '0 auto 16px auto' }}>
              Connect with classmates, send a session proposal, or view pending invitations on your Sessions page!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => onNavigate('sessions')}
                className="btn btn-secondary btn-sm"
              >
                Go to Sessions
              </button>
              <button
                type="button"
                onClick={() => onNavigate('connections')}
                className="btn btn-primary btn-sm"
              >
                Schedule with a Connection
              </button>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Reciprocal Matching Algorithm & Peer Recommendations */}
      <div style={{ marginBottom: '48px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#6B6B6B',
                marginBottom: '4px'
              }}
            >
              <Sparkles size={13} color="#111111" />
              Two-Way Reciprocal Matching Algorithm
            </div>
            <h2
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: '#111111',
                margin: 0
              }}
            >
              Recommended Learning Partners
            </h2>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Ranked' },
              { id: 'high_synergy', label: 'High Synergy (80%+)' },
              { id: 'cross_dept', label: 'Cross-Department' },
              { id: 'same_dept', label: 'Same Major' }
            ].map((tab) => {
              const active = matchFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMatchFilter(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: '1px solid',
                    borderColor: active ? '#000000' : 'rgba(0, 0, 0, 0.08)',
                    backgroundColor: active ? '#000000' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#444444',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Peer Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '20px'
          }}
        >
          {filteredStudents.slice(0, 6).map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onSelect={onSelectStudent}
              onConnect={onConnectStudent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

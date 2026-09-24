import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import StatsCard from '../components/StatsCard';
import StudentCard from '../components/StudentCard';
import {
  BookOpen,
  Compass,
  Users,
  Award,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Zap,
  BarChart3,
  Info,
  ChevronRight,
  ShieldCheck,
  Layers,
  Flame,
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import { upcomingSessions, campusActivityFeed, trendingCampusDemands } from '../data/mockData';

export default function Dashboard({
  currentUser,
  students = [],
  onNavigate,
  onSelectStudent,
  onConnectStudent,
  onOpenAddSkill
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
      return sorted.filter((s) => (s.matchPercent || 0) >= 95);
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

  // Weekly milestone metrics
  const weeklyGoalMet = currentUser?.stats?.weeklyGoalMet ?? 3;
  const weeklyGoalTotal = currentUser?.stats?.weeklyGoalTotal ?? 4;
  const weeklyPercent = Math.min(100, Math.round((weeklyGoalMet / weeklyGoalTotal) * 100));

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
              {currentUser?.department || 'Engineering'} • {currentUser?.year || '3rd Year'}
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
            Your peer-to-peer knowledge bank is active. You have <strong>3 teaching skills</strong> listed and <strong>1 exchange session</strong> scheduled for tomorrow.
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
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF'
              }}
            >
              Key Talking Points
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              fontSize: '0.85rem',
              color: '#CCCCCC',
              lineHeight: 1.5
            }}
          >
            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>1. Zero-Cost Time-Banking</span>
              </div>
              <p style={{ margin: 0 }}>
                1 hour taught = 1 hour learned. Eliminates financial friction and democratizes academic mentorship on campus.
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>2. Reciprocal Match Algorithm</span>
              </div>
              <p style={{ margin: 0 }}>
                Calculates synergy percentage by cross-matching Student A's teaching skills with Student B's learning wishlist.
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>3. In-Person Campus Logistics</span>
              </div>
              <p style={{ margin: 0 }}>
                Sessions are physically anchored to safe campus zones (Central Library, IT Labs, Department Lounges).
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, color: '#FFFFFF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>4. Verified Peer Accountability</span>
              </div>
              <p style={{ margin: 0 }}>
                Double-blind peer reviews, attendance verification, and reputation scores prevent no-shows and ensure quality.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* 4 Core Metric Stats Cards */}
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
          value={currentUser?.skillsTeaching?.length ?? 3}
          subtitle="React, JavaScript, UI Design"
          icon={Award}
          onClick={() => onNavigate('my-skills')}
        />
        <StatsCard
          title="Skills I'm Learning"
          value={currentUser?.skillsLearning?.length ?? 3}
          subtitle="Photography, Video, DSA"
          icon={Compass}
          onClick={() => onNavigate('my-skills')}
        />
        <StatsCard
          title="Exchange Hours"
          value={currentUser?.stats?.hoursCompleted ?? '24.5'}
          subtitle="12 verified peer sessions"
          icon={Clock}
          onClick={() => onNavigate('connections')}
        />
        <StatsCard
          title="Peer Reputation"
          value={`${currentUser?.stats?.reputation ?? 4.9} ★`}
          subtitle="Based on 14 student reviews"
          icon={ShieldCheck}
          onClick={() => onNavigate('settings')}
        />
      </div>

      {/* Weekly Learning Goal & Milestone Banner */}
      <GlassCard
        style={{
          padding: '24px 28px',
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
        <div style={{ flex: '1 1 380px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#6B6B6B'
              }}
            >
              Gamified Weekly Goal
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'rgba(0,0,0,0.06)',
                color: '#111111'
              }}
            >
              Week 4 • Semester 5
            </span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: '#111111' }}>
            Weekly Milestone: {weeklyGoalMet} of {weeklyGoalTotal} Sessions Completed ({weeklyPercent}%)
          </h3>

          <p style={{ fontSize: '0.85rem', color: '#666666', margin: '0 0 14px 0' }}>
            Complete 1 more peer exchange this week to unlock the <strong>Senior Campus Mentor</strong> recognition badge.
          </p>

          {/* Progress Bar */}
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#EAEAEA',
              borderRadius: '999px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${weeklyPercent}%`,
                height: '100%',
                backgroundColor: '#111111',
                borderRadius: '999px',
                transition: 'width 0.5s ease-in-out'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '12px 18px',
              borderRadius: '10px',
              backgroundColor: '#F7F7F5',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111111' }}>
              75%
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#777777', textTransform: 'uppercase' }}>
              Pace Target
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              padding: '12px 18px',
              borderRadius: '10px',
              backgroundColor: '#F7F7F5',
              border: '1px solid rgba(0,0,0,0.06)'
            }}
          >
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111111' }}>
              +3.5h
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#777777', textTransform: 'uppercase' }}>
              This Week
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('my-skills')}
            className="btn btn-secondary btn-sm"
            style={{ whiteSpace: 'nowrap' }}
          >
            Manage Goals
            <ArrowRight size={14} />
          </button>
        </div>
      </GlassCard>

      {/* Upcoming Peer Sessions with Campus Logistics */}
      <div style={{ marginBottom: '46px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="#111111" />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#111111', margin: 0 }}>
                Upcoming Peer Exchange Sessions
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666666', margin: '4px 0 0 0' }}>
              In-person campus meetups scheduled with verified peers.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', color: '#888888' }}>
              {upcomingSessions.length} sessions scheduled
            </span>
            <button
              type="button"
              onClick={() => onNavigate('messages')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.82rem' }}
            >
              View Chat Threads
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '18px'
          }}
        >
          {upcomingSessions.map((sess) => {
            const partnerName = sess.partner || sess.peerName;
            const partnerAvatar = sess.avatar || sess.peerAvatar;
            const sessionTopic = sess.topic || sess.skill;
            const sessionLocation = sess.room || sess.location;

            return (
              <GlassCard
                key={sess.id}
                style={{
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                <div>
                  {/* Card Header: Partner & Type */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={partnerAvatar}
                        alt={partnerName}
                        className="avatar"
                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                          {partnerName}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: '#666666', margin: '2px 0 0 0' }}>
                          {sess.department || 'Student Peer'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: sess.status === 'Confirmed' ? '#111111' : '#F0F0EE',
                          color: sess.status === 'Confirmed' ? '#FFFFFF' : '#111111'
                        }}
                      >
                        {sess.status || 'Confirmed'}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#888888' }}>
                        {sess.type || 'Exchange'}
                      </span>
                    </div>
                  </div>

                  {/* Topic / Skill Swapped */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#F7F7F5',
                      marginBottom: '14px',
                      border: '1px solid rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#777777', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Topic & Synergy Focus
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111111' }}>
                      {sessionTopic}
                    </div>
                    {sess.agenda && (
                      <div style={{ fontSize: '0.78rem', color: '#555555', marginTop: '4px', lineHeight: 1.35 }}>
                        "{sess.agenda}"
                      </div>
                    )}
                  </div>

                  {/* Venue & Time Logistics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#555555' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={13} color="#111111" />
                      <span>{sess.date} {sess.time ? `(${sess.time})` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={13} color="#111111" />
                      <span style={{ fontWeight: 600, color: '#111111' }}>{sessionLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => onNavigate('messages')}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    Open Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const peerObj = students.find((s) => s.name === partnerName);
                      if (peerObj) onSelectStudent(peerObj);
                      else onNavigate('students');
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                  >
                    View Peer
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
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
                letterSpacing: '0.08em',
                color: '#666666',
                marginBottom: '4px'
              }}
            >
              <Sparkles size={13} />
              Reciprocal Matching Engine
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#111111', margin: 0 }}>
              Recommended Peer Matches
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#666666', marginTop: '4px' }}>
              Peers who teach what you want to learn, and want what you can teach.
            </p>
          </div>

          {/* Algorithm Filter Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#EFEFEA',
              padding: '3px',
              borderRadius: '8px',
              gap: '2px'
            }}
          >
            {[
              { id: 'all', label: 'All Matches' },
              { id: 'high_synergy', label: 'High Synergy (95%+)' },
              { id: 'same_dept', label: 'Same Dept (CSE)' },
              { id: 'cross_dept', label: 'Cross-Disciplinary' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMatchFilter(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: matchFilter === tab.id ? 700 : 500,
                  backgroundColor: matchFilter === tab.id ? '#FFFFFF' : 'transparent',
                  color: matchFilter === tab.id ? '#111111' : '#666666',
                  cursor: 'pointer',
                  boxShadow: matchFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm Math Callout Bar */}
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255,255,255,0.7)',
            border: '1px dashed rgba(0,0,0,0.14)',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              %
            </div>
            <div>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#111111' }}>
                Synergy Formula:
              </span>{' '}
              <span style={{ fontSize: '0.82rem', color: '#555555' }}>
                Match(My Teachable Skills ∩ Peer's Desired Skills) + Match(My Desired Skills ∩ Peer's Teachable Skills)
              </span>
            </div>
          </div>

          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#111111' }}>
            Showing {filteredStudents.slice(0, 6).length} of {students.length} campus peers
          </span>
        </div>

        {/* Recommended Students Grid */}
        {filteredStudents.length === 0 ? (
          <GlassCard style={{ padding: '40px 24px', textAlign: 'center', backgroundColor: '#FFFFFF' }}>
            <Users size={32} color="#888888" style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111111', margin: '0 0 6px 0' }}>
              No peers match this filter
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#666666', margin: '0 0 16px 0' }}>
              Try selecting "All Matches" to see every student mentor on campus.
            </p>
            <button
              type="button"
              onClick={() => setMatchFilter('all')}
              className="btn btn-secondary btn-sm"
            >
              Reset Filter
            </button>
          </GlassCard>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '22px'
            }}
          >
            {filteredStudents.slice(0, 6).map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onViewProfile={() => onSelectStudent(student)}
                onConnect={() => onConnectStudent(student)}
                showMatch={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lower Section: 2-Column Split (Live Campus Activity + Demand Radar) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Left Column: Live Campus Activity Pulse */}
        <GlassCard
          style={{
            padding: '26px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#111111',
                  animation: 'pulse 1.8s infinite'
                }}
              />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#111111' }}>
                Live Campus Exchange Pulse
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B6B6B' }}>
              Real-time activity
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {campusActivityFeed.map((act) => (
              <div
                key={act.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#F7F7F5',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                  <img
                    src={act.avatar1}
                    alt={act.user1}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #FFFFFF'
                    }}
                  />
                  {act.avatar2 && (
                    <img
                      src={act.avatar2}
                      alt={act.user2}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1.5px solid #FFFFFF'
                      }}
                    />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', color: '#111111', lineHeight: 1.4 }}>
                    <strong>{act.user1}</strong> {act.action} <strong>{act.user2}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: '#EAEAEA',
                        color: '#111111',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {act.skill}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#888888' }}>
                      {act.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="btn btn-outline btn-sm"
            style={{ width: '100%', marginTop: '16px' }}
          >
            Explore All Campus Exchanges
            <ArrowRight size={13} />
          </button>
        </GlassCard>

        {/* Right Column: Campus Skill Demand Radar */}
        <GlassCard
          style={{
            padding: '26px',
            backgroundColor: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#111111" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#111111' }}>
                Campus In-Demand Skills Radar
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B6B6B' }}>
              Highest student demand
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {trendingCampusDemands.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#F7F7F5',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: index === 0 ? '#111111' : '#EAEAEA',
                      color: index === 0 ? '#FFFFFF' : '#333333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#111111' }}>
                      {item.skill}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#666666' }}>
                      {item.seekersCount} students requesting • {item.mentorsCount} active mentors
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#111111',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#EAEAEA',
                      display: 'inline-block'
                    }}
                  >
                    {item.growth}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenAddSkill}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '16px' }}
          >
            Teach One of These Skills
            <Plus size={13} />
          </button>
        </GlassCard>
      </div>
    </div>
  );
}

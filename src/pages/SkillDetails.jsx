import React, { useState, useMemo } from 'react';
import GlassCard from '../components/GlassCard';
import StudentCard from '../components/StudentCard';
import { ArrowLeft, Users, Filter } from 'lucide-react';

export default function SkillDetails({
  skill,
  students = [],
  onBack,
  onSelectStudent,
  onConnectStudent
}) {
  const [levelFilter, setLevelFilter] = useState('All');

  // Filter students who teach this skill from real MongoDB student list
  const instructors = useMemo(() => {
    if (!skill) return [];
    const skillKeyword = (skill.slug || skill.title || '').toLowerCase().trim();

    return students.filter((student) => {
      const teachesSkill = student.canTeach?.some((s) => {
        const name = (typeof s === 'string' ? s : (s.skill || s.name || '')).toLowerCase().trim();
        return name === skillKeyword || name.includes(skillKeyword) || skillKeyword.includes(name);
      });

      if (!teachesSkill) return false;

      if (levelFilter !== 'All') {
        const matchingSkillObj = student.canTeach.find((s) => {
          const name = (typeof s === 'string' ? s : (s.skill || s.name || '')).toLowerCase().trim();
          return name === skillKeyword || name.includes(skillKeyword) || skillKeyword.includes(name);
        });
        if (matchingSkillObj && typeof matchingSkillObj === 'object') {
          return matchingSkillObj.level === levelFilter;
        }
      }

      return true;
    });
  }, [skill, levelFilter, students]);

  if (!skill) {
    return (
      <div style={{ padding: '60px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No skill selected.</p>
        <button type="button" onClick={onBack} className="btn btn-secondary" style={{ marginTop: '14px' }}>
          Go back to Discover
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px 80px 24px' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: '24px', paddingLeft: 0 }}
      >
        <ArrowLeft size={16} />
        Back to Discover Skills
      </button>

      {/* Main Skill Header Hero Card */}
      <GlassCard
        style={{
          padding: '36px 32px',
          borderRadius: '24px',
          marginBottom: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              padding: '2px 8px',
              borderRadius: '6px'
            }}
          >
            {skill.category || 'Programming'}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>
            Campus Peer Directory
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            margin: '0 0 16px 0',
            color: '#111111'
          }}
        >
          {skill.title}
        </h1>

        <p style={{ fontSize: '1.05rem', color: '#555555', maxWidth: '720px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
          {skill.description || `Connect with fellow students teaching ${skill.title} across campus departments.`}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="#666666" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111111' }}>
              {instructors.length} active {instructors.length === 1 ? 'mentor' : 'mentors'}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666666' }}>
            Level Range: <strong>{skill.levelRange || 'All levels'}</strong>
          </div>
        </div>
      </GlassCard>

      {/* Instructors Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#111111', letterSpacing: '-0.02em' }}>
            Campus Mentors Teaching {skill.title} ({instructors.length})
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#666666', margin: '4px 0 0 0' }}>
            Students offering to exchange their mastery in this discipline.
          </p>
        </div>

        {/* Level Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="#666666" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#666666' }}>Proficiency:</span>
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(lvl)}
              style={{
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: levelFilter === lvl ? 700 : 500,
                backgroundColor: levelFilter === lvl ? '#111111' : 'rgba(0, 0, 0, 0.04)',
                color: levelFilter === lvl ? '#FFFFFF' : '#555555',
                cursor: 'pointer'
              }}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Instructors Grid */}
      {instructors.length === 0 ? (
        <GlassCard style={{ padding: '60px 20px', textAlign: 'center', color: '#666666' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111111', margin: '0 0 6px 0' }}>
            No mentors found for "{skill.title}" at "{levelFilter}" level.
          </p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            Try switching to 'All' levels or check back as more students join campus.
          </p>
        </GlassCard>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}
        >
          {instructors.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onViewProfile={() => onSelectStudent && onSelectStudent(student)}
              onConnect={() => onConnectStudent && onConnectStudent(student)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

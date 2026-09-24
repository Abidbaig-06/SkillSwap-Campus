import React, { useState, useMemo } from 'react';
import GlassCard from '../components/GlassCard';
import StudentCard from '../components/StudentCard';
import SkillChip from '../components/SkillChip';
import { ArrowLeft, Users, Star, Sparkles, Filter } from 'lucide-react';
import { mockStudents } from '../data/mockData';

export default function SkillDetails({
  skill,
  onBack,
  onSelectStudent,
  onConnectStudent
}) {
  const [levelFilter, setLevelFilter] = useState('All');

  // Filter students who teach this skill
  const instructors = useMemo(() => {
    if (!skill) return [];
    const skillKeyword = skill.slug || skill.title.toLowerCase();

    return mockStudents.filter((student) => {
      const teachesSkill = student.canTeach.some((s) => {
        const name = (typeof s === 'string' ? s : s.name).toLowerCase();
        if (skillKeyword === 'react') return name.includes('react') || name.includes('javascript') || name.includes('frontend');
        if (skillKeyword === 'python') return name.includes('python') || name.includes('learning') || name.includes('data');
        if (skillKeyword === 'ui-ux') return name.includes('design') || name.includes('figma') || name.includes('ui');
        if (skillKeyword === 'photography') return name.includes('photography') || name.includes('lightroom');
        if (skillKeyword === 'video-editing') return name.includes('video') || name.includes('premiere');
        if (skillKeyword === 'public-speaking') return name.includes('speaking') || name.includes('debate');
        if (skillKeyword === 'financial-modeling') return name.includes('financial') || name.includes('excel');
        return name.includes(skillKeyword);
      });

      if (!teachesSkill) return false;

      if (levelFilter !== 'All') {
        const matchingSkillObj = student.canTeach.find((s) => {
          const name = (typeof s === 'string' ? s : s.name).toLowerCase();
          return name.includes(skillKeyword) || name.includes('react') || name.includes('python');
        });
        if (matchingSkillObj && typeof matchingSkillObj === 'object') {
          return matchingSkillObj.level === levelFilter;
        }
      }

      return true;
    });
  }, [skill, levelFilter]);

  if (!skill) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <p>No skill selected.</p>
        <button type="button" onClick={onBack} className="btn btn-secondary">
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
            {skill.category}
          </span>
          <span style={{ fontSize: '0.85rem', color: '#6B6B6B' }}>
            Campus Curriculum Verified
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#111111',
            marginBottom: '8px'
          }}
        >
          {skill.title}
        </h1>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '1rem',
            fontWeight: 700,
            color: '#111111',
            marginBottom: '16px'
          }}
        >
          <Users size={16} />
          {skill.teacherCount} students can teach this skill
        </div>

        <p style={{ fontSize: '1.05rem', color: '#4B4B4B', lineHeight: 1.6, maxWidth: '780px', marginBottom: '24px' }}>
          {skill.description}
        </p>

        {/* Tags */}
        {skill.tags && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skill.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  color: '#333333',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Section: Students Teaching This Skill */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.025em', color: '#111111' }}>
              Students Teaching {skill.title}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#666666', marginTop: '2px' }}>
              Connect with experienced peers for 1-on-1 walkthroughs and lab support.
            </p>
          </div>

          {/* Level Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#777777', fontWeight: 600 }}>
              Skill level:
            </span>
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
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#666666' }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              No students found at the "{levelFilter}" level.
            </p>
            <button
              type="button"
              onClick={() => setLevelFilter('All')}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '14px' }}
            >
              Show all skill levels
            </button>
          </div>
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
                onViewProfile={() => onSelectStudent(student)}
                onConnect={() => onConnectStudent(student)}
                showMatch={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

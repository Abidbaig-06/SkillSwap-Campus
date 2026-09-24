import React from 'react';
import GlassCard from '../components/GlassCard';
import SkillChip from '../components/SkillChip';
import { Plus, Trash2, Edit3, Compass, Users, Sparkles } from 'lucide-react';

export default function MySkills({
  currentUser,
  onOpenAddSkill,
  onRemoveTeachingSkill,
  onRemoveLearningSkill,
  onFindStudentsForSkill,
  showToast
}) {
  const teaching = currentUser?.skillsTeaching || [];
  const learning = currentUser?.skillsLearning || [];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 24px 100px 24px', position: 'relative' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '36px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: '#111111',
              marginBottom: '6px'
            }}
          >
            My Skills
          </h1>
          <p style={{ fontSize: '1rem', color: '#6B6B6B' }}>
            Manage the skills you share with campus and what you're currently aiming to learn.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddSkill}
          className="btn btn-primary"
          style={{ padding: '12px 22px' }}
        >
          <Plus size={16} />
          Add Skill
        </button>
      </div>

      {/* SECTION 1: I Can Teach */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#111111' }}>
              I Can Teach ({teaching.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#666666' }}>
              Skills displayed on your profile. Other students can request mentorship from you.
            </p>
          </div>
        </div>

        {teaching.length === 0 ? (
          <GlassCard style={{ padding: '40px', textAlign: 'center', color: '#666666' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>You haven't listed any teaching skills yet.</p>
            <button
              type="button"
              onClick={onOpenAddSkill}
              className="btn btn-primary btn-sm"
              style={{ marginTop: '14px' }}
            >
              <Plus size={14} />
              Add Teaching Skill
            </button>
          </GlassCard>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}
          >
            {teaching.map((skill) => (
              <GlassCard
                key={skill.id}
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                      {skill.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#111111',
                        color: '#FFFFFF',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {skill.level}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.825rem',
                      color: '#555555',
                      marginBottom: '20px'
                    }}
                  >
                    <Users size={14} />
                    <span>{skill.interestedCount ?? 12} people interested on campus</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => showToast(`Skill "${skill.name}" is updated.`)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit3 size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveTeachingSkill(skill.id);
                      showToast(`Removed "${skill.name}" from your teaching skills.`);
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#888888' }}
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: I Want to Learn */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#111111' }}>
              I Want to Learn ({learning.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#666666' }}>
              Skills we match you against when recommending campus learning partners.
            </p>
          </div>
        </div>

        {learning.length === 0 ? (
          <GlassCard style={{ padding: '40px', textAlign: 'center', color: '#666666' }}>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No learning interests added yet.</p>
            <button
              type="button"
              onClick={onOpenAddSkill}
              className="btn btn-primary btn-sm"
              style={{ marginTop: '14px' }}
            >
              <Plus size={14} />
              Add Learning Goal
            </button>
          </GlassCard>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}
          >
            {learning.map((skill) => (
              <GlassCard
                key={skill.id}
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                      {skill.name}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: '#EAEAE6',
                        color: '#111111',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {skill.level}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.825rem',
                      color: '#555555',
                      marginBottom: '20px'
                    }}
                  >
                    <Compass size={14} />
                    <span>{skill.availableStudents ?? 8} students available to teach</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onFindStudentsForSkill(skill)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Compass size={13} />
                    Find Students
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveLearningSkill(skill.id);
                      showToast(`Removed "${skill.name}" from your learning goals.`);
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#888888', padding: '6px 10px' }}
                    title="Remove skill"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Floating + Add Skill Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '36px',
          right: '36px',
          zIndex: 80
        }}
      >
        <button
          type="button"
          onClick={onOpenAddSkill}
          className="btn btn-primary btn-lg"
          style={{
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
            padding: '14px 24px',
            fontSize: '1rem',
            borderRadius: '9999px'
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          + Add Skill
        </button>
      </div>
    </div>
  );
}

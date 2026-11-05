import React, { useState, useMemo, useEffect } from 'react';
import SkillCard from '../components/SkillCard';
import StudentCard from '../components/StudentCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import { BookOpen, Users, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { skillCategories } from '../data/mockData';

export default function Discover({
  onSelectSkill,
  onSelectStudent,
  onConnectStudent,
  onOpenAddSkill,
  skills = [],
  students = [],
  loading = false,
  error = null,
  onRetry = null,
  initialCategory = 'All',
  initialMode = 'skills',
  initialSearch = ''
}) {
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [currentMode, setCurrentMode] = useState(null);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch || '');
    }
  }, [initialSearch]);

  const viewMode = currentMode || initialMode;
  const setViewMode = setCurrentMode;

  const categories = skillCategories;
  const levelOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesCategory =
        selectedCategory === 'All' || skill.category === selectedCategory;

      const matchesSearch =
        searchQuery === '' ||
        skill.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLevel =
        selectedLevel === 'All' ||
        skill.levelRange?.toLowerCase().includes(selectedLevel.toLowerCase());

      return matchesCategory && matchesSearch && matchesLevel;
    });
  }, [selectedCategory, searchQuery, selectedLevel, skills]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        searchQuery === '' ||
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.canTeach?.some((s) => {
          const sName = typeof s === 'string' ? s : (s.skill || s.name || '');
          return sName.toLowerCase().includes(searchQuery.toLowerCase());
        }) ||
        (student.wantsToLearn || student.wantToLearn)?.some((s) => {
          const sName = typeof s === 'string' ? s : (s.skill || s.name || '');
          return sName.toLowerCase().includes(searchQuery.toLowerCase());
        });

      const matchesCategory =
        selectedCategory === 'All' ||
        student.canTeach?.some((s) => {
          const sCat = typeof s === 'object' && s.category ? s.category : '';
          if (sCat && sCat === selectedCategory) return true;
          const sName = (typeof s === 'string' ? s : (s.skill || s.name || '')).toLowerCase();
          if (selectedCategory === 'Programming') return sName.includes('react') || sName.includes('python') || sName.includes('c++') || sName.includes('java') || sName.includes('git') || sName.includes('javascript') || sName.includes('sql') || sName.includes('web');
          if (selectedCategory === 'Design') return sName.includes('design') || sName.includes('figma') || sName.includes('canva') || sName.includes('cad') || sName.includes('3d');
          if (selectedCategory === 'Engineering') return sName.includes('cad') || sName.includes('printing') || sName.includes('matlab') || sName.includes('embedded') || sName.includes('iot');
          if (selectedCategory === 'Business') return sName.includes('financial') || sName.includes('pitch') || sName.includes('model');
          if (selectedCategory === 'Communication') return sName.includes('speaking') || sName.includes('presentation') || sName.includes('writing');
          return false;
        });

      return matchesSearch && matchesCategory;
    });
  }, [selectedCategory, searchQuery, students]);

  const realCount = filteredStudents.filter((s) => !s.isDemo).length;
  const demoCount = filteredStudents.filter((s) => s.isDemo).length;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 24px 80px 24px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#111111',
            marginBottom: '6px'
          }}
        >
          Discover Skills
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#6B6B6B' }}>
          Find students who can teach what you want to learn across all campus departments.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px' }}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search skills, students, or interests..."
        />
      </div>

      {/* Filter and Mode Control Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '32px',
          paddingBottom: '20px',
          borderBottom: '1px solid rgba(0, 0, 0, 0.07)'
        }}
      >
        {/* Category Pills */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888888', marginBottom: '8px' }}>
            Categories
          </div>
          <FilterBar
            options={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {/* Level Filters & Switch View */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#777777', marginRight: '4px' }}>
              Level:
            </span>
            {levelOptions.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: selectedLevel === lvl ? 700 : 500,
                  backgroundColor: selectedLevel === lvl ? '#111111' : 'rgba(0, 0, 0, 0.04)',
                  color: selectedLevel === lvl ? '#FFFFFF' : '#555555',
                  cursor: 'pointer'
                }}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Skills Grid vs Students Grid */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.05)',
              padding: '3px',
              borderRadius: '10px'
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('skills')}
              style={{
                border: 'none',
                background: viewMode === 'skills' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'skills' ? '#000000' : '#666666',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: viewMode === 'skills' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <BookOpen size={13} />
              Skills ({filteredSkills.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('students')}
              style={{
                border: 'none',
                background: viewMode === 'students' ? '#FFFFFF' : 'transparent',
                color: viewMode === 'students' ? '#000000' : '#666666',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: viewMode === 'students' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              <Users size={13} />
              Students ({filteredStudents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '16px',
            color: '#991B1B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={12} />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666' }}>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading campus directory from MongoDB...</p>
        </div>
      ) : (
        <>
          {/* Results Metadata Summary */}
          {viewMode === 'students' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px',
                fontSize: '0.825rem',
                color: '#666666'
              }}
            >
              <div>
                Showing <strong>{filteredStudents.length}</strong> campus learning partners (
                <strong>{realCount}</strong> registered peers, <strong>{demoCount}</strong> demo guides)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#888888' }}>
                Match scores derived from mutual skill synergy
              </div>
            </div>
          )}

          {/* Grid of Results */}
          {viewMode === 'skills' ? (
            filteredSkills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111111' }}>
                  {searchQuery ? 'No skills matched your search.' : 'No skills in campus directory yet.'}
                </p>
                <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                  {searchQuery
                    ? "Try selecting 'All' categories or changing your search terms."
                    : 'Be the first to share what you know with your campus community!'}
                </p>
                {onOpenAddSkill && (
                  <button
                    type="button"
                    onClick={onOpenAddSkill}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '16px' }}
                  >
                    + Add a Skill
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px'
                }}
              >
                {filteredSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onViewSkill={() => onSelectSkill && onSelectSkill(skill)}
                  />
                ))}
              </div>
            )
          ) : (
            filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666' }}>
                <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111111' }}>
                  {searchQuery ? 'No students found matching your criteria.' : 'No students found.'}
                </p>
                <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                  Try selecting 'All' categories or searching for a different skill or department.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px'
                }}
              >
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onViewProfile={() => onSelectStudent && onSelectStudent(student)}
                    onConnect={() => onConnectStudent && onConnectStudent(student)}
                  />
                ))}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

import React, { useState, useMemo, useEffect } from 'react';
import SkillCard from '../components/SkillCard';
import StudentCard from '../components/StudentCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import { BookOpen, Users } from 'lucide-react';
import { mockSkillsList, mockStudents } from '../data/mockData';

export default function Discover({
  onSelectSkill,
  onSelectStudent,
  onConnectStudent,
  onOpenAddSkill,
  skills = [],
  students = [],
  initialCategory = 'All',
  initialMode = 'skills'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [currentMode, setCurrentMode] = useState(null);

  // Derive viewMode directly from prop or user selection
  const viewMode = currentMode || initialMode;
  const setViewMode = setCurrentMode;

  const categories = [
    'All',
    'Programming',
    'Design',
    'Communication',
    'Photography',
    'Video',
    'Business',
    'Other'
  ];

  const levelOptions = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  // Filter skills
  const filteredSkills = useMemo(() => {
    const list = skills.length > 0 ? skills : mockSkillsList;
    return list.filter((skill) => {
      const matchesCategory =
        selectedCategory === 'All' || skill.category === selectedCategory;

      const matchesSearch =
        searchQuery === '' ||
        skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLevel =
        selectedLevel === 'All' ||
        skill.levelRange.toLowerCase().includes(selectedLevel.toLowerCase());

      return matchesCategory && matchesSearch && matchesLevel;
    });
  }, [selectedCategory, searchQuery, selectedLevel, skills]);

  // Filter students
  const filteredStudents = useMemo(() => {
    const list = students.length > 0 ? students : mockStudents;
    return list.filter((student) => {
      const matchesSearch =
        searchQuery === '' ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
          const sName = (typeof s === 'string' ? s : (s.skill || s.name || '')).toLowerCase();
          if (selectedCategory === 'Programming') return sName.includes('react') || sName.includes('python') || sName.includes('c++') || sName.includes('dsa') || sName.includes('java') || sName.includes('sql') || sName.includes('git') || sName.includes('javascript') || sName.includes('html');
          if (selectedCategory === 'Design') return sName.includes('design') || sName.includes('figma') || sName.includes('canva') || sName.includes('autocad') || sName.includes('3d') || sName.includes('graphic');
          if (selectedCategory === 'Photography') return sName.includes('photo');
          if (selectedCategory === 'Video') return sName.includes('video') || sName.includes('editing');
          if (selectedCategory === 'Communication') return sName.includes('speaking') || sName.includes('communication') || sName.includes('presentation');
          if (selectedCategory === 'Business') return sName.includes('financial') || sName.includes('pitch') || sName.includes('excel');
          return true;
        });

      return matchesSearch && matchesCategory;
    });
  }, [selectedCategory, searchQuery, students]);

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
          Find students who can teach what you want to learn.
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

      {/* Grid of Results */}
      {viewMode === 'skills' ? (
        filteredSkills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111111' }}>
              {searchQuery ? "No skills matched your search." : "No skills added to campus directory yet."}
            </p>
            <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
              {searchQuery ? "Try selecting 'All' categories or changing your search terms." : "Be the first to share what you know with your campus community!"}
            </p>
            {onOpenAddSkill && (
              <button
                type="button"
                onClick={onOpenAddSkill}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '16px' }}
              >
                + Add First Skill
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {filteredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onExplore={() => onSelectSkill(skill)}
              />
            ))}
          </div>
        )
      ) : (
        /* Students view */
        filteredStudents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111111' }}>
              {searchQuery ? "No students matched your search criteria." : "No students registered on campus yet."}
            </p>
            <p style={{ fontSize: '0.875rem', marginTop: '4px' }}>
              {searchQuery ? "Try searching for a different branch, skill, or name." : "Create your student profile to become the first pioneer on campus!"}
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
                onViewProfile={() => onSelectStudent(student)}
                onConnect={() => onConnectStudent(student)}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

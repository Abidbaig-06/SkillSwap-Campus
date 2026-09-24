import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import SkillChip from '../components/SkillChip';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Sparkles,
  User,
  GraduationCap,
  BookOpen,
  Camera,
  X
} from 'lucide-react';

export default function Signup({ onComplete, onNavigate, showToast }) {
  const [step, setStep] = useState(1);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [year, setYear] = useState('1st Year');
  const [selectedAvatar, setSelectedAvatar] = useState('./avatars/default_avatar.svg');

  const sampleAvatars = [
    './avatars/default_avatar.svg',
    './avatars/default_logo.svg',
    './avatars/lasya_bodapati.png',
    './avatars/rahul.png',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  ];

  // Step 2: Skills I Can Teach
  const [skillsTeach, setSkillsTeach] = useState([]);
  const [newTeachInput, setNewTeachInput] = useState('');
  const [newTeachLevel, setNewTeachLevel] = useState('Intermediate');

  const teachSuggestions = [
    'React', 'Python', 'Java', 'UI/UX', 'Photoshop',
    'Video Editing', 'Photography', 'Public Speaking', 'Git & GitHub', 'C++'
  ];

  // Step 3: Skills I Want to Learn
  const [skillsLearn, setSkillsLearn] = useState([]);
  const [newLearnInput, setNewLearnInput] = useState('');

  const learnSuggestions = [
    'Photography', 'Video Editing', 'Public Speaking', 'Machine Learning',
    'UI/UX Design', 'Figma Prototyping', 'Financial Modeling', 'Next.js'
  ];

  // Step 4: Short Bio
  const [bio, setBio] = useState('');

  const handleAddTeachSkill = (name, level = 'Intermediate') => {
    if (!name.trim()) return;
    if (skillsTeach.some((s) => s.name.toLowerCase() === name.trim().toLowerCase())) return;
    setSkillsTeach([...skillsTeach, { name: name.trim(), level }]);
    setNewTeachInput('');
  };

  const handleRemoveTeachSkill = (index) => {
    setSkillsTeach(skillsTeach.filter((_, idx) => idx !== index));
  };

  const handleAddLearnSkill = (name) => {
    if (!name.trim()) return;
    if (skillsLearn.some((s) => s.name.toLowerCase() === name.trim().toLowerCase())) return;
    setSkillsLearn([...skillsLearn, { name: name.trim(), level: 'Beginner' }]);
    setNewLearnInput('');
  };

  const handleRemoveLearnSkill = (index) => {
    setSkillsLearn(skillsLearn.filter((_, idx) => idx !== index));
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    const newProfile = {
      id: `user-${Date.now()}`,
      name: fullName,
      email,
      department,
      year,
      avatar: selectedAvatar,
      bio,
      skillsTeaching: skillsTeach.map((s, i) => ({
        id: `st-new-${i}`,
        name: s.name,
        level: s.level,
        interestedCount: Math.floor(Math.random() * 15) + 3,
        category: 'Programming'
      })),
      skillsLearning: skillsLearn.map((s, i) => ({
        id: `sl-new-${i}`,
        name: s.name,
        level: s.level,
        availableStudents: Math.floor(Math.random() * 20) + 5,
        category: 'Design'
      })),
      stats: {
        skillsTeachingCount: skillsTeach.length,
        skillsLearningCount: skillsLearn.length,
        connectionsCount: 0,
        sessionsCount: 0,
        reputation: 5.0,
        reviewsCount: 0
      }
    };

    onComplete(newProfile);
    showToast(`Profile created successfully! Welcome to SkillSwap Campus, ${fullName.split(' ')[0]}.`);
  };

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '40px 24px 80px 24px'
      }}
    >
      {/* Top Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          onClick={() => onNavigate('home')}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: '6px',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#000000' }}>
            SkillSwap
          </span>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              backgroundColor: '#111111',
              color: '#FFFFFF',
              padding: '2px 5px',
              borderRadius: '4px'
            }}
          >
            Campus
          </span>
        </div>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', color: '#111111' }}>
          Create Your Campus Profile
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#666666', marginTop: '4px' }}>
          Step {step} of 4 — Tell your campus what you can teach and what you want to learn
        </p>
      </div>

      {/* Progress Indicator: 01 ─── 02 ─── 03 ─── 04 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '36px',
          gap: '8px'
        }}
      >
        {[
          { num: '01', title: 'Basic Info' },
          { num: '02', title: 'Can Teach' },
          { num: '03', title: 'Want to Learn' },
          { num: '04', title: 'Bio & Preview' }
        ].map((item, idx) => {
          const stepNum = idx + 1;
          const isDone = step > stepNum;
          const isCurrent = step === stepNum;

          return (
            <React.Fragment key={item.num}>
              <div
                onClick={() => isDone && setStep(stepNum)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: isDone ? 'pointer' : 'default',
                  opacity: isCurrent || isDone ? 1 : 0.4
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? '#000000' : isDone ? '#EAEAE6' : '#FFFFFF',
                    color: isCurrent ? '#FFFFFF' : '#111111',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isDone ? <Check size={14} strokeWidth={2.5} /> : item.num}
                </div>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? '#000000' : '#666666',
                    display: 'none'
                  }}
                  className="step-title"
                >
                  {item.title}
                </span>
                <style>{`
                  @media (min-width: 600px) {
                    .step-title { display: inline !important; }
                  }
                `}</style>
              </div>

              {idx < 3 && (
                <div
                  style={{
                    width: '32px',
                    height: '2px',
                    backgroundColor: step > stepNum ? '#000000' : 'rgba(0, 0, 0, 0.12)'
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Main Glass Form Card */}
      <GlassCard
        style={{
          padding: '36px 32px',
          borderRadius: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              Step 1: Basic Information
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '24px' }}>
              Your campus identity so classmates know who they are connecting with.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '8px' }}>
                Select Profile Photo
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <img
                  src={selectedAvatar}
                  alt="Selected avatar"
                  className="avatar"
                  style={{ width: '64px', height: '64px', border: '3px solid #000000' }}
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {sampleAvatars.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Avatar option ${i + 1}`}
                      onClick={() => setSelectedAvatar(url)}
                      className="avatar"
                      style={{
                        width: '42px',
                        height: '42px',
                        cursor: 'pointer',
                        opacity: selectedAvatar === url ? 1 : 0.6,
                        border: selectedAvatar === url ? '2px solid #000000' : '1px solid rgba(0,0,0,0.1)',
                        transform: selectedAvatar === url ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ram"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                College Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student.name@campus.edu"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Design & Innovation">Design & Innovation</option>
                  <option value="Management Studies">Management Studies</option>
                  <option value="Biotechnology">Biotechnology</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                  Year of Study
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                Continue to Skills
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Skills I Can Teach */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              Step 2: Skills I Can Teach
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '22px' }}>
              Add skills you feel comfortable explaining or mentoring peers in.
            </p>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                value={newTeachInput}
                onChange={(e) => setNewTeachInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTeachSkill(newTeachInput, newTeachLevel);
                  }
                }}
                placeholder="Type a skill e.g. React, Python, Java..."
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <select
                value={newTeachLevel}
                onChange={(e) => setNewTeachLevel(e.target.value)}
                style={{
                  padding: '0 12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: '0.85rem'
                }}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <button
                type="button"
                onClick={() => handleAddTeachSkill(newTeachInput, newTeachLevel)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {/* Current Added Skills Chips */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#888888', marginBottom: '8px' }}>
                Your Added Skills ({skillsTeach.length}):
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '44px',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#F9F9F7',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                {skillsTeach.length === 0 ? (
                  <span style={{ fontSize: '0.825rem', color: '#999999', fontStyle: 'italic' }}>
                    No skills added yet. Select from presets below or type your own.
                  </span>
                ) : (
                  skillsTeach.map((s, idx) => (
                    <SkillChip
                      key={idx}
                      name={s.name}
                      level={s.level}
                      removable={true}
                      onRemove={() => handleRemoveTeachSkill(idx)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Suggestions Chips */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#888888', marginBottom: '8px' }}>
                Quick Presets:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {teachSuggestions.map((s) => {
                  const alreadyAdded = skillsTeach.some((st) => st.name.toLowerCase() === s.toLowerCase());
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => !alreadyAdded && handleAddTeachSkill(s, 'Intermediate')}
                      disabled={alreadyAdded}
                      style={{
                        background: alreadyAdded ? '#EEEEEE' : '#FFFFFF',
                        color: alreadyAdded ? '#999999' : '#111111',
                        border: '1px solid rgba(0, 0, 0, 0.09)',
                        borderRadius: '9999px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: alreadyAdded ? 'default' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {alreadyAdded ? <Check size={12} /> : '+'} {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-ghost"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                Continue to Learning
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Skills I Want to Learn */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              Step 3: Skills I Want to Learn
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '22px' }}>
              What topics, software, or arts are you eager to explore with a student partner?
            </p>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                value={newLearnInput}
                onChange={(e) => setNewLearnInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLearnSkill(newLearnInput);
                  }
                }}
                placeholder="Type a skill e.g. Photography, Video Editing..."
                style={{
                  flex: 1,
                  padding: '11px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => handleAddLearnSkill(newLearnInput)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                Add
              </button>
            </div>

            {/* Current Added Skills Chips */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#888888', marginBottom: '8px' }}>
                Skills You Wish to Learn ({skillsLearn.length}):
              </label>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  minHeight: '44px',
                  padding: '10px 14px',
                  borderRadius: '14px',
                  backgroundColor: '#F9F9F7',
                  border: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                {skillsLearn.length === 0 ? (
                  <span style={{ fontSize: '0.825rem', color: '#999999', fontStyle: 'italic' }}>
                    No learning goals added yet.
                  </span>
                ) : (
                  skillsLearn.map((s, idx) => (
                    <SkillChip
                      key={idx}
                      name={s.name}
                      variant="outline"
                      removable={true}
                      onRemove={() => handleRemoveLearnSkill(idx)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Suggestions Chips */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#888888', marginBottom: '8px' }}>
                Popular on campus:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {learnSuggestions.map((s) => {
                  const alreadyAdded = skillsLearn.some((sl) => sl.name.toLowerCase() === s.toLowerCase());
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => !alreadyAdded && handleAddLearnSkill(s)}
                      disabled={alreadyAdded}
                      style={{
                        background: alreadyAdded ? '#EEEEEE' : '#FFFFFF',
                        color: alreadyAdded ? '#999999' : '#111111',
                        border: '1px solid rgba(0, 0, 0, 0.09)',
                        borderRadius: '9999px',
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: alreadyAdded ? 'default' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {alreadyAdded ? <Check size={12} /> : '+'} {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-ghost"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                Continue to Bio
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Short Bio & Live Preview */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              Step 4: Short Bio & Preview
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#666666', marginBottom: '22px' }}>
              A friendly introduction explaining what you're working on and what you'd like to swap.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#222222', marginBottom: '6px' }}>
                Your Campus Bio
              </label>
              <textarea
                rows={4}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="I enjoy building web applications and would love to exchange knowledge with students interested in frontend development."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  backgroundColor: '#FFFFFF',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'none'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#888888', marginTop: '4px', display: 'block' }}>
                Tip: Mention current coursework, hackathon ideas, or portfolio goals.
              </span>
            </div>

            {/* Live Profile Card Preview */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: '#888888', marginBottom: '8px' }}>
                Live Card Preview (How others see you):
              </label>
              <div
                style={{
                  padding: '20px',
                  borderRadius: '18px',
                  backgroundColor: '#F9F9F7',
                  border: '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <img
                    src={selectedAvatar}
                    alt={fullName}
                    className="avatar"
                    style={{ width: '48px', height: '48px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111111' }}>
                      {fullName || 'Your Name'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                      {department} • {year}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.84rem', color: '#444444', fontStyle: 'italic', marginBottom: '14px' }}>
                  "{bio}"
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#888888' }}>
                      Can Teach:{' '}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {skillsTeach.map((s) => s.name).join(', ') || 'None selected'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#888888' }}>
                      Wants to Learn:{' '}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {skillsLearn.map((s) => s.name).join(', ') || 'None selected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn btn-ghost"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="btn btn-primary btn-lg"
                style={{ fontWeight: 700 }}
              >
                <Sparkles size={17} />
                Create My Profile
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

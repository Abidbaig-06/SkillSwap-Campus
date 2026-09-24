import React from 'react';
import GlassCard from '../components/GlassCard';
import SkillChip from '../components/SkillChip';
import SkillCard from '../components/SkillCard';
import StudentCard from '../components/StudentCard';
import {
  ArrowRight,
  Sparkles,
  Users,
  Compass,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { campusStats, mockSkillsList, mockStudents } from '../data/mockData';

export default function Home({ onNavigate, onSelectSkill, onSelectStudent, onConnectStudent }) {
  const featuredSkills = mockSkillsList.slice(0, 4);
  const spotlightStudents = mockStudents.slice(0, 3);

  return (
    <div style={{ width: '100%' }}>
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          padding: '80px 24px 90px 24px',
          maxWidth: '1240px',
          margin: '0 auto'
        }}
      >
        {/* Subtle background ambient circles */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '30%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.02) 0%, rgba(247,247,245,0) 70%)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: '48px',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1
          }}
          className="hero-grid"
        >
          <style>{`
            @media (max-width: 960px) {
              .hero-grid {
                grid-templateColumns: 1fr !important;
                gap: 50px !important;
              }
            }
          `}</style>

          {/* Left Column: Headlines & CTA */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#333333',
                marginBottom: '28px'
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#000000' }}></span>
              <span>Exclusively for verified college students</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5.2vw, 4.2rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.08,
                color: '#000000',
                marginBottom: '24px'
              }}
            >
              Learn from your peers.<br />
              <span style={{ color: '#222222' }}>Share what you know.</span>
            </h1>

            <p
              style={{
                fontSize: '1.15rem',
                lineHeight: 1.6,
                color: '#555555',
                maxWidth: '540px',
                marginBottom: '36px'
              }}
            >
              Discover students who can teach what you want to learn — and share your own skills with the campus community.
            </p>

            {/* Hero Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => onNavigate('discover')}
                className="btn btn-primary btn-lg"
              >
                <Compass size={18} />
                Explore Skills
              </button>

              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="btn btn-secondary btn-lg"
              >
                Create Profile
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Micro proof points */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginTop: '44px',
                paddingTop: '28px',
                borderTop: '1px solid rgba(0, 0, 0, 0.07)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} strokeWidth={2.2} />
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#333333' }}>
                  No payment required
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} strokeWidth={2.2} />
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#333333' }}>
                  College email verification
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Interactive Glass Card with Floating Chips */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* Floating subtle skill card 1: React */}
            <div
              style={{
                position: 'absolute',
                top: '-24px',
                left: '-16px',
                zIndex: 10,
                animation: 'floatSlow 4s ease-in-out infinite'
              }}
            >
              <GlassCard
                style={{
                  padding: '12px 18px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.92)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#000000' }}>Robotics & CAD</div>
                <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '2px' }}>28 students</div>
              </GlassCard>
            </div>

            {/* Floating subtle skill card 2: Drone Tech */}
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                left: '-30px',
                zIndex: 10,
                animation: 'floatSlow 5s ease-in-out infinite 1s'
              }}
            >
              <GlassCard
                style={{
                  padding: '12px 18px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.92)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#000000' }}>Drone Tech</div>
                <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '2px' }}>19 students</div>
              </GlassCard>
            </div>

            {/* Floating subtle skill card 3: Python for AI */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: '-24px',
                zIndex: 10,
                animation: 'floatSlow 4.5s ease-in-out infinite 0.5s'
              }}
            >
              <GlassCard
                style={{
                  padding: '12px 18px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.92)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)'
                }}
              >
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#000000' }}>Python for AI</div>
                <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '2px' }}>34 students</div>
              </GlassCard>
            </div>

            <style>{`
              @keyframes floatSlow {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
              }
            `}</style>

            {/* Main Realistic Glassmorphic Student Interaction Card - Rahul (Featured Campus Innovator) */}
            <div
              style={{
                width: '100%',
                maxWidth: '410px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '24px',
                padding: '30px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.07)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
                <img
                  src="./avatars/rahul.png"
                  alt="Rahul"
                  className="avatar"
                  style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                      Rahul
                    </h3>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        backgroundColor: '#111111',
                        color: '#FFFFFF',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Maker Lab Lead
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#666666', margin: '3px 0 0 0' }}>
                    Robotics & Automation • 3rd Year
                  </p>
                </div>
              </div>

              {/* Teaches */}
              <div style={{ marginBottom: '18px' }}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#888888',
                    marginBottom: '8px'
                  }}
                >
                  Teaches
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <SkillChip name="Robotics & Arduino" level="Advanced" size="sm" />
                  <SkillChip name="AutoCAD & 3D CAD" level="Advanced" size="sm" />
                  <SkillChip name="Drone Tech" level="Intermediate" size="sm" />
                </div>
              </div>

              {/* Wants to Learn */}
              <div style={{ marginBottom: '26px' }}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#888888',
                    marginBottom: '8px'
                  }}
                >
                  Wants to Learn
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <SkillChip name="Python for AI" variant="outline" size="sm" />
                  <SkillChip name="Web Development" variant="outline" size="sm" />
                </div>
              </div>

              {/* Connect Button */}
              <button
                type="button"
                onClick={() => {
                  onConnectStudent({
                    id: 9,
                    name: 'Rahul',
                    department: 'Robotics & Automation',
                    year: '3rd Year',
                    avatar: './avatars/rahul.png',
                    canTeach: [
                      { skill: 'Robotics & Arduino', name: 'Robotics & Arduino', level: 'Advanced' },
                      { skill: 'AutoCAD & 3D CAD', name: 'AutoCAD & 3D CAD', level: 'Advanced' },
                      { skill: 'Drone Tech', name: 'Drone Tech', level: 'Intermediate' }
                    ],
                    wantsToLearn: ['Python for AI', 'Web Development'],
                    bio: 'Building autonomous campus rovers and 3D drone hardware in the maker lab. Looking to exchange robotics and 3D CAD insights for Python AI and web development.'
                  });
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Stats Section */}
      <section
        style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          padding: '40px 24px'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '28px'
          }}
        >
          {campusStats.map((item, idx) => (
            <div key={idx} style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#000000', letterSpacing: '-0.03em' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111111', marginTop: '2px' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#777777', marginTop: '4px' }}>
                {item.change}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Skills Grid */}
      <section style={{ padding: '90px 24px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#666666'
              }}
            >
              Popular on campus
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '6px' }}>
              Skills in high demand this semester
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="btn btn-secondary btn-sm"
          >
            Browse All Skills
            <ArrowRight size={14} />
          </button>
        </div>

        {featuredSkills.length === 0 ? (
          <GlassCard style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111111', marginBottom: '8px' }}>
              No skills listed on campus yet
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666666', maxWidth: '440px', margin: '0 auto 20px auto' }}>
              Be the first to list a skill you can teach and help jumpstart the campus community!
            </p>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="btn btn-primary"
            >
              Create Your Profile & Add Skills
              <ArrowRight size={15} />
            </button>
          </GlassCard>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '24px'
            }}
          >
            {featuredSkills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onExplore={() => onSelectSkill(skill)}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it Works Brief Strip */}
      <section
        style={{
          padding: '80px 24px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 56px auto' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#666666'
              }}
            >
              Simple & Campus-Native
            </span>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '8px 0 16px 0' }}>
              How SkillSwap Works
            </h2>
            <p style={{ fontSize: '1rem', color: '#666666' }}>
              A peer-driven model where everybody teaches what they excel at and learns what they need.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px'
            }}
          >
            {[
              {
                step: '01',
                title: 'Create your profile',
                desc: 'Tell the campus what you know and what you want to learn with verified credentials.'
              },
              {
                step: '02',
                title: 'Discover students',
                desc: 'Find peers based on skills, batch year, ratings, and common project interests.'
              },
              {
                step: '03',
                title: 'Connect & propose',
                desc: 'Send a request offering to swap a skill in exchange for a mutual 1-on-1 session.'
              },
              {
                step: '04',
                title: 'Learn & share',
                desc: 'Meet at the library or innovation hub, exchange knowledge, and leave peer reviews.'
              }
            ].map((st) => (
              <GlassCard
                key={st.step}
                style={{
                  padding: '30px 24px',
                  backgroundColor: 'rgba(247, 247, 245, 0.65)'
                }}
              >
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: '#000000',
                    marginBottom: '16px'
                  }}
                >
                  {st.step}
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
                  {st.title}
                </h4>
                <p style={{ fontSize: '0.86rem', color: '#555555', lineHeight: 1.5 }}>
                  {st.desc}
                </p>
              </GlassCard>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              className="btn btn-secondary"
            >
              Read full Campus Guide & FAQs
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Student Spotlight */}
      <section style={{ padding: '90px 24px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#666666'
              }}
            >
              Campus Mentors
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '6px' }}>
              Meet active peer instructors
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('students')}
            className="btn btn-secondary btn-sm"
          >
            View All Students
            <ArrowRight size={14} />
          </button>
        </div>

        {spotlightStudents.length === 0 ? (
          <GlassCard style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111111', marginBottom: '8px' }}>
              No student profiles created yet
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666666', maxWidth: '440px', margin: '0 auto 20px auto' }}>
              Sign up with your campus email to create the first student mentor profile!
            </p>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="btn btn-primary"
            >
              Join Campus Community
              <ArrowRight size={15} />
            </button>
          </GlassCard>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}
          >
            {spotlightStudents.map((std) => (
              <StudentCard
                key={std.id}
                student={std}
                onViewProfile={() => onSelectStudent(std)}
                onConnect={() => onConnectStudent(std)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Call to Action Banner */}
      <section style={{ padding: '0 24px 100px 24px', maxWidth: '1240px', margin: '0 auto' }}>
        <div
          style={{
            background: '#000000',
            color: '#FFFFFF',
            borderRadius: '28px',
            padding: '64px 40px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#FFFFFF',
              marginBottom: '16px'
            }}
          >
            Start exchanging knowledge on your campus today.
          </h2>
          <p
            style={{
              fontSize: '1.05rem',
              color: '#AAAAAA',
              maxWidth: '560px',
              margin: '0 auto 32px auto',
              lineHeight: 1.6
            }}
          >
            Join hundreds of classmates already swapping coding, design, media, and academic skills. It takes 2 minutes to set up.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onNavigate('signup')}
              className="btn btn-secondary btn-lg"
              style={{ backgroundColor: '#FFFFFF', color: '#000000', fontWeight: 700 }}
            >
              Create My Profile
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              className="btn btn-outline btn-lg"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}
            >
              Explore Skills First
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          padding: '40px 24px'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              SkillSwap
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', backgroundColor: '#000', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>
              Campus
            </span>
            <span style={{ fontSize: '0.8rem', color: '#777777', marginLeft: '12px' }}>
              © 2026 Peer-to-Peer College Skill Exchange. Built for students.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
            <button
              type="button"
              onClick={() => onNavigate('discover')}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => onNavigate('how-it-works')}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import {
  UserPlus,
  Compass,
  Link as LinkIcon,
  BookOpen,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  HeartHandshake
} from 'lucide-react';

export default function HowItWorks({ onNavigate }) {
  const [openFaq, setOpenFaq] = useState(null);

  const steps = [
    {
      num: '01',
      title: 'Create your profile',
      headline: 'Tell the campus what you know and what you want to learn.',
      desc: 'Sign up with your college email. Highlight your tech, creative, or communication skills, and pick what you are eager to pick up this semester.',
      details: [
        'Select skill proficiency (Beginner to Advanced)',
        'Add links to your campus projects or GitHub',
        'Verified automatically via your college domain'
      ],
      icon: UserPlus
    },
    {
      num: '02',
      title: 'Discover students',
      headline: 'Find peers based on skills and interests.',
      desc: 'Browse by department, skill level, or student reputation. Our matching engine highlights peers who need what you teach and can teach what you need.',
      details: [
        'Explore 40+ campus categories from ML to Photography',
        'Review verified peer ratings & testimonials',
        'Filter by year of study & availability'
      ],
      icon: Compass
    },
    {
      num: '03',
      title: 'Connect',
      headline: 'Send a connection request to students who match your interests.',
      desc: 'Propose a mutual skill exchange or request a quick 1-on-1 walkthrough. Include a personalized note about what you are working on.',
      details: [
        'Propose symmetric skill swaps',
        'Direct chat to coordinate dates & campus study spots',
        'No cold outreach or spammy messaging'
      ],
      icon: LinkIcon
    },
    {
      num: '04',
      title: 'Learn & Share',
      headline: 'Exchange knowledge and grow together.',
      desc: 'Meet at the campus library, cafeteria, or lab. Work through real problems together, build college projects, and give mutual reputation feedback.',
      details: [
        'Hands-on, project-based peer teaching',
        'Leave honest peer reviews to build campus credibility',
        'Grow your verified skill portfolio for resume showcases'
      ],
      icon: BookOpen
    }
  ];

  const faqs = [
    {
      q: 'Is SkillSwap Campus completely free to use?',
      a: 'Yes, 100% free! SkillSwap operates on a peer-to-peer reciprocity model. Nobody pays or charges money; students trade their time and knowledge to mutually level up.'
    },
    {
      q: 'Do I need to be an expert to teach a skill?',
      a: 'Not at all. You just need to know enough to help someone who is a step behind you. A 2nd-year student can comfortably guide a 1st-year student on Git basics, course labs, or Photoshop shortcuts.'
    },
    {
      q: 'Where do students usually conduct their exchange sessions?',
      a: 'Most students meet in designated public campus locations such as the Central Library study rooms, innovation hubs, departmental computer labs, or student union cafes.'
    },
    {
      q: 'How are student identities and reputations verified?',
      a: 'Registration is restricted strictly to active campus domain emails (.edu / .ac.in). Furthermore, students review each other after sessions, establishing transparent campus reputation scores.'
    }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 100px 24px' }}>
      {/* Title Section */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#333333',
            marginBottom: '18px'
          }}
        >
          <Sparkles size={14} />
          Campus Peer Exchange Guide
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#111111',
            marginBottom: '16px'
          }}
        >
          How SkillSwap Works
        </h1>

        <p style={{ fontSize: '1.15rem', color: '#666666', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
          A simple, collaborative four-step process designed to make peer learning effortless, safe, and productive across college campuses.
        </p>
      </div>

      {/* Four Steps Section with Subtle Glass Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '70px' }}>
        {steps.map((st) => {
          const Icon = st.icon;

          return (
            <GlassCard
              key={st.num}
              style={{
                padding: '36px',
                borderRadius: '24px',
                backgroundColor: 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: '32px',
                  alignItems: 'flex-start'
                }}
                className="step-grid"
              >
                <style>{`
                  @media (max-width: 680px) {
                    .step-grid {
                      grid-template-columns: 1fr !important;
                      gap: 16px !important;
                    }
                  }
                `}</style>

                {/* Big Step Number and Icon */}
                <div>
                  <div
                    style={{
                      fontSize: '3rem',
                      fontWeight: 900,
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                      color: '#000000',
                      marginBottom: '8px'
                    }}
                  >
                    {st.num}
                  </div>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: '#111111',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={20} strokeWidth={2} />
                  </div>
                </div>

                {/* Step Content */}
                <div>
                  <h3
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      color: '#111111',
                      marginBottom: '6px'
                    }}
                  >
                    {st.title}
                  </h3>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#333333', marginBottom: '10px' }}>
                    {st.headline}
                  </div>
                  <p style={{ fontSize: '0.925rem', color: '#555555', lineHeight: 1.6, marginBottom: '16px' }}>
                    {st.desc}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {st.details.map((dt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#666666' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#111111' }} />
                        <span>{dt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Campus Etiquette & Safety Strip */}
      <GlassCard
        style={{
          padding: '36px',
          borderRadius: '24px',
          backgroundColor: '#FFFFFF',
          marginBottom: '60px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <ShieldCheck size={22} color="#111111" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
            Campus Safety & Code of Conduct
          </h2>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#666666', lineHeight: 1.6, marginBottom: '20px' }}>
          SkillSwap Campus is founded on mutual student trust, scholarly integrity, and a safe learning environment.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#F8F8F6' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} /> Meet in Public Places
            </div>
            <div style={{ fontSize: '0.825rem', color: '#666666', lineHeight: 1.45 }}>
              Always host in-person sessions at campus libraries, study rooms, or departmental seminar halls.
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: '#F8F8F6' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HeartHandshake size={15} /> Academic Honor Code
            </div>
            <div style={{ fontSize: '0.825rem', color: '#666666', lineHeight: 1.45 }}>
              Share concept knowledge and debugging skills. Do not complete graded assignments or exams on behalf of peers.
            </div>
          </div>
        </div>
      </GlassCard>

      {/* FAQ Accordion */}
      <div style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, textAlign: 'center', marginBottom: '32px' }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;

            return (
              <GlassCard
                key={idx}
                hover={false}
                style={{
                  padding: '20px 24px',
                  borderRadius: '16px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer'
                }}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#111111', margin: 0 }}>
                    {faq.q}
                  </h4>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      flexShrink: 0
                    }}
                  />
                </div>

                {isOpen && (
                  <p style={{ fontSize: '0.88rem', color: '#555555', marginTop: '12px', lineHeight: 1.55, margin: '12px 0 0 0' }}>
                    {faq.a}
                  </p>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* CTA Box */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => onNavigate('signup')}
          className="btn btn-primary btn-lg"
          style={{ padding: '14px 32px' }}
        >
          Join SkillSwap Campus Now
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

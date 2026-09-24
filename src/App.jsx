import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import ConnectModal from './components/ConnectModal';
import AddSkillModal from './components/AddSkillModal';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import SkillDetails from './pages/SkillDetails';
import StudentProfile from './pages/StudentProfile';
import MySkills from './pages/MySkills';
import Connections from './pages/Connections';
import Messages from './pages/Messages';
import HowItWorks from './pages/HowItWorks';
import Settings from './pages/Settings';

// Mock Data
import {
  initialCurrentUser,
  mockStudents,
  mockSkillsList,
  mockConnections,
  mockConversations
} from './data/mockData';

export default function App() {
  // App state
  const [currentUser, setCurrentUser] = useState(initialCurrentUser);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activePage, setActivePage] = useState('home'); // 'home' | 'dashboard' | 'discover' | 'students' | 'skill-details' | 'student-profile' | 'my-skills' | 'connections' | 'messages' | 'how-it-works' | 'settings' | 'login' | 'signup'
  
  // Selection state
  const [selectedSkill, setSelectedSkill] = useState(mockSkillsList[0] || null);
  const [selectedStudent, setSelectedStudent] = useState(mockStudents[0] || null);
  
  // Platform collections
  const [skills, setSkills] = useState(mockSkillsList);
  const [students, setStudents] = useState(mockStudents);
  const [connections, setConnections] = useState(mockConnections);
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState(mockConversations[0]?.id || null);
  
  // Modals & Toasts
  const [toasts, setToasts] = useState([]);
  const [connectModalStudent, setConnectModalStudent] = useState(null);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);

  // Helper to show toasts
  const showToast = (message, type = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigation history stack
  const [navHistory, setNavHistory] = useState(['home']);

  // Navigation router
  const handleNavigate = (page) => {
    setActivePage((current) => {
      if (current !== page) {
        setNavHistory((prev) => [...prev, page]);
      }
      return page;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = useCallback(() => {
    setNavHistory((prev) => {
      if (prev.length > 1) {
        const next = prev.slice(0, -1);
        const prevPage = next[next.length - 1];
        setActivePage(prevPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return next;
      } else {
        // Fallback when at base of history: if currently on dashboard, return to home
        const fallback = activePage === 'home' ? 'dashboard' : 'home';
        setActivePage(fallback);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return [fallback];
      }
    });
  }, [activePage]);

  // Backspace / Alt+Left keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isBackspace = e.key === 'Backspace';
      const isAltLeft = e.altKey && e.key === 'ArrowLeft';

      if (isBackspace || isAltLeft) {
        const target = e.target;
        const isInputField =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute?.('contenteditable') === 'true';

        if (!isInputField) {
          e.preventDefault();
          handleGoBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGoBack]);

  // Auth actions
  const handleLogin = (userCredentials) => {
    if (userCredentials?.email) {
      const emailPrefix = userCredentials.email.split('@')[0].replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (emailPrefix) {
        const foundStudent = students.find((s) =>
          s.name.toLowerCase().includes(emailPrefix)
        );
        if (foundStudent) {
          setCurrentUser((prev) => ({
            ...prev,
            id: foundStudent.id,
            name: foundStudent.name,
            email: `${foundStudent.name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
            department: foundStudent.department,
            year: foundStudent.year,
            avatar: foundStudent.avatar,
            bio: foundStudent.bio,
            skillsTeaching: foundStudent.canTeach.map((st, idx) => ({
              id: `st-${idx}`,
              name: st.skill || st.name,
              level: st.level || 'Intermediate',
              endorsements: 12
            })),
            skillsLearning: (foundStudent.wantsToLearn || foundStudent.wantToLearn || []).map((sl, idx) => ({
              id: `sl-${idx}`,
              name: typeof sl === 'string' ? sl : (sl.skill || sl.name),
              level: 'Beginner'
            }))
          }));
        }
      }
    }
    setIsLoggedIn(true);
    handleNavigate('dashboard');
  };

  const handleSignupComplete = (newProfile) => {
    setCurrentUser(newProfile);
    setIsLoggedIn(true);
    setStudents((prev) => [
      {
        id: newProfile.id,
        name: newProfile.name,
        department: newProfile.department,
        year: newProfile.year,
        avatar: newProfile.avatar,
        rating: 5.0,
        reviewsCount: 0,
        bio: newProfile.bio,
        matchPercent: 100,
        status: 'online',
        canTeach: newProfile.skillsTeaching.map((s) => ({ name: s.name, level: s.level })),
        wantsToLearn: newProfile.skillsLearning.map((s) => ({ name: s.name, level: s.level })),
        activity: { skillsShared: newProfile.skillsTeaching.length, connections: 0, sessions: 0 },
        reviews: []
      },
      ...prev
    ]);
    newProfile.skillsTeaching.forEach((st) => {
      setSkills((prev) => {
        if (!prev.some((s) => s.title.toLowerCase() === st.name.toLowerCase())) {
          return [
            {
              id: `sk-${Date.now()}-${Math.random()}`,
              title: st.name,
              slug: st.name.toLowerCase().replace(/\s+/g, '-'),
              category: st.category || 'Programming',
              teacherCount: 1,
              levelRange: `${st.level} level`,
              description: `Learn ${st.name} from student mentors on campus.`,
              avatarList: [newProfile.avatar],
              tags: [st.name]
            },
            ...prev
          ];
        }
        return prev;
      });
    });
    handleNavigate('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    showToast('Logged out of campus session.', 'info');
    handleNavigate('home');
  };

  // Skill inspection
  const handleSelectSkill = (skill) => {
    setSelectedSkill(skill);
    handleNavigate('skill-details');
  };

  // Student profile inspection
  const handleSelectStudent = (student) => {
    // If student has full data or partial from connection/chat
    const fullStudent = students.find((s) => s.id === student.id || s.name === student.name) || student;
    setSelectedStudent(fullStudent);
    handleNavigate('student-profile');
  };

  // Connect request
  const handleOpenConnectModal = (student) => {
    setConnectModalStudent(student);
  };

  const handleSendConnectionRequest = (req) => {
    const newConnection = {
      id: `conn-${Date.now()}`,
      studentId: req.studentId,
      name: req.studentName,
      department: "Campus Peer",
      year: "Student",
      avatar: connectModalStudent?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      sharedSkill: `${req.offeredSkill} ⇄ ${req.targetSkill}`,
      type: "Pending",
      status: "pending_outgoing",
      note: req.note,
      lastInteraction: "Just now"
    };

    setConnections((prev) => [newConnection, ...prev]);
    showToast(`Connection request sent to ${req.studentName}!`);
  };

  // Accept / Decline connection
  const handleAcceptConnection = (connId) => {
    setConnections((prev) =>
      prev.map((c) =>
        c.id === connId ? { ...c, status: 'active', type: 'Teaching' } : c
      )
    );
    showToast('Connection request accepted!');
  };

  const handleDeclineConnection = (connId) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
    showToast('Connection request declined.', 'info');
  };

  // Start / open message with student
  const handleMessageStudent = (studentOrConn) => {
    const studentName = studentOrConn.name || studentOrConn.studentName;
    const studentId = studentOrConn.id || studentOrConn.studentId;

    // Check if conversation exists
    let existingConv = conversations.find(
      (c) => c.studentId === studentId || c.studentName === studentName
    );

    if (!existingConv) {
      existingConv = {
        id: `conv-${Date.now()}`,
        studentId: studentId,
        studentName: studentName,
        department: studentOrConn.department || "Peer Mentee",
        avatar: studentOrConn.avatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
        status: "Online",
        unread: 0,
        lastTime: "Just now",
        messages: [
          {
            id: `m-${Date.now()}`,
            sender: "user",
            text: `Hi ${studentName.split(' ')[0]}! Excited to connect and exchange knowledge.`,
            time: "Just now"
          }
        ]
      };
      setConversations((prev) => [existingConv, ...prev]);
    }

    setActiveConversationId(existingConv.id);
    handleNavigate('messages');
  };

  // Send message
  const handleSendMessage = ({ conversationId, text, sender, time }) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          const updatedMessages = [
            ...conv.messages,
            { id: `m-${Date.now()}`, sender, text, time }
          ];
          return {
            ...conv,
            messages: updatedMessages,
            lastTime: time
          };
        }
        return conv;
      })
    );
  };

  // Add skill to currentUser
  const handleAddSkill = ({ type, skill }) => {
    if (type === 'teach') {
      setCurrentUser((prev) => ({
        ...prev,
        skillsTeaching: [skill, ...prev.skillsTeaching],
        stats: {
          ...prev.stats,
          skillsTeachingCount: prev.skillsTeaching.length + 1
        }
      }));
      setSkills((prev) => {
        const exists = prev.some((s) => s.title.toLowerCase() === skill.name.toLowerCase());
        if (exists) {
          return prev.map((s) =>
            s.title.toLowerCase() === skill.name.toLowerCase()
              ? { ...s, teacherCount: (s.teacherCount || 0) + 1 }
              : s
          );
        }
        return [
          {
            id: `sk-${Date.now()}`,
            title: skill.name,
            slug: skill.name.toLowerCase().replace(/\s+/g, '-'),
            category: skill.category || 'Programming',
            teacherCount: 1,
            levelRange: `${skill.level || 'Intermediate'} level`,
            description: `Learn ${skill.name} from student mentors on campus.`,
            avatarList: [currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"],
            tags: [skill.name, skill.category || 'General']
          },
          ...prev
        ];
      });
      showToast(`Added "${skill.name}" to your teaching skills!`);
    } else {
      setCurrentUser((prev) => ({
        ...prev,
        skillsLearning: [skill, ...prev.skillsLearning],
        stats: {
          ...prev.stats,
          skillsLearningCount: prev.skillsLearning.length + 1
        }
      }));
      showToast(`Added "${skill.name}" to your learning goals!`);
    }
  };

  // Remove skills
  const handleRemoveTeachingSkill = (skillId) => {
    setCurrentUser((prev) => ({
      ...prev,
      skillsTeaching: prev.skillsTeaching.filter((s) => s.id !== skillId)
    }));
  };

  const handleRemoveLearningSkill = (skillId) => {
    setCurrentUser((prev) => ({
      ...prev,
      skillsLearning: prev.skillsLearning.filter((s) => s.id !== skillId)
    }));
  };

  // Profile update from Settings
  const handleUpdateProfile = (updatedFields) => {
    setCurrentUser((prev) => ({
      ...prev,
      ...updatedFields
    }));
    setStudents((prev) =>
      prev.map((s) =>
        s.id === currentUser.id ? { ...s, ...updatedFields } : s
      )
    );
  };

  // Keep sidebar permanently open on all platform pages when logged in!
  const publicOnlyPages = ['home', 'login', 'signup'];
  const showSidebar = isLoggedIn && !publicOnlyPages.includes(activePage);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />

      {/* Connect with Peer Modal */}
      <ConnectModal
        student={connectModalStudent}
        isOpen={Boolean(connectModalStudent)}
        onClose={() => setConnectModalStudent(null)}
        onSendRequest={handleSendConnectionRequest}
        currentUser={currentUser}
      />

      {/* Add Skill Modal */}
      <AddSkillModal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        onAddSkill={handleAddSkill}
      />

      {/* Public Pages Layout (Home, Login, Signup, or when not using sidebar) */}
      {!showSidebar ? (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar
            activePage={activePage}
            onNavigate={handleNavigate}
            onBack={handleGoBack}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          <main style={{ flex: 1 }}>
            {activePage === 'home' && (
              <Home
                onNavigate={handleNavigate}
                onSelectSkill={handleSelectSkill}
                onSelectStudent={handleSelectStudent}
                onConnectStudent={handleOpenConnectModal}
              />
            )}

            {activePage === 'login' && (
              <Login
                onLogin={handleLogin}
                onNavigate={handleNavigate}
                showToast={showToast}
              />
            )}

            {activePage === 'signup' && (
              <Signup
                onComplete={handleSignupComplete}
                onNavigate={handleNavigate}
                showToast={showToast}
              />
            )}

            {(activePage === 'discover' || activePage === 'skills') && (
              <Discover
                skills={skills}
                students={students}
                onSelectSkill={handleSelectSkill}
                onSelectStudent={handleSelectStudent}
                onConnectStudent={handleOpenConnectModal}
                onOpenAddSkill={() => setIsAddSkillModalOpen(true)}
                initialMode="skills"
              />
            )}

            {activePage === 'students' && (
              <Discover
                skills={skills}
                students={students}
                onSelectSkill={handleSelectSkill}
                onSelectStudent={handleSelectStudent}
                onConnectStudent={handleOpenConnectModal}
                onOpenAddSkill={() => setIsAddSkillModalOpen(true)}
                initialMode="students"
              />
            )}

            {activePage === 'skill-details' && (
              <SkillDetails
                skill={selectedSkill}
                onBack={handleGoBack}
                onSelectStudent={handleSelectStudent}
                onConnectStudent={handleOpenConnectModal}
              />
            )}

            {activePage === 'student-profile' && (
              <StudentProfile
                student={selectedStudent}
                onBack={handleGoBack}
                onConnect={handleOpenConnectModal}
                onMessage={handleMessageStudent}
                isConnected={connections.some((c) => c.studentId === selectedStudent.id)}
              />
            )}

            {activePage === 'how-it-works' && (
              <HowItWorks onNavigate={handleNavigate} />
            )}
          </main>
        </div>
      ) : (
        /* Authenticated Dashboard Layout with Persistent Sidebar */
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar
            activePage={activePage}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            unreadMessagesCount={1}
            pendingConnectionsCount={connections.filter((c) => c.status?.startsWith('pending')).length}
            onLogout={handleLogout}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Top Bar for authenticated dashboard */}
            <header
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 30,
                padding: '12px 28px',
                backgroundColor: 'rgba(247, 247, 245, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  type="button"
                  onClick={handleGoBack}
                  title="Go back to previous page (Backspace)"
                  aria-label="Go back to previous page"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: '#FFFFFF',
                    color: '#111111',
                    fontSize: '0.825rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#111111';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#111111';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.color = '#111111';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    onClick={() => handleNavigate('dashboard')}
                    style={{ fontSize: '0.85rem', color: '#666666', cursor: 'pointer', fontWeight: 500 }}
                  >
                    SkillSwap Campus
                  </span>
                  <span style={{ color: '#AAAAAA' }}>/</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111111', textTransform: 'capitalize' }}>
                    {activePage.replace('-', ' ')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => handleNavigate('home')}
                  className="btn btn-ghost btn-sm"
                >
                  Landing Page
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddSkillModalOpen(true)}
                  className="btn btn-primary btn-sm"
                >
                  + Add Skill
                </button>
              </div>
            </header>

            <main style={{ flex: 1 }}>
              {activePage === 'dashboard' && (
                <Dashboard
                  currentUser={currentUser}
                  students={students}
                  onNavigate={handleNavigate}
                  onSelectStudent={handleSelectStudent}
                  onConnectStudent={handleOpenConnectModal}
                  onOpenAddSkill={() => setIsAddSkillModalOpen(true)}
                />
              )}

              {(activePage === 'discover' || activePage === 'skills') && (
                <Discover
                  skills={skills}
                  students={students}
                  onSelectSkill={handleSelectSkill}
                  onSelectStudent={handleSelectStudent}
                  onConnectStudent={handleOpenConnectModal}
                  onOpenAddSkill={() => setIsAddSkillModalOpen(true)}
                  initialMode="skills"
                />
              )}

              {activePage === 'students' && (
                <Discover
                  skills={skills}
                  students={students}
                  onSelectSkill={handleSelectSkill}
                  onSelectStudent={handleSelectStudent}
                  onConnectStudent={handleOpenConnectModal}
                  onOpenAddSkill={() => setIsAddSkillModalOpen(true)}
                  initialMode="students"
                />
              )}

              {activePage === 'skill-details' && (
                <SkillDetails
                  skill={selectedSkill}
                  onBack={handleGoBack}
                  onSelectStudent={handleSelectStudent}
                  onConnectStudent={handleOpenConnectModal}
                />
              )}

              {activePage === 'student-profile' && (
                <StudentProfile
                  student={selectedStudent}
                  onBack={handleGoBack}
                  onConnect={handleOpenConnectModal}
                  onMessage={handleMessageStudent}
                  isConnected={connections.some((c) => c.studentId === selectedStudent.id)}
                />
              )}

              {activePage === 'my-skills' && (
                <MySkills
                  currentUser={currentUser}
                  onOpenAddSkill={() => setIsAddSkillModalOpen(true)}
                  onRemoveTeachingSkill={handleRemoveTeachingSkill}
                  onRemoveLearningSkill={handleRemoveLearningSkill}
                  onFindStudentsForSkill={(skill) => {
                    setSelectedSkill(
                      mockSkillsList.find((s) => s.title.toLowerCase().includes(skill.name.toLowerCase())) || {
                        id: `sk-${skill.name}`,
                        title: skill.name,
                        slug: skill.name.toLowerCase(),
                        category: skill.category || 'Programming',
                        teacherCount: skill.availableStudents || 12,
                        levelRange: 'Beginner to Advanced',
                        description: `Learn ${skill.name} from active student mentors on campus.`,
                        avatarList: [
                          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                        ],
                        tags: [skill.name, 'Peer Learning']
                      }
                    );
                    handleNavigate('skill-details');
                  }}
                  showToast={showToast}
                />
              )}

              {activePage === 'connections' && (
                <Connections
                  connections={connections}
                  onAcceptConnection={handleAcceptConnection}
                  onDeclineConnection={handleDeclineConnection}
                  onMessage={handleMessageStudent}
                  onViewProfile={handleSelectStudent}
                  onNavigate={handleNavigate}
                />
              )}

              {activePage === 'messages' && (
                <Messages
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={setActiveConversationId}
                  onSendMessage={handleSendMessage}
                  currentUser={currentUser}
                  onViewStudentProfile={handleSelectStudent}
                />
              )}

              {activePage === 'how-it-works' && (
                <HowItWorks onNavigate={handleNavigate} />
              )}

              {activePage === 'settings' && (
                <Settings
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateProfile}
                  onOpenAddSkill={() => setIsAddSkillModalOpen(true)}
                  onNavigate={handleNavigate}
                  showToast={showToast}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

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
import Sessions from './pages/Sessions';
import ScheduleSessionModal from './components/ScheduleSessionModal';

// Resilient API Client Utility
import { apiRequest } from './utils/api';
import { connectSocket, disconnectSocket, joinConversation } from './utils/socket';

export default function App() {
  // App state
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activePage, setActivePage] = useState('home'); // 'home' | 'dashboard' | 'discover' | 'students' | 'skill-details' | 'student-profile' | 'my-skills' | 'connections' | 'messages' | 'how-it-works' | 'settings' | 'login' | 'signup'
  
  // Selection state
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Platform collections from MongoDB
  const [skills, setSkills] = useState([]);
  const [students, setStudents] = useState([]);
  const [campusStats, setCampusStats] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [connections, setConnections] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);
  const [personalStats, setPersonalStats] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [pendingSessionsCount, setPendingSessionsCount] = useState(0);
  const [scheduleModalData, setScheduleModalData] = useState({
    isOpen: false,
    connection: null,
    partner: null,
    session: null
  });
  const currentUserIdRef = React.useRef(null);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || null;
  }, [currentUser?.id]);
  
  // Modals & Toasts
  const [toasts, setToasts] = useState([]);
  const [connectModalStudent, setConnectModalStudent] = useState(null);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [addSkillModalType, setAddSkillModalType] = useState('teach');
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState('');

  const handleOpenAddSkill = (type = 'teach') => {
    setAddSkillModalType(type);
    setIsAddSkillModalOpen(true);
  };

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

  // Fetch campus directory data from MongoDB
  const fetchDirectoryData = useCallback(async () => {
    try {
      setIsDataLoading(true);
      const [studentsRes, skillsRes, statsRes] = await Promise.all([
        apiRequest('/api/students', { credentials: 'include' }).catch(() => ({ students: [] })),
        apiRequest('/api/skills', { credentials: 'include' }).catch(() => ({ skills: [] })),
        apiRequest('/api/stats/campus', { credentials: 'include' }).catch(() => null)
      ]);

      if (studentsRes && Array.isArray(studentsRes.students)) {
        setStudents(studentsRes.students);
        setSelectedStudent((curr) => {
          if (!curr) return null;
          const updated = studentsRes.students.find(
            (s) => s.id === curr.id || s._id === curr.id || s._id === curr._id
          );
          return updated ? { ...curr, ...updated } : curr;
        });
      }
      if (skillsRes && Array.isArray(skillsRes.skills)) {
        setSkills(skillsRes.skills);
      }
      if (statsRes) {
        setCampusStats(statsRes.stats || statsRes);
      }
    } catch (err) {
      console.warn('[App] Directory data fetch error:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);


    // Load saved connections and conversations from MongoDB
  const fetchUserConnections = useCallback(async () => {
    const requestingUserId = currentUserIdRef.current;
    if (!requestingUserId) return;
    try {
      const data = await apiRequest('/api/connections', { credentials: 'include' });
      if (currentUserIdRef.current !== requestingUserId) return;
      if (Array.isArray(data?.connections)) {
        setConnections(data.connections);
      }
    } catch (err) {
      if (currentUserIdRef.current === requestingUserId) {
        console.warn('[App] Could not fetch connections:', err.message);
      }
    }
  }, []);

  const fetchUserConversations = useCallback(async () => {
    const requestingUserId = currentUserIdRef.current;
    if (!requestingUserId) return;
    try {
      setIsConversationsLoading(true);
      setConversationsError(null);
      const data = await apiRequest('/api/messages/conversations', { credentials: 'include' });
      if (currentUserIdRef.current !== requestingUserId) return;
      if (Array.isArray(data?.conversations)) {
        setConversations((prev) => {
          return data.conversations.map((serverConv) => {
            const existing = prev.find((c) => c.id === serverConv.id || c._id === serverConv.id);
            if (!existing) return serverConv;

            // Preserve any pending or failed optimistic messages in flight
            const pendingMessages = (existing.messages || []).filter((m) => {
              const isPending = m.id?.startsWith('cmsg-') || m.status === 'sending' || m.status === 'failed';
              const onServer = (serverConv.messages || []).some(
                (sm) => sm.id === m.id || (m.clientMsgId && sm.clientMsgId === m.clientMsgId)
              );
              return isPending && !onServer;
            });

            const merged = [...(serverConv.messages || []), ...pendingMessages];
            const hasPending = pendingMessages.length > 0;
            return {
              ...serverConv,
              messages: merged,
              lastMessage: hasPending ? pendingMessages[pendingMessages.length - 1].text : serverConv.lastMessage,
              lastTime: hasPending ? 'Just now' : serverConv.lastTime
            };
          });
        });
        if (data.conversations.length > 0) {
          setActiveConversationId((curr) => {
            if (curr && data.conversations.some((c) => c.id === curr || c._id === curr)) return curr;
            return data.conversations[0].id || data.conversations[0]._id;
          });
        }
      }
    } catch (err) {
      if (currentUserIdRef.current === requestingUserId) {
        console.warn('[App] Could not fetch conversations:', err.message);
        setConversationsError(err.message || 'Failed to retrieve conversations.');
      }
    } finally {
      if (currentUserIdRef.current === requestingUserId) {
        setIsConversationsLoading(false);
      }
    }
  }, []);

  const fetchPersonalStats = useCallback(async () => {
    const requestingUserId = currentUserIdRef.current;
    if (!requestingUserId) return;
    try {
      const data = await apiRequest('/api/stats/personal', { credentials: 'include' });
      if (currentUserIdRef.current !== requestingUserId) return;
      if (data?.stats) {
        setPersonalStats(data.stats);
        setPendingSessionsCount(data.stats.pendingSessionsCount || 0);
      }
      if (Array.isArray(data?.upcomingSessions)) {
        setUpcomingSessions(data.upcomingSessions);
      }
    } catch (err) {
      if (currentUserIdRef.current === requestingUserId) {
        console.warn('[App] Could not fetch personal stats:', err.message);
      }
    }
  }, []);
  useEffect(() => {
    fetchDirectoryData();
  }, [fetchDirectoryData]);

  // Session restoration on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const data = await apiRequest('/api/auth/me', {
          credentials: 'include'
        });

        if (isMounted && data && data.user) {
          currentUserIdRef.current = data.user.id;
          setCurrentUser(data.user);
          setIsLoggedIn(true);
          // Restore user data and socket quietly without forcing redirect away from landing page
          fetchUserConnections();
          fetchUserConversations();
          fetchPersonalStats();
          connectSocket();
        } else if (isMounted) {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } catch (err) {
        if (isMounted) {
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } finally {
        if (isMounted) {
          setIsAuthChecking(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auth actions
  const handleLogin = async (userCredentials) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userCredentials)
    });

    if (!data?.user) {
      throw new Error('Invalid response received from server.');
    }

    const user = data.user;
    currentUserIdRef.current = user.id;
    setCurrentUser(user);
    setIsLoggedIn(true);
    fetchUserConnections();
    fetchUserConversations();
    fetchPersonalStats();
    connectSocket();

    // Refresh dynamic match scores and directory for this user
    fetchDirectoryData();

    showToast(`Welcome back, ${user.name.split(' ')[0]}!`);
    handleNavigate('dashboard');
  };

  const handleSignupComplete = async (signupPayload) => {
    const data = await apiRequest('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(signupPayload)
    });

    if (!data?.user) {
      throw new Error('Invalid response received from server.');
    }

    const newProfile = data.user;
    currentUserIdRef.current = newProfile.id;
    setCurrentUser(newProfile);
    setIsLoggedIn(true);
    fetchUserConnections();
    fetchUserConversations();
    fetchPersonalStats();
    connectSocket();

    // Refresh dynamic directory from MongoDB
    fetchDirectoryData();

    showToast(`Profile created successfully! Welcome to SkillSwap Campus, ${newProfile.name.split(' ')[0]}.`);
    handleNavigate('dashboard');
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.warn('[App] Logout network error:', err);
    }

    currentUserIdRef.current = null;
    disconnectSocket();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setConnections([]);
    setConversations([]);
    setActiveConversationId(null);
    setConversationsError(null);
    setIsConversationsLoading(false);
    setPersonalStats(null);
    setUpcomingSessions([]);
    setPendingSessionsCount(0);
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageErr) {
        // ignore
      }
    }
    fetchDirectoryData();
    showToast('Logged out of campus session.', 'info');
    handleNavigate('home');
  };

  // Authenticated account deletion
  const handleDeleteAccount = async () => {
    try {
      await apiRequest('/api/me/account', {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (err) {
      console.error('[App] Account deletion error:', err);
      throw err;
    }

    currentUserIdRef.current = null;
    disconnectSocket();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setConnections([]);
    setConversations([]);
    setActiveConversationId(null);
    setConversationsError(null);
    setIsConversationsLoading(false);
    setPersonalStats(null);
    setUpcomingSessions([]);
    setPendingSessionsCount(0);
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageErr) {
        // ignore
      }
    }
    await fetchDirectoryData();
    showToast('Your campus account and profile have been permanently deleted.', 'info');
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


  // Reload conversations whenever entering Messages page
  useEffect(() => {
    if (isLoggedIn && currentUser && activePage === 'messages') {
      fetchUserConversations();
    }
  }, [isLoggedIn, currentUser, activePage, fetchUserConversations]);

  // Reload personal stats and upcoming sessions whenever entering Dashboard or Sessions page
  useEffect(() => {
    if (isLoggedIn && currentUser && (activePage === 'dashboard' || activePage === 'sessions')) {
      fetchPersonalStats();
    }
  }, [isLoggedIn, currentUser, activePage, fetchPersonalStats]);

  // Join room when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      joinConversation(activeConversationId);
    }
  }, [activeConversationId]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!isLoggedIn || !currentUser) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();

    const handleNewConnectionRequest = (newConn) => {
      setConnections((prev) => [newConn, ...prev.filter((c) => c.id !== newConn.id)]);
      showToast(`New swap connection request from ${newConn.name || 'a peer'}!`);
    };

    const handleConnectionAccepted = (data) => {
      if (data.connection) {
        setConnections((prev) =>
          prev.map((c) => (c.id === data.connection.id ? data.connection : c))
        );
      }
      fetchUserConversations();
      showToast(`${data.connection?.name || 'Peer'} accepted your swap request!`);
    };

    const handleConnectionDeclined = ({ connectionId }) => {
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
      showToast('A connection request was declined.', 'info');
    };

    const handleConnectionCancelled = ({ connectionId }) => {
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    };

    const handleMessageReceived = (msg) => {
      setConversations((prev) => {
        const convExists = prev.some((c) => c.id === msg.conversationId || c._id === msg.conversationId);
        if (!convExists) {
          fetchUserConversations();
          return prev;
        }

        return prev.map((c) => {
          if (c.id === msg.conversationId || c._id === msg.conversationId) {
            const isMe = msg.senderId === currentUser?.id || msg.senderId === currentUser?._id;
            const normalizedMsg = {
              ...msg,
              sender: isMe ? 'user' : 'peer',
              status: 'delivered'
            };

            const existingList = c.messages || [];

            // Check if this message by server id is already in the list
            const existingServerIdx = existingList.findIndex((m) => m.id === msg.id || m._id === msg.id);

            let updatedMessages;
            if (existingServerIdx >= 0) {
              // Already exists: update in place and clean up any dangling placeholder (id === clientMsgId)
              updatedMessages = existingList.map((m, idx) => {
                if (idx === existingServerIdx) return { ...m, ...normalizedMsg };
                return m;
              }).filter((m) => !(msg.clientMsgId && m.id === msg.clientMsgId && m.id !== msg.id));
            } else {
              // Match placeholder by clientMsgId
              const placeholderIdx = msg.clientMsgId
                ? existingList.findIndex((m) => m.clientMsgId === msg.clientMsgId || m.id === msg.clientMsgId)
                : -1;

              if (placeholderIdx >= 0) {
                updatedMessages = [...existingList];
                updatedMessages[placeholderIdx] = normalizedMsg;
              } else {
                updatedMessages = [...existingList, normalizedMsg];
              }
            }

            const isViewingThis = activePage === 'messages' && (activeConversationId === c.id || activeConversationId === c._id);
            const updatedUnread = (isMe || isViewingThis)
              ? 0
              : (c.unread || c.unreadCount || 0) + 1;

            return {
              ...c,
              messages: updatedMessages,
              lastTime: msg.time || 'Just now',
              lastMessage: msg.text,
              unread: updatedUnread,
              unreadCount: updatedUnread
            };
          }
          return c;
        });
      });
    };

    const handleConversationUpdated = ({ conversationId, lastMessage }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              lastMessage: lastMessage?.text || c.lastMessage,
              lastTime: 'Just now'
            };
          }
          return c;
        })
      );
    };

    const handleSessionProposed = (session) => {
      fetchPersonalStats();
      showToast(`New session proposed: "${session?.title || 'Learning Session'}"!`);
    };

    const handleSessionConfirmed = (session) => {
      fetchPersonalStats();
      showToast(`Session confirmed: "${session?.title || 'Learning Session'}"!`);
    };

    const handleSessionDeclined = () => {
      fetchPersonalStats();
      showToast('A session proposal was declined.', 'info');
    };

    const handleSessionCancelled = () => {
      fetchPersonalStats();
      showToast('A session was cancelled.', 'info');
    };

    const handleSessionRescheduled = (session) => {
      fetchPersonalStats();
      showToast(`Reschedule proposed for "${session?.title || 'Learning Session'}"`);
    };

    const handleSessionCompleted = () => {
      fetchPersonalStats();
      showToast('Session verified and completed! Exchange hours updated.');
    };

    socket.on('new_connection_request', handleNewConnectionRequest);
    socket.on('connection_accepted', handleConnectionAccepted);
    socket.on('connection_declined', handleConnectionDeclined);
    socket.on('connection_cancelled', handleConnectionCancelled);
    socket.on('message_received', handleMessageReceived);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('session_proposed', handleSessionProposed);
    socket.on('session_confirmed', handleSessionConfirmed);
    socket.on('session_declined', handleSessionDeclined);
    socket.on('session_cancelled', handleSessionCancelled);
    socket.on('session_rescheduled', handleSessionRescheduled);
    socket.on('session_completed', handleSessionCompleted);

    return () => {
      socket.off('new_connection_request', handleNewConnectionRequest);
      socket.off('connection_accepted', handleConnectionAccepted);
      socket.off('connection_declined', handleConnectionDeclined);
      socket.off('connection_cancelled', handleConnectionCancelled);
      socket.off('message_received', handleMessageReceived);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('session_proposed', handleSessionProposed);
      socket.off('session_confirmed', handleSessionConfirmed);
      socket.off('session_declined', handleSessionDeclined);
      socket.off('session_cancelled', handleSessionCancelled);
      socket.off('session_rescheduled', handleSessionRescheduled);
      socket.off('session_completed', handleSessionCompleted);
    };
  }, [isLoggedIn, currentUser, activePage, activeConversationId, fetchUserConversations, fetchPersonalStats]);

  // Connect request
  const handleOpenConnectModal = (student) => {
    setConnectModalStudent(student);
  };

  const handleSendConnectionRequest = async (req) => {
    try {
      const data = await apiRequest('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId: req.studentId,
          recipientId: req.studentId,
          offeredSkill: req.offeredSkill,
          targetSkill: req.targetSkill,
          requestedSkill: req.targetSkill,
          note: req.note
        })
      });

      if (data?.connection) {
        setConnections((prev) => [data.connection, ...prev.filter((c) => c.id !== data.connection.id)]);
        showToast(`Connection request sent to ${req.studentName}!`);
      }
    } catch (err) {
      showToast(err.message || 'Failed to send connection request.', 'error');
    }
  };

  // Accept / Decline connection
  const handleAcceptConnection = async (connId) => {
    try {
      const data = await apiRequest(`/api/connections/${encodeURIComponent(connId)}/accept`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (data?.connection) {
        setConnections((prev) =>
          prev.map((c) => (c.id === connId ? data.connection : c))
        );
        showToast('Connection request accepted!');
        fetchUserConversations();
      }
    } catch (err) {
      showToast(err.message || 'Failed to accept connection request.', 'error');
    }
  };

  const handleDeclineConnection = async (connId) => {
    try {
      await apiRequest(`/api/connections/${encodeURIComponent(connId)}/decline`, {
        method: 'PATCH',
        credentials: 'include'
      });
      setConnections((prev) => prev.filter((c) => c.id !== connId));
      showToast('Connection request declined.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to decline connection request.', 'error');
    }
  };

  // Select conversation, join room, and fetch full history from server
  const handleSelectConversation = async (convId) => {
    setActiveConversationId(convId);
    joinConversation(convId);

    // Reset unread count locally immediately
    setConversations((prev) =>
      prev.map((c) => ((c.id === convId || c._id === convId) ? { ...c, unread: 0, unreadCount: 0 } : c))
    );

    try {
      const data = await apiRequest(`/api/messages/conversations/${encodeURIComponent(convId)}`, {
        credentials: 'include'
      });
      if (data?.conversation) {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === convId || c._id === convId) {
              const pendingMessages = (c.messages || []).filter((m) => {
                const isPending = m.id?.startsWith('cmsg-') || m.status === 'sending' || m.status === 'failed';
                const onServer = (data.conversation.messages || []).some(
                  (sm) => sm.id === m.id || (m.clientMsgId && sm.clientMsgId === m.clientMsgId)
                );
                return isPending && !onServer;
              });
              const merged = [...(data.conversation.messages || []), ...pendingMessages];
              return {
                ...c,
                ...data.conversation,
                messages: merged,
                unread: 0,
                unreadCount: 0
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.warn('[App] Could not fetch conversation history:', err.message);
    }
  };

  // Start / open message with student
  const handleMessageStudent = async (studentOrConn) => {
    const studentName = studentOrConn.name || studentOrConn.studentName;
    const studentId = studentOrConn.studentId || studentOrConn.id;

    let existingConv = conversations.find(
      (c) => c.studentId === studentId || c.studentName === studentName
    );

    if (!existingConv && studentId) {
      try {
        const res = await apiRequest('/api/messages/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ studentId })
        });
        if (res?.conversation) {
          existingConv = res.conversation;
          setConversations((prev) => [
            existingConv,
            ...prev.filter((c) => c.id !== existingConv.id && c._id !== existingConv.id)
          ]);
        }
      } catch (err) {
        console.warn('[App] Start message error:', err);
      }
    }

    if (existingConv) {
      setActiveConversationId(existingConv.id);
      joinConversation(existingConv.id);
    }
    handleNavigate('messages');
  };

  // Send message with single logical clientMsgId, failure retry, and seamless reconciliation
  const handleSendMessage = async ({ conversationId, text, clientMsgId: retryClientMsgId }) => {
    const clientMsgId = retryClientMsgId || `cmsg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const optimisticMsg = {
      id: clientMsgId,
      clientMsgId,
      conversationId,
      sender: 'user',
      senderId: currentUser?.id,
      text,
      time: 'Just now',
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId || conv._id === conversationId) {
          const existingList = conv.messages || [];
          const existingIdx = existingList.findIndex(
            (m) => m.id === clientMsgId || m.clientMsgId === clientMsgId
          );

          let updatedMessages;
          if (existingIdx >= 0) {
            updatedMessages = [...existingList];
            updatedMessages[existingIdx] = optimisticMsg;
          } else {
            updatedMessages = [...existingList, optimisticMsg];
          }

          return {
            ...conv,
            messages: updatedMessages,
            lastTime: 'Just now',
            lastMessage: text
          };
        }
        return conv;
      })
    );

    try {
      const data = await apiRequest(
        `/api/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text, clientMsgId })
        }
      );

      const confirmedMsg = {
        ...data.message,
        sender: 'user',
        status: 'delivered'
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId || conv._id === conversationId) {
            const existingList = conv.messages || [];

            // Check if socket broadcast already placed the server message in list
            const existingServerIdx = existingList.findIndex(
              (m) => m.id === confirmedMsg.id || m._id === confirmedMsg.id
            );

            let updatedMessages;
            if (existingServerIdx >= 0) {
              // Socket already inserted it: update to confirmed and remove only unreplaced placeholder (id === clientMsgId)
              updatedMessages = existingList
                .map((m, idx) => (idx === existingServerIdx ? { ...m, ...confirmedMsg } : m))
                .filter((m) => !(m.id === clientMsgId && m.id !== confirmedMsg.id));
            } else {
              // Replace optimistic placeholder with confirmed server message
              const placeholderIdx = existingList.findIndex(
                (m) => m.id === clientMsgId || m.clientMsgId === clientMsgId
              );
              if (placeholderIdx >= 0) {
                updatedMessages = [...existingList];
                updatedMessages[placeholderIdx] = confirmedMsg;
              } else {
                updatedMessages = [...existingList, confirmedMsg];
              }
            }

            return {
              ...conv,
              messages: updatedMessages,
              lastTime: confirmedMsg.time,
              lastMessage: confirmedMsg.text
            };
          }
          return conv;
        })
      );

      return confirmedMsg;
    } catch (err) {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId || conv._id === conversationId) {
            // Keep failed message in chat with status: 'failed' so user can retry
            const updatedMessages = (conv.messages || []).map((m) =>
              (m.id === clientMsgId || m.clientMsgId === clientMsgId)
                ? { ...m, status: 'failed', time: 'Failed to send' }
                : m
            );
            return {
              ...conv,
              messages: updatedMessages
            };
          }
          return conv;
        })
      );
      showToast(err.message || 'Failed to deliver message.', 'error');
      throw err;
    }
  };

  // Add skill to currentUser via backend API
  const handleAddSkill = async ({ type, skill }) => {
    const data = await apiRequest('/api/me/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        type,
        name: skill.name,
        level: skill.level,
        category: skill.category
      })
    });

    if (!data?.user) {
      throw new Error('Failed to add skill: invalid response from server.');
    }

    const updatedUser = data.user;
    setCurrentUser(updatedUser);

    // Update students directory for the current user
    setStudents((prev) =>
      prev.map((s) =>
        s.id === updatedUser.id
          ? {
              ...s,
              canTeach: (updatedUser.skillsTeaching || []).map((t) => ({ name: t.name, level: t.level })),
              wantsToLearn: (updatedUser.skillsLearning || []).map((l) => ({ name: l.name, level: l.level })),
              activity: {
                ...s.activity,
                skillsShared: (updatedUser.skillsTeaching || []).length
              }
            }
          : s
      )
    );

    if (type === 'teach') {
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
            avatarList: [currentUser?.avatar || './avatars/default_avatar.svg'],
            tags: [skill.name, skill.category || 'General']
          },
          ...prev
        ];
      });
      showToast(`Added "${skill.name}" to your teaching skills!`);
    } else {
      showToast(`Added "${skill.name}" to your learning goals!`);
    }

    // Refresh campus counts, matching evidence, and personal stats
    fetchDirectoryData();
    fetchPersonalStats();

    return updatedUser;
  };

  // Update skills via backend API
  const handleUpdateSkill = async ({ id, name, level, category }) => {
    const data = await apiRequest(`/api/me/skills/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, level, category })
    });

    if (!data?.user) {
      throw new Error('Failed to update skill: invalid response from server.');
    }

    const updatedUser = data.user;
    setCurrentUser(updatedUser);

    setStudents((prev) =>
      prev.map((s) =>
        s.id === updatedUser.id
          ? {
              ...s,
              canTeach: (updatedUser.skillsTeaching || []).map((t) => ({ name: t.name, level: t.level, category: t.category })),
              wantsToLearn: (updatedUser.skillsLearning || []).map((l) => ({ name: l.name, level: l.level, category: l.category })),
              activity: {
                ...s.activity,
                skillsShared: (updatedUser.skillsTeaching || []).length
              }
            }
          : s
      )
    );

    // Refresh directory data, matching scores, and personal stats
    fetchDirectoryData();
    fetchPersonalStats();

    return updatedUser;
  };

  // Remove skills via backend API
  const handleRemoveSkill = async (skillId) => {
    const data = await apiRequest(`/api/me/skills/${encodeURIComponent(skillId)}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!data?.user) {
      throw new Error('Failed to remove skill: invalid response from server.');
    }

    const updatedUser = data.user;
    setCurrentUser(updatedUser);

    setStudents((prev) =>
      prev.map((s) =>
        s.id === updatedUser.id
          ? {
              ...s,
              canTeach: (updatedUser.skillsTeaching || []).map((t) => ({ name: t.name, level: t.level, category: t.category })),
              wantsToLearn: (updatedUser.skillsLearning || []).map((l) => ({ name: l.name, level: l.level, category: l.category })),
              activity: {
                ...s.activity,
                skillsShared: (updatedUser.skillsTeaching || []).length
              }
            }
          : s
      )
    );

    // Refresh campus counts and personal stats from MongoDB
    fetchDirectoryData();
    fetchPersonalStats();

    return updatedUser;
  };

  const handleRemoveTeachingSkill = async (skillId) => {
    return await handleRemoveSkill(skillId);
  };

  const handleRemoveLearningSkill = async (skillId) => {
    return await handleRemoveSkill(skillId);
  };

  // Profile update from Settings via backend API
  const handleUpdateProfile = async (updatedFields) => {
    const data = await apiRequest('/api/me/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updatedFields)
    });

    if (!data?.user) {
      throw new Error('Failed to update profile: invalid response from server.');
    }

    const updatedUser = data.user;
    setCurrentUser(updatedUser);

    setStudents((prev) =>
      prev.map((s) =>
        s.id === updatedUser.id
          ? {
              ...s,
              name: updatedUser.name,
              bio: updatedUser.bio,
              department: updatedUser.department,
              year: updatedUser.year,
              avatar: updatedUser.avatar
            }
          : s
      )
    );

    // Refresh campus directory from MongoDB
    fetchDirectoryData();

    return updatedUser;
  };

  // Keep sidebar permanently open on all platform pages when logged in!
  const publicOnlyPages = ['home', 'login', 'signup'];
  const showSidebar = isLoggedIn && Boolean(currentUser) && !publicOnlyPages.includes(activePage);

  if (isAuthChecking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F7F7F5',
          fontFamily: 'inherit'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: '6px',
              marginBottom: '16px'
            }}
          >
            <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#000000' }}>
              SkillSwap
            </span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                backgroundColor: '#111111',
                color: '#FFFFFF',
                padding: '2px 6px',
                borderRadius: '6px'
              }}
            >
              Campus
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#666666' }}>
            Restoring campus session...
          </p>
        </div>
      </div>
    );
  }

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
        initialType={addSkillModalType}
        onClose={() => setIsAddSkillModalOpen(false)}
        onAddSkill={handleAddSkill}
      />

      {/* Schedule Session Modal */}
      {scheduleModalData.isOpen && (
        <ScheduleSessionModal
          isOpen={scheduleModalData.isOpen}
          connection={scheduleModalData.connection}
          partner={scheduleModalData.partner}
          session={scheduleModalData.session}
          currentUser={currentUser}
          onClose={() =>
            setScheduleModalData({
              isOpen: false,
              connection: null,
              partner: null,
              session: null
            })
          }
          onSessionScheduled={() => {
            showToast('Learning session scheduled successfully!', 'success');
            fetchPersonalStats();
          }}
        />
      )}

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
                skills={skills}
                students={students}
                campusStats={campusStats}
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
                onOpenAddSkill={handleOpenAddSkill}
                initialMode="skills"
                initialSearch={discoverSearchQuery}
              />
            )}

            {activePage === 'students' && (
              <Discover
                skills={skills}
                students={students}
                onSelectSkill={handleSelectSkill}
                onSelectStudent={handleSelectStudent}
                onConnectStudent={handleOpenConnectModal}
                onOpenAddSkill={handleOpenAddSkill}
                initialMode="students"
                initialSearch={discoverSearchQuery}
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
                isConnected={connections.some((c) => c.studentId === selectedStudent?.id)}
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
            unreadMessagesCount={conversations.reduce((sum, c) => sum + (c.unread || c.unreadCount || 0), 0)}
            pendingConnectionsCount={connections.filter((c) => c.status === 'pending_incoming' || c.isIncoming).length}
            pendingSessionsCount={pendingSessionsCount}
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
                  onClick={() => handleOpenAddSkill('teach')}
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
                  campusStats={campusStats}
                  personalStats={personalStats}
                  upcomingSessions={upcomingSessions}
                  onNavigate={handleNavigate}
                  onSelectStudent={handleSelectStudent}
                  onConnectStudent={handleOpenConnectModal}
                  onOpenAddSkill={() => handleOpenAddSkill('teach')}
                  onOpenDiscussion={(conversationId) => {
                    if (conversationId) {
                      handleSelectConversation(conversationId);
                    }
                    handleNavigate('messages');
                  }}
                />
              )}

              {(activePage === 'discover' || activePage === 'skills') && (
                <Discover
                  skills={skills}
                  students={students}
                  onSelectSkill={handleSelectSkill}
                  onSelectStudent={handleSelectStudent}
                  onConnectStudent={handleOpenConnectModal}
                  onOpenAddSkill={handleOpenAddSkill}
                  initialMode="skills"
                  initialSearch={discoverSearchQuery}
                />
              )}

              {activePage === 'students' && (
                <Discover
                  skills={skills}
                  students={students}
                  onSelectSkill={handleSelectSkill}
                  onSelectStudent={handleSelectStudent}
                  onConnectStudent={handleOpenConnectModal}
                  onOpenAddSkill={handleOpenAddSkill}
                  initialMode="students"
                  initialSearch={discoverSearchQuery}
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
                  isConnected={connections.some((c) => c.studentId === selectedStudent?.id)}
                />
              )}

              {activePage === 'my-skills' && (
                <MySkills
                  currentUser={currentUser}
                  students={students}
                  onOpenAddSkill={handleOpenAddSkill}
                  onRemoveTeachingSkill={handleRemoveTeachingSkill}
                  onRemoveLearningSkill={handleRemoveLearningSkill}
                  onUpdateSkill={handleUpdateSkill}
                  onFindStudentsForSkill={(skill) => {
                    setDiscoverSearchQuery(skill.name);
                    handleNavigate('students');
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
                  onScheduleSession={(conn) =>
                    setScheduleModalData({
                      isOpen: true,
                      connection: conn,
                      partner: { id: conn.studentId, name: conn.name, department: conn.department, avatar: conn.avatar },
                      session: null
                    })
                  }
                />
              )}

              {activePage === 'sessions' && (
                <Sessions
                  currentUser={currentUser}
                  onNavigate={handleNavigate}
                  showToast={showToast}
                  onSessionUpdated={(updatedSession) => {
                    fetchPersonalStats();
                  }}
                  onOpenDiscussion={(conversationId) => {
                    if (conversationId) {
                      handleSelectConversation(conversationId);
                    }
                    handleNavigate('messages');
                  }}
                />
              )}

              {activePage === 'messages' && (
                <Messages
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={handleSelectConversation}
                  onSendMessage={handleSendMessage}
                  currentUser={currentUser}
                  onViewStudentProfile={handleSelectStudent}
                  onScheduleSession={(target) =>
                    setScheduleModalData({
                      isOpen: true,
                      connection: { id: target.connectionId },
                      partner: target.partner,
                      session: null
                    })
                  }
                  isLoading={isConversationsLoading}
                  error={conversationsError}
                  onRetry={fetchUserConversations}
                />
              )}

              {activePage === 'how-it-works' && (
                <HowItWorks onNavigate={handleNavigate} />
              )}

              {activePage === 'settings' && (
                <Settings
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateProfile}
                  onDeleteAccount={handleDeleteAccount}
                  onOpenAddSkill={() => handleOpenAddSkill('teach')}
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

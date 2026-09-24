import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { Send, CheckCheck, User, ArrowLeft } from 'lucide-react';

export default function Messages({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onSendMessage,
  currentUser,
  onViewStudentProfile
}) {
  const [inputText, setInputText] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Active chat
  const activeConv =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    onSendMessage({
      conversationId: activeConv.id,
      text: inputText.trim(),
      sender: 'user',
      time: 'Just now'
    });

    setInputText('');
  };

  const handleSelectConv = (id) => {
    onSelectConversation(id);
    setMobileShowChat(true);
  };

  return (
    <div
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '24px',
        height: 'calc(100vh - 100px)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Container Card */}
      <GlassCard
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          overflow: 'hidden',
          borderRadius: '24px',
          backgroundColor: '#FFFFFF',
          minHeight: 0
        }}
        className="messages-wrapper"
      >
        <style>{`
          @media (max-width: 820px) {
            .messages-wrapper {
              grid-template-columns: 1fr !important;
            }
            .conv-sidebar {
              display: ${mobileShowChat ? 'none !important' : 'flex !important'};
            }
            .chat-main {
              display: ${mobileShowChat ? 'flex !important' : 'none !important'};
            }
          }
        `}</style>

        {/* LEFT: Conversation List */}
        <div
          style={{
            borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            minHeight: 0
          }}
          className="conv-sidebar"
        >
          {/* List Header */}
          <div
            style={{
              padding: '20px 22px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Messages
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#666666', margin: '2px 0 0 0' }}>
                Campus peer dialogues
              </p>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#111111',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}
            >
              {conversations.length} Active
            </span>
          </div>

          {/* Conversations scroll area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#888888', fontSize: '0.85rem' }}>
                No conversations yet. When you connect with peers, your chats will appear here.
              </div>
            ) : (
              conversations.map((conv) => {
              const isActive = activeConv?.id === conv.id;
              const lastMsg = conv.messages?.[conv.messages.length - 1];

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 12px',
                    borderRadius: '16px',
                    backgroundColor: isActive ? '#F2F2EE' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img
                      src={conv.avatar || conv.peerAvatar}
                      alt={conv.studentName || conv.peerName}
                      className="avatar"
                      style={{ width: '46px', height: '46px' }}
                    />
                    {(conv.status === 'Online' || conv.status === 'online' || conv.peerStatus === 'online') && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '0',
                          right: '0',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#111111',
                          border: '2px solid #FFFFFF'
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.925rem', fontWeight: isActive ? 700 : 600, color: '#111111' }}>
                        {conv.studentName || conv.peerName}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#888888' }}>
                        {conv.lastTime || lastMsg?.time}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: (conv.unread || conv.unreadCount) ? '#111111' : '#666666',
                        fontWeight: (conv.unread || conv.unreadCount) ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {lastMsg?.text || 'No messages yet'}
                    </div>
                  </div>

                  {(conv.unread > 0 || conv.unreadCount > 0) && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#000000'
                      }}
                    />
                  )}
                </div>
              );
            }))}
          </div>
        </div>

        {/* RIGHT: Chat Window */}
        {activeConv ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#FFFFFF',
              minHeight: 0
            }}
            className="chat-main"
          >
            {/* Chat Window Header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setMobileShowChat(false)}
                  className="btn btn-ghost btn-sm mobile-back-btn"
                  style={{ display: 'none', padding: '6px' }}
                >
                  <style>{`
                    @media (max-width: 820px) {
                      .mobile-back-btn { display: inline-flex !important; }
                    }
                  `}</style>
                  <ArrowLeft size={16} />
                </button>

                <img
                  src={activeConv.avatar || activeConv.peerAvatar}
                  alt={activeConv.studentName || activeConv.peerName}
                  className="avatar"
                  style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#111111' }}>
                      {activeConv.studentName || activeConv.peerName}
                    </h3>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: (activeConv.status === 'Online' || activeConv.status === 'online' || activeConv.peerStatus === 'online') ? '#111111' : '#888888',
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {activeConv.status || activeConv.peerStatus || 'Online'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#777777', margin: 0 }}>
                    {activeConv.department || activeConv.skillContext || 'Campus Peer'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => onViewStudentProfile && onViewStudentProfile({ id: activeConv.studentId || activeConv.peerId, name: activeConv.studentName || activeConv.peerName })}
                  className="btn btn-secondary btn-sm"
                >
                  <User size={14} />
                  Profile
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                backgroundColor: '#FAFAF8'
              }}
            >
              {/* Privacy Notice Pill */}
              <div style={{ textAlign: 'center', margin: '8px 0 16px 0' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#777777',
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    padding: '4px 12px',
                    borderRadius: '9999px'
                  }}
                >
                  Peer exchange chat verified for {activeConv.studentName || activeConv.peerName} & {currentUser?.name?.split(' ')[0] || 'You'}
                </span>
              </div>

              {activeConv.messages?.map((msg) => {
                const isMe = msg.sender === 'user' || msg.senderId === 'user-current' || msg.senderId === 'user';

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      alignSelf: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 18px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        backgroundColor: isMe ? '#000000' : '#FFFFFF',
                        color: isMe ? '#FFFFFF' : '#111111',
                        border: isMe ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: isMe ? '0 4px 12px rgba(0, 0, 0, 0.12)' : '0 2px 8px rgba(0, 0, 0, 0.03)',
                        fontSize: '0.9rem',
                        lineHeight: 1.45,
                        wordBreak: 'break-word'
                      }}
                    >
                      {msg.text}
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: '#999999',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {msg.time}
                      {isMe && <CheckCheck size={12} strokeWidth={2} />}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Action Suggestion Prompts */}
            <div
              style={{
                padding: '8px 20px',
                borderTop: '1px solid rgba(0, 0, 0, 0.05)',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                backgroundColor: '#FFFFFF'
              }}
            >
              {[
                "Suggest library study session 📚",
                "Can you review my React code? 💻",
                "When is your next free slot? 🕒"
              ].map((promptText, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputText(promptText)}
                  style={{
                    background: '#F5F5F2',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    borderRadius: '9999px',
                    padding: '4px 10px',
                    fontSize: '0.74rem',
                    color: '#333333',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {promptText}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSend}
              style={{
                padding: '14px 20px',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#FFFFFF'
              }}
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeConv.studentName.split(' ')[0]}...`}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#F9F9F7',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="btn btn-primary"
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  opacity: inputText.trim() ? 1 : 0.5
                }}
              >
                <span>Send</span>
                <Send size={15} />
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888888', padding: '40px', textAlign: 'center' }}>
            <User size={38} color="#CCCCCC" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#333333', marginBottom: '4px' }}>
              No active conversation
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#777777', maxWidth: '340px' }}>
              Connect with campus peers or accept incoming requests to start exchanging skills.
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

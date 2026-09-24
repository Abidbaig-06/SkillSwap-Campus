import React, { useState } from 'react';
import ConnectionCard from '../components/ConnectionCard';
import FilterBar from '../components/FilterBar';
import { Users, UserCheck, Clock, Check, MessageSquare } from 'lucide-react';

export default function Connections({
  connections = [],
  onAcceptConnection,
  onDeclineConnection,
  onMessage,
  onViewProfile,
  onNavigate
}) {
  const [activeTab, setActiveTab] = useState('All');

  const pendingCount = connections.filter((c) => c.status?.startsWith('pending')).length;

  const tabs = [
    { value: 'All', label: 'All', count: connections.length },
    { value: 'Teaching', label: 'Teaching', count: connections.filter((c) => c.type === 'Teaching').length },
    { value: 'Learning', label: 'Learning', count: connections.filter((c) => c.type === 'Learning').length },
    { value: 'Pending', label: 'Pending', count: pendingCount }
  ];

  const filteredConnections = connections.filter((c) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return c.status?.startsWith('pending');
    return c.type === activeTab && !c.status?.startsWith('pending');
  });

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 24px 80px 24px' }}>
      {/* Header */}
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
          Campus Connections
        </h1>
        <p style={{ fontSize: '1rem', color: '#6B6B6B' }}>
          Peers you have partnered with to exchange knowledge, review projects, and study together.
        </p>
      </div>

      {/* Tabs Filter Bar */}
      <div style={{ marginBottom: '32px' }}>
        <FilterBar
          options={tabs}
          selected={activeTab}
          onSelect={setActiveTab}
        />
      </div>

      {/* Connections List / Grid */}
      {filteredConnections.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '20px',
            border: '1px solid rgba(0, 0, 0, 0.06)'
          }}
        >
          <UserCheck size={36} color="#888888" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111111', marginBottom: '6px' }}>
            No connections under "{activeTab}"
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#666666', maxWidth: '400px', margin: '0 auto 18px auto' }}>
            Connect with campus classmates by browsing the student directory or exploring skill pages.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="btn btn-primary btn-sm"
          >
            Find Learning Partners
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
          {filteredConnections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              onMessage={() => onMessage(conn)}
              onViewProfile={() => onViewProfile(conn)}
              onAccept={() => onAcceptConnection(conn.id)}
              onDecline={() => onDeclineConnection(conn.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import React from 'react';

export default function GlassCard({ children, className = '', hover = true, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`glass-panel ${hover ? 'glass-panel-hover' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

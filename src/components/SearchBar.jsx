import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search skills, students, or interests...",
  style = {}
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        ...style
      }}
    >
      <Search
        size={18}
        strokeWidth={2}
        style={{
          position: 'absolute',
          left: '16px',
          color: '#888888',
          pointerEvents: 'none'
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '14px 44px 14px 44px',
          fontSize: '0.925rem',
          fontFamily: 'inherit',
          color: '#111111',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#111111';
          e.target.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.07)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
          e.target.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)';
        }}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          style={{
            position: 'absolute',
            right: '14px',
            background: 'rgba(0, 0, 0, 0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#555555'
          }}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

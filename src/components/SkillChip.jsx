import React from 'react';
import { X } from 'lucide-react';

export default function SkillChip({
  name,
  level,
  onRemove,
  onClick,
  active = false,
  removable = false,
  size = 'md', // sm, md, lg
  variant = 'default' // default, dark, outline
}) {
  const getLevelColor = (lvl) => {
    switch (lvl?.toLowerCase()) {
      case 'advanced':
        return '#000000';
      case 'intermediate':
        return '#444444';
      default:
        return '#777777';
    }
  };

  const isClickable = Boolean(onClick);

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '3px 8px' : size === 'lg' ? '7px 14px' : '5px 11px',
        borderRadius: '9999px',
        fontSize: size === 'sm' ? '0.725rem' : size === 'lg' ? '0.875rem' : '0.8rem',
        fontWeight: 500,
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        background: active
          ? '#000000'
          : variant === 'dark'
          ? '#111111'
          : 'rgba(255, 255, 255, 0.85)',
        color: active || variant === 'dark' ? '#FFFFFF' : '#111111',
        border: active
          ? '1px solid #000000'
          : '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: active
          ? '0 2px 8px rgba(0,0,0,0.15)'
          : '0 1px 3px rgba(0,0,0,0.02)',
        userSelect: 'none'
      }}
    >
      <span>{name}</span>
      {level && (
        <span
          style={{
            fontSize: '0.7rem',
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: active || variant === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
            color: active || variant === 'dark' ? '#FFFFFF' : getLevelColor(level),
            fontWeight: 600
          }}
        >
          {level}
        </span>
      )}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: active || variant === 'dark' ? '#FFFFFF' : '#6B6B6B',
            cursor: 'pointer',
            padding: 0,
            marginLeft: '2px'
          }}
          aria-label={`Remove ${name}`}
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

import React from 'react';

export default function FilterBar({
  options = [],
  selected,
  onSelect,
  size = 'md',
  style = {}
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        ...style
      }}
    >
      {options.map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const count = typeof opt === 'object' ? opt.count : null;
        const isSelected = selected === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: size === 'sm' ? '6px 12px' : '8px 16px',
              borderRadius: '9999px',
              fontSize: size === 'sm' ? '0.78rem' : '0.85rem',
              fontWeight: isSelected ? 700 : 500,
              fontFamily: 'inherit',
              border: isSelected ? '1px solid #000000' : '1px solid rgba(0, 0, 0, 0.08)',
              background: isSelected ? '#000000' : 'rgba(255, 255, 255, 0.75)',
              color: isSelected ? '#FFFFFF' : '#444444',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: isSelected ? '0 2px 10px rgba(0,0,0,0.12)' : 'none'
            }}
          >
            <span>{label}</span>
            {count !== null && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.06)',
                  color: isSelected ? '#FFFFFF' : '#666666'
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

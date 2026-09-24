import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.type === 'info' ? (
            <Info size={16} strokeWidth={2.2} />
          ) : (
            <CheckCircle2 size={16} strokeWidth={2.2} />
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1 }}>
            {toast.message}
          </span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#AAAAAA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

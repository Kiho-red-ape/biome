'use client';

import { useEffect } from 'react';
import { LEGAL_DOCS, type LegalDocKey } from '@/lib/legal/documents';

interface LegalModalProps {
  docKey: LegalDocKey;
  onClose: () => void;
}

export function LegalModal({ docKey, onClose }: LegalModalProps) {
  const doc = LEGAL_DOCS[docKey];

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    /* Overlay */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Panel — stop propagation so clicks inside don't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 720, maxHeight: '85vh',
          background: '#0b1014',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 4,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '2px',
            textTransform: 'uppercase', color: '#4dff80',
          }}>
            // {doc.title.toUpperCase()}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: '#4a7055', letterSpacing: '1px',
              padding: '4px 8px',
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '24px 24px 0',
        }}>
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: '#aab8b1', lineHeight: 1.8,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            margin: 0,
          }}>
            {doc.content}
          </pre>
        </div>

        {/* Bottom action */}
        <div style={{ padding: '16px 24px', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '11px 0',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '2px',
              background: 'transparent',
              border: '1px solid rgba(77,255,128,0.2)',
              borderRadius: 3, color: '#4a7055',
              cursor: 'pointer',
            }}
          >
            ← Back to form
          </button>
        </div>
      </div>
    </div>
  );
}

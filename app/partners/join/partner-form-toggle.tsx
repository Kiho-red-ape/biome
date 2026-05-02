'use client';

import { useState } from 'react';
import { PartnerJoinForm } from './partner-join-form';

export function PartnerFormToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display:       'inline-flex',
          alignItems:    'center',
          gap:           8,
          fontFamily:    'var(--font-mono)',
          fontSize:      12,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color:         '#050709',
          background:    '#b7ff61',
          border:        'none',
          padding:       '10px 20px',
          borderRadius:  2,
          cursor:        'pointer',
          transition:    'opacity 150ms ease',
          minHeight:     46,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        Become a partner {open ? '▴' : '▾'}
      </button>

      <div
        style={{
          overflow:   'hidden',
          maxHeight:  open ? 2400 : 0,
          transition: 'max-height 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ paddingTop: 40 }}>
          <PartnerJoinForm />
        </div>
      </div>
    </div>
  );
}

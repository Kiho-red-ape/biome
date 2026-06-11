'use client';

import { useState } from 'react';
import { PartnerJoinForm } from './partner-join-form';

export function PartnerFormToggle() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="btn-primary"
        style={{
          gap: 10,
          transform: 'none',
        }}
      >
        Apply to partner {open ? '▴' : '▾'}
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

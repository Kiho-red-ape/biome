'use client';

import { useState } from 'react';

interface Props {
  amount: number;
}

export function ReimbursementReveal({ amount }: Props) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <div>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            marginBottom: 6,
          }}
        >
          Reimbursement
        </p>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--teal)',
            margin: 0,
            lineHeight: 1,
          }}
        >
          ${amount.toFixed(0)}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--muted)',
            marginTop: 6,
            maxWidth: 220,
            lineHeight: 1.5,
          }}
        >
          reimbursement for your time and contribution
        </p>
      </div>
    );
  }

  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 6,
        }}
      >
        Reimbursement
      </p>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--slate)',
          margin: '0 0 8px',
          lineHeight: 1.4,
        }}
      >
        Available on request
      </p>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.5px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--teal-faint)',
          border: '1px solid var(--teal)',
          color: 'var(--teal-dark)',
          cursor: 'pointer',
        }}
      >
        Show details →
      </button>
    </div>
  );
}

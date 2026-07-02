'use client';

// Sign-in engagement nudge — one calm, dismissible banner computed server-side
// by POST /api/agent/nudge (throttled there to once per 48h). Renders nothing
// when the agent has nothing useful to say.

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Nudge = {
  kind: string;
  title: string;
  message: string;
  href: string;
  cta: string;
};

export function NudgeBanner({ privyDid }: { privyDid: string }) {
  const [nudge, setNudge]         = useState<Nudge | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/agent/nudge', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid }),
    })
      .then((r) => r.json())
      .then((d: { nudge?: Nudge | null }) => {
        if (active && d.nudge) setNudge(d.nudge);
      })
      .catch(() => { /* stay silent — a nudge is never worth an error state */ });
    return () => { active = false; };
  }, [privyDid]);

  if (!nudge || dismissed) return null;

  return (
    <div style={{
      background:   'var(--teal-faint)',
      border:       '1px solid var(--border-soft)',
      borderLeft:   '3px solid var(--teal)',
      borderRadius: 'var(--radius)',
      padding:      '14px 18px',
      marginBottom: 24,
      display:      'flex',
      alignItems:   'center',
      gap:          16,
      flexWrap:     'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
          {nudge.title}
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', marginTop: 3, lineHeight: 1.5 }}>
          {nudge.message}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <Link href={nudge.href} style={{
          fontFamily:     'var(--font-body)',
          fontSize:       13,
          fontWeight:     600,
          color:          '#ffffff',
          background:     'var(--teal)',
          borderRadius:   'var(--radius-sm)',
          padding:        '8px 14px',
          textDecoration: 'none',
        }}>
          {nudge.cta}
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize:   12,
            fontWeight: 500,
            color:      'var(--muted)',
            background: 'none',
            border:     'none',
            padding:    0,
            cursor:     'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

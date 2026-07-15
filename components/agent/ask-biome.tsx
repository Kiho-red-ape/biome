'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { AgentChat } from './agent-chat';

// "Ask BIOME" — the study agent room. Expands into a support-mode chat that has
// the study's actual contents loaded server-side, so it can explain the study
// in plain language. Signed-out users are prompted to sign in.
export function AskBiome({
  experimentId,
  studyTitle,
}: {
  experimentId?: string;
  studyTitle?: string;
}) {
  const { ready, authenticated, user, login } = usePrivy();
  const [open, setOpen] = useState(false);

  const intro = experimentId
    ? `Hi! I can explain anything about ${studyTitle ? `"${studyTitle}"` : 'this study'} in plain language — what it involves, the schedule, samples, your rights, anything. What would you like to know?`
    : 'Hi! I can answer questions about taking part in research on BIOME — how studies work, your rights, what to expect. What would you like to know?';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
          color: 'var(--teal-dark)', background: 'var(--teal-faint)',
          border: '1px solid var(--teal-soft)', borderRadius: 999,
          padding: '9px 18px', cursor: 'pointer',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />
        Ask BIOME{experimentId ? ' about this study' : ''}
      </button>
    );
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px', borderBottom: '1px solid var(--border-soft)', background: 'var(--bg-page)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Ask BIOME
        </span>
        <button
          onClick={() => setOpen(false)}
          style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
      <div style={{ padding: 16 }}>
        {!ready ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>…</p>
        ) : !authenticated || !user ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)', marginBottom: 14 }}>
              Sign in to chat — your conversation is private to your account.
            </p>
            <button onClick={login} className="btn-primary" style={{ minWidth: 130 }}>Sign in</button>
          </div>
        ) : (
          <AgentChat
            stage="support"
            privyDid={user.id}
            experimentId={experimentId}
            intro={intro}
          />
        )}
      </div>
    </div>
  );
}

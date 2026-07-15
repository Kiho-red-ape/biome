'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Two-step destructive action for ops lists: click once to arm, again to fire.
// Sends DELETE with a JSON payload and refreshes the page on success.
export function OpsDeleteButton({
  endpoint,
  payload,
  label = 'Delete',
}: {
  endpoint: string;
  payload: Record<string, unknown>;
  label?: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fire() {
    if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) { setError(data.error ?? 'Failed'); setArmed(false); return; }
      router.refresh();
    } catch {
      setError('Network error');
      setArmed(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => void fire()}
        disabled={busy}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
          padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: busy ? 'default' : 'pointer',
          background: armed ? '#dc2626' : 'transparent',
          border: '1px solid rgba(220,38,38,0.35)',
          color: armed ? '#ffffff' : '#b91c1c',
          opacity: busy ? 0.6 : 1,
          transition: 'background 120ms, color 120ms',
        }}
      >
        {busy ? 'Removing…' : armed ? 'Confirm remove?' : label}
      </button>
      {error && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b91c1c' }}>{error}</span>}
    </span>
  );
}

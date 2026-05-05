'use client';

import { useState } from 'react';

type Props = {
  postId: string;
  label:  string;
  type:   'pdf' | 'image';
};

const mono: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

export default function ArtifactGate({ postId, label, type }: Props) {
  const [email,    setEmail]   = useState('');
  const [url,      setUrl]     = useState<string | null>(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [unlocked, setUnlocked]= useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);

    const res  = await fetch('/api/blog/artifact-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, email }),
    });
    const data = await res.json() as { url?: string; label?: string; error?: string };
    setLoading(false);

    if (!res.ok || data.error) {
      setError(data.error ?? 'Something went wrong. Try again.');
      return;
    }

    setUrl(data.url ?? null);
    setUnlocked(true);
  }

  const typeIcon = type === 'pdf' ? '📄' : '🖼';
  const typeLabel = type === 'pdf' ? 'PDF' : 'Image';

  return (
    <div style={{
      background: 'rgba(255,179,0,0.04)',
      border: '1px solid rgba(255,179,0,0.20)',
      borderLeft: '3px solid #ffb300',
      borderRadius: 4,
      padding: '24px 26px',
    }}>
      {unlocked && url ? (
        /* ── Unlocked state ──────────────────────────────────────────── */
        <div>
          <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#ffb300', marginBottom: 10 }}>
            ✓ UNLOCKED
          </p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--text-white)', fontWeight: 700, marginBottom: 6 }}>
            {label}
          </p>
          <p style={{ ...mono, fontSize: 11, color: '#4a7055', marginBottom: 20 }}>
            Your download is ready. Click below to open the {typeLabel}.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
              background: '#ffb300', color: '#070c07',
              borderRadius: 3, padding: '12px 22px',
              textDecoration: 'none', fontWeight: 700,
            }}
          >
            {typeIcon} Download {typeLabel}
          </a>
        </div>
      ) : (
        /* ── Locked state ─────────────────────────────────────────────── */
        <>
          <p style={{ ...mono, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#ffb300', marginBottom: 10 }}>
            // FREE {typeLabel}
          </p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--text-white)', fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
            {label}
          </p>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#aab8b1', lineHeight: 1.7, marginBottom: 20 }}>
            Enter your email to unlock the free download. No spam — just this {typeLabel}.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@org.com"
                style={{
                  ...mono, fontSize: 13, color: 'var(--text-bright)',
                  background: 'var(--bg)', border: '1px solid rgba(255,179,0,0.25)',
                  borderRadius: 3, padding: '11px 14px', width: '100%', boxSizing: 'border-box',
                }}
              />
              {error && <p style={{ ...mono, fontSize: 10, color: '#ff6b6b', marginTop: 6 }}>{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                ...mono, fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
                background: '#ffb300', color: '#070c07',
                border: 'none', borderRadius: 3, padding: '12px 20px',
                cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Unlocking...' : `Get the ${typeLabel} →`}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

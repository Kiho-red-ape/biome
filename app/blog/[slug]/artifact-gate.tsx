'use client';

import { useState } from 'react';

interface Props {
  artifactUrl:   string;
  artifactLabel: string;
  postSlug:      string;
}

export function ArtifactGate({ artifactUrl, artifactLabel, postSlug }: Props) {
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!email.includes('@') || !email.includes('.')) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');

    // Fire-and-forget notification
    fetch('/api/contact', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:         email,
        email,
        subject:      `Artifact download — ${postSlug}`,
        message:      `${email} downloaded the artifact for post: ${postSlug}\nArtifact: ${artifactUrl}`,
        organization: '—',
        role:         'reader',
        study_detail: postSlug,
        help_needed:  'artifact-download',
      }),
    }).catch(() => null);

    setSubmitted(true);
    setLoading(false);
  }

  const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ ...MONO, fontSize: 12, color: '#b7ff61' }}>
          ✓ Email noted. Your download is ready:
        </p>
        <a
          href={artifactUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...MONO, fontSize: 12, fontWeight: 700,
            display:    'inline-flex',
            padding:    '12px 28px',
            background: '#b7ff61',
            color:      '#050709',
            borderRadius: 2,
            textDecoration: 'none',
            alignSelf: 'flex-start',
          }}
        >
          {artifactLabel} ↓
        </a>
        <p style={{ ...MONO, fontSize: 11, color: '#5b8a9a', lineHeight: 1.6 }}>
          We may follow up with related resources. Unsubscribe anytime.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="your@email.com"
          required
          style={{
            ...MONO, fontSize: 13, flex: 1, minWidth: 200,
            padding:    '10px 14px',
            background: 'rgba(255,255,255,0.03)',
            border:     `1px solid ${error ? 'rgba(255,100,100,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 2, color: '#f2faf4', outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            ...MONO, fontSize: 12, fontWeight: 700,
            padding:  '10px 24px',
            background: '#b7ff61', color: '#050709',
            border: 'none', borderRadius: 2, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '…' : 'Get it →'}
        </button>
      </div>
      {error && <p style={{ ...MONO, fontSize: 11, color: '#ff6464' }}>{error}</p>}
      <p style={{ ...MONO, fontSize: 11, color: '#5b8a9a' }}>
        No spam. Just the file and occasional related updates.
      </p>
    </form>
  );
}

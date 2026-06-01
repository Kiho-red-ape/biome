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

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize:   14,
          fontWeight: 600,
          color:      'var(--black)',
        }}>
          Email noted. Your download is ready:
        </p>
        <a
          href={artifactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ alignSelf: 'flex-start', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          {artifactLabel} ↓
        </a>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize:   12,
          color:      'var(--gray)',
          lineHeight: 1.6,
        }}>
          We may follow up with related resources. Unsubscribe anytime.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="your@email.com"
          required
          style={{
            flex:        1,
            minWidth:    200,
            borderRight: 'none',
            borderColor: error ? '#dc2626' : 'var(--black)',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ borderRadius: 0, cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
        >
          {loading ? '…' : 'Get it →'}
        </button>
      </div>
      {error && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#dc2626', margin: 0 }}>
          {error}
        </p>
      )}
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray)', margin: 0 }}>
        No spam. Just the file and occasional related updates.
      </p>
    </form>
  );
}

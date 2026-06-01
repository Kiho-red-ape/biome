'use client';

import { useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export function ClosingCta() {
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [formState, setFormState] = useState<FormState>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setFormState('submitting');
    try {
      const res = await fetch('/api/callback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      setFormState(res.ok ? 'success' : 'error');
    } catch {
      setFormState('error');
    }
  }

  return (
    <section style={{ background: 'var(--navy)', borderBottom: '3px solid var(--black)' }}>
      <div className="section-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h2 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     'clamp(26px, 3vw, 40px)',
          color:        'var(--white)',
          marginBottom: 40,
          lineHeight:   1.1,
        }}>
          Running a study?<br />
          <span style={{ color: 'var(--amber)' }}>Let&apos;s talk.</span>
        </h2>

        {formState === 'success' ? (
          <div style={{
            border:      '3px solid var(--amber)',
            background:  'rgba(245,158,11,0.08)',
            padding:     '32px 40px',
            maxWidth:    480,
            textAlign:   'center',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--amber)', marginBottom: 8 }}>
              Request received.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>
              We&apos;ll be in touch at {email}.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480, width: '100%' }}
          >
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={formState === 'submitting'}
              style={{
                width:   '100%',
                opacity: formState === 'submitting' ? 0.6 : 1,
                cursor:  formState === 'submitting' ? 'not-allowed' : 'pointer',
              }}
            >
              {formState === 'submitting' ? 'Sending...' : 'Request callback →'}
            </button>
            {formState === 'error' && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#f87171', textAlign: 'center' }}>
                Something went wrong. Email contact@biome.to directly.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}

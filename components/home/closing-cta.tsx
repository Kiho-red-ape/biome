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

  const inputStyle: React.CSSProperties = {
    fontFamily:      'var(--font-mono)',
    fontSize:        13,
    color:           '#f2faf4',
    background:      'rgba(255,255,255,0.04)',
    border:          '1px solid rgba(255,255,255,0.12)',
    borderRadius:    2,
    padding:         '0 16px',
    height:          46,
    width:           '100%',
    outline:         'none',
    letterSpacing:   '0.3px',
  };

  return (
    <section
      style={{
        paddingTop:    96,
        paddingBottom: 96,
        maxWidth:      600,
        margin:        '0 auto',
        textAlign:     'center',
        borderTop:     '1px solid rgba(255,255,255,0.06)',
      }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        letterSpacing: '3px',
        color:         '#b7ff61',
        textTransform: 'uppercase',
        marginBottom:  24,
      }}>
        // REQUEST_CALLBACK
      </p>

      <h2 style={{
        fontFamily:   'var(--font-heading)',
        fontWeight:   700,
        fontSize:     'clamp(22px, 3vw, 32px)',
        lineHeight:   1.2,
        color:        '#f2faf4',
        marginBottom: 16,
      }}>
        If you&apos;re running a study that doesn&apos;t need a CRO, we should talk.
      </h2>

      <p style={{
        fontFamily:   'var(--font-mono)',
        fontSize:     13,
        color:        '#5b8a9a',
        lineHeight:   1.7,
        marginBottom: 40,
      }}>
        Leave your name and email. We&apos;ll reach out within one business day.
      </p>

      {formState === 'success' ? (
        <div style={{
          background:   'rgba(183,255,97,0.06)',
          border:       '1px solid rgba(183,255,97,0.2)',
          borderRadius: 4,
          padding:      '32px 24px',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#b7ff61', marginBottom: 8 }}>
            Request received.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#5b8a9a' }}>
            We&apos;ll be in touch at {email}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={formState === 'submitting'}
            style={{
              fontFamily:     'var(--font-mono)',
              fontSize:       12,
              letterSpacing:  '1.5px',
              textTransform:  'uppercase',
              color:          '#050709',
              background:     formState === 'submitting' ? 'rgba(183,255,97,0.5)' : '#b7ff61',
              border:         'none',
              height:         46,
              cursor:         formState === 'submitting' ? 'not-allowed' : 'pointer',
              borderRadius:   2,
              transition:     'background 150ms ease',
              width:          '100%',
            }}
          >
            {formState === 'submitting' ? 'Sending...' : 'Request callback →'}
          </button>

          {formState === 'error' && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff6b6b', textAlign: 'center' }}>
              Something went wrong. Email kishore@biome.to directly.
            </p>
          )}
        </form>
      )}
    </section>
  );
}

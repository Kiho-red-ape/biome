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
    fontFamily:    'var(--font-mono)',
    fontSize:      13,
    color:         '#f8fafc',
    background:    'rgba(248,250,252,0.03)',
    border:        '1px solid rgba(248,250,252,0.1)',
    padding:       '0 16px',
    height:        46,
    width:         '100%',
    outline:       'none',
    letterSpacing: '0.3px',
    borderRadius:  0,
  };

  return (
    <section
      style={{
        paddingTop:    96,
        paddingBottom: 96,
        maxWidth:      600,
        margin:        '0 auto',
        textAlign:     'center',
        borderTop:     '1px solid rgba(248,250,252,0.06)',
      }}
      className="px-4 sm:px-6 lg:px-10"
    >
      <p style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      10,
        letterSpacing: '3px',
        color:         '#f59e0b',
        textTransform: 'uppercase',
        marginBottom:  24,
      }}>
        Request Callback
      </p>

      <h2 style={{
        fontFamily:   'var(--font-heading)',
        fontWeight:   700,
        fontSize:     'clamp(22px, 3vw, 32px)',
        lineHeight:   1.2,
        color:        '#f8fafc',
        marginBottom: 16,
      }}>
        Running a study and need the operational layer handled?
      </h2>

      <p style={{
        fontFamily:   'var(--font-body)',
        fontSize:     14,
        color:        '#475569',
        lineHeight:   1.7,
        marginBottom: 40,
      }}>
        Leave your name and email. We&apos;ll reach out within one business day.
      </p>

      {formState === 'success' ? (
        <div style={{
          background:  'rgba(245,158,11,0.05)',
          border:      '2px solid rgba(245,158,11,0.25)',
          padding:     '32px 24px',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#f59e0b', marginBottom: 8 }}>
            Request received.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#475569' }}>
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
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.45)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(248,250,252,0.1)'; }}
          />
          <input
            type="email"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.45)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(248,250,252,0.1)'; }}
          />
          <button
            type="submit"
            disabled={formState === 'submitting'}
            style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      12,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color:         '#060a14',
              background:    formState === 'submitting' ? 'rgba(245,158,11,0.5)' : '#f59e0b',
              border:        'none',
              height:        46,
              cursor:        formState === 'submitting' ? 'not-allowed' : 'pointer',
              transition:    'background 150ms ease',
              width:         '100%',
            }}
          >
            {formState === 'submitting' ? 'Sending...' : 'Request callback →'}
          </button>

          {formState === 'error' && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#f87171', textAlign: 'center' }}>
              Something went wrong. Email contact@biome.to directly.
            </p>
          )}
        </form>
      )}
    </section>
  );
}

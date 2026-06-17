'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useSearchParams } from 'next/navigation';
import { SiteHeader } from '@/components/nav/header';
import Link from 'next/link';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  costUsd?: number;
};

type Usage = { inputTokens: number; outputTokens: number; costUsd: number };

const BASE_SUGGESTIONS = [
  'What ABDM steps do I need to complete to access patient diagnostic data?',
  'Which diagnostic labs can handle 16S rRNA microbiome sequencing in India?',
  'How do I approach an IEC for retrospective blood test data in Tamil Nadu?',
];

export default function OMEPage() {
  const { authenticated, user, login } = usePrivy();
  const searchParams = useSearchParams();

  const studyId    = searchParams.get('study') ?? undefined;
  const studyTitle = searchParams.get('title') ?? undefined;

  const [messages,        setMessages]        = useState<Message[]>([]);
  const [input,           setInput]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [sessionId,       setSessionId]       = useState<string | undefined>();
  const [totalCost,       setTotalCost]       = useState(0);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Build suggestions: study-specific first suggestion when study context is present
  const suggestions: string[] = studyId && studyTitle
    ? [
        `Find hospitals in India suitable for recruiting research partners for this study`,
        ...BASE_SUGGESTIONS,
      ]
    : [
        'Find hospitals in Bengaluru for a gut microbiome study needing stool samples',
        ...BASE_SUGGESTIONS,
      ];

  async function send(text: string) {
    if (!text.trim() || loading || !authenticated) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const body: Record<string, string | undefined> = {
        message:   text,
        sessionId,
      };
      if (studyId) body.experimentId = studyId;

      const res = await fetch('/api/ome/chat', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-privy-did':  user?.id ?? '',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json() as {
        sessionId?: string;
        reply?: string;
        usage?: Usage;
        error?: string;
      };

      if (data.error) throw new Error(data.error);

      if (data.sessionId) setSessionId(data.sessionId);
      if (data.usage)     setTotalCost((c) => c + (data.usage?.costUsd ?? 0));

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply ?? '', costUsd: data.usage?.costUsd },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${String(e)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };
  const isEmpty = messages.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 16px 120px' }}>

        {/* Header */}
        <div style={{ marginBottom: studyId && !bannerDismissed ? 12 : 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ ...MONO, color: '#fff', fontSize: 13, fontWeight: 700 }}>OME</span>
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--ink)', margin: 0 }}>
                OME — Recruitment Intelligence
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Locate hospitals, labs &amp; clinics across India · ABDM &amp; ICMR compliant guidance
              </p>
            </div>
          </div>
          {totalCost > 0 && (
            <p style={{ ...MONO, fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              session cost: ${totalCost.toFixed(5)}
            </p>
          )}
        </div>

        {/* Study context banner */}
        {studyId && !bannerDismissed && (
          <div style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'space-between',
            gap:             12,
            background:      'var(--teal-faint)',
            border:          '1px solid var(--border-soft)',
            borderRadius:    'var(--radius-sm)',
            padding:         '10px 16px',
            marginBottom:    28,
          }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize:   13,
              color:      'var(--teal-dark)',
              lineHeight: 1.4,
            }}>
              Loaded study:{' '}
              <strong>{studyTitle ?? studyId}</strong>
            </span>
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss"
              style={{
                background:  'none',
                border:      'none',
                cursor:      'pointer',
                fontFamily:  'var(--font-mono)',
                fontSize:    12,
                color:       'var(--teal-dark)',
                flexShrink:  0,
                padding:     '2px 6px',
                opacity:     0.7,
              }}>
              ✕
            </button>
          </div>
        )}

        {/* Auth gate */}
        {!authenticated && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)', padding: '40px 32px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--slate)', marginBottom: 20 }}>
              Sign in to use OME.
            </p>
            <button onClick={() => login()} className="btn-primary" style={{ minWidth: 140 }}>
              Sign in
            </button>
          </div>
        )}

        {/* Empty state */}
        {authenticated && isEmpty && (
          <div style={{ marginBottom: 32 }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--slate)',
              marginBottom: 16, lineHeight: 1.6,
            }}>
              Ask OME to find the right hospitals, labs, or diagnostic networks for your study —
              or get step-by-step guidance on ABDM, IEC applications, and compliant data access.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => void send(s)}
                  style={{
                    textAlign: 'left', padding: '10px 16px',
                    background: 'var(--surface)', border: '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--teal-faint)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {authenticated && messages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                gap: 10, alignItems: 'flex-start',
              }}>
                {/* Avatar */}
                <div style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                  background: m.role === 'user' ? 'var(--teal-soft)' : 'var(--teal)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    ...MONO, fontSize: 10, fontWeight: 700,
                    color: m.role === 'user' ? 'var(--teal-dark)' : '#fff',
                  }}>
                    {m.role === 'user' ? 'YOU' : 'OME'}
                  </span>
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: '75%',
                  background: m.role === 'user' ? 'var(--teal-soft)' : 'var(--surface)',
                  border: `1px solid ${m.role === 'user' ? 'rgba(14,116,144,0.15)' : 'var(--border-soft)'}`,
                  borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 14,
                    color: m.role === 'user' ? 'var(--teal-dark)' : 'var(--ink)',
                    margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.65,
                  }}>
                    {m.content}
                  </p>
                  {m.role === 'assistant' && m.costUsd !== undefined && (
                    <p style={{ ...MONO, fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>
                      ${m.costUsd.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: '#fff' }}>OME</span>
                </div>
                <div style={{
                  padding: '12px 16px', background: 'var(--surface)',
                  border: '1px solid var(--border-soft)', borderRadius: 'var(--radius-sm)',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--muted)' }}>
                    thinking…
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        {authenticated && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(8px)',
            borderTop: '1px solid var(--border-soft)', padding: '16px',
          }}>
            <form
              onSubmit={handleSubmit}
              style={{ maxWidth: 820, margin: '0 auto', display: 'flex', gap: 8 }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask OME about hospitals, compliance, recruitment strategy…"
                disabled={loading}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: 'var(--surface)', color: 'var(--ink)',
                  border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--teal)')}
                onBlur={(e)  => (e.target.style.borderColor = 'var(--border-mid)')}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary"
                style={{ minWidth: 80 }}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

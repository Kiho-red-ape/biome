'use client';

// Researcher side of the per-study chat room. Fetches the study thread
// (participants shown by pseudonym), polls for new messages, and lets the
// researcher broadcast a message to all enrolled participants.

import { useState, useEffect, useCallback, useRef } from 'react';

interface ChatMessage {
  id: string;
  fromResearcher: boolean;
  isSystem: boolean;
  senderLabel: string;
  broadcast: boolean;
  text: string;
  createdAt: string;
}

interface Props {
  experimentId: string;
  privyDid: string;
}

function relTime(d: string): string {
  const secs = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function StudyChat({ experimentId, privyDid }: Props) {
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [draft,     setDraft]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [sendErr,   setSendErr]   = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(
        `/api/study/${experimentId}/researcher-messages?privyDid=${encodeURIComponent(privyDid)}`,
      );
      const data = await res.json() as { messages?: ChatMessage[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to load messages');
        return;
      }
      setError(null);
      setMessages(data.messages ?? []);
    } catch {
      setError('Failed to load messages');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [experimentId, privyDid]);

  useEffect(() => {
    void load(true);
    const t = setInterval(() => { void load(false); }, 15_000);
    return () => clearInterval(t);
  }, [load]);

  // Keep the thread scrolled to the latest message.
  useEffect(() => {
    const el = threadRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setSendErr(null);
    try {
      const res = await fetch(`/api/study/${experimentId}/researcher-messages`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid, messageText: text }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setSendErr(data.error ?? 'Failed to send message');
        return;
      }
      setDraft('');
      await load(false);
    } catch {
      setSendErr('Failed to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{
      background:   'var(--surface)',
      border:       '1px solid var(--border-soft)',
      borderRadius: 'var(--radius)',
      boxShadow:    'var(--shadow-sm)',
      overflow:     'hidden',
    }}>
      <div style={{
        padding:      '14px 24px',
        borderBottom: '1px solid var(--border-soft)',
        fontFamily:   'var(--font-body)',
        fontSize:     11,
        fontWeight:   600,
        letterSpacing:'2px',
        textTransform:'uppercase',
        color:        'var(--slate)',
        background:   'var(--bg-page)',
      }}>
        Chat
      </div>

      {/* Thread */}
      <div
        ref={threadRef}
        style={{
          maxHeight: 420,
          overflowY: 'auto',
          padding:   '18px 20px',
          display:   'flex',
          flexDirection: 'column',
          gap:       12,
          background:'var(--surface)',
        }}>
        {loading ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>Loading…</p>
        ) : error ? (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#dc2626' }}>{error}</p>
        ) : messages.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)' }}>
            No messages yet. Send the first message to your enrolled participants below.
          </p>
        ) : (
          messages.map((m) => {
            if (m.isSystem) {
              return (
                <div key={m.id} style={{ textAlign: 'center' }}>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize:   12,
                    fontStyle:  'italic',
                    color:      'var(--muted)',
                    margin:     0,
                  }}>
                    {m.text}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', margin: '2px 0 0' }}>
                    {relTime(m.createdAt)}
                  </p>
                </div>
              );
            }
            const mine = m.fromResearcher;
            return (
              <div key={m.id} style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     mine ? 'flex-end' : 'flex-start',
              }}>
                {!mine && (
                  <span style={{
                    fontFamily:    'var(--font-mono)',
                    fontSize:      10,
                    color:         'var(--muted)',
                    margin:        '0 0 3px 2px',
                    letterSpacing: '0.5px',
                  }}>
                    {m.senderLabel}
                  </span>
                )}
                <div style={{
                  maxWidth:     '78%',
                  padding:      '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background:   mine ? 'var(--teal-faint)' : 'var(--surface)',
                  border:       mine ? '1px solid var(--teal-soft)' : '1px solid var(--border-soft)',
                }}>
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontSize:   13,
                    lineHeight: 1.55,
                    color:      'var(--ink)',
                    margin:     0,
                    whiteSpace: 'pre-wrap',
                    wordBreak:  'break-word',
                  }}>
                    {m.text}
                  </p>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   10,
                  color:      'var(--muted)',
                  margin:     mine ? '3px 2px 0 0' : '3px 0 0 2px',
                }}>
                  {relTime(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div style={{ borderTop: '1px solid var(--border-soft)', padding: '16px 20px', background: 'var(--bg-page)' }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message to all enrolled participants…"
          rows={3}
          maxLength={4000}
          className="outline-none resize-y"
          style={{
            width:        '100%',
            fontFamily:   'var(--font-body)',
            fontSize:     14,
            lineHeight:   1.55,
            padding:      '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border:       '1px solid var(--border-mid)',
            color:        'var(--ink)',
            background:   'var(--surface)',
            boxSizing:    'border-box',
          }}
        />
        {sendErr && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#dc2626', margin: '8px 0 0' }}>{sendErr}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              fontFamily:   'var(--font-body)',
              fontSize:     13,
              fontWeight:   600,
              padding:      '8px 18px',
              borderRadius: 'var(--radius-sm)',
              background:   'var(--teal)',
              color:        '#ffffff',
              border:       'none',
              cursor:       'pointer',
            }}>
            {sending ? 'Sending…' : 'Send to all participants'}
          </button>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.55, margin: '10px 0 0' }}>
          Messages are visible to all enrolled participants. Participants appear under study pseudonyms — real
          identities stay protected.
        </p>
      </div>
    </div>
  );
}

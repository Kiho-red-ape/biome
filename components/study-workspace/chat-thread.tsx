'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { DashCard, CardLabel } from '@/components/dashboard/card';

// ── Types ────────────────────────────────────────────────────────────────────

type DisplayMessage = {
  id: string;
  senderType: string;
  senderLabel: string;
  isMe: boolean;
  recipientType: string;
  text: string;
  messageType: string;
  readAt: string | null;
  createdAt: string;
};

type FetchResult = {
  messages: DisplayMessage[];
  myStudyId: string | null;
  myPseudonym: string | null;
};

interface ChatThreadProps {
  experimentId: string;
  privyDid: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// ── Component ────────────────────────────────────────────────────────────────

export function ChatThread({ experimentId, privyDid }: ChatThreadProps) {
  const [result,   setResult]   = useState<FetchResult | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(false);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [sendErr,  setSendErr]  = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    setFetchErr(false);
    try {
      const res  = await fetch(
        `/api/study/${experimentId}/messages?privyDid=${encodeURIComponent(privyDid)}`,
      );
      const data = (await res.json()) as FetchResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'fetch error');
      setResult(data);
    } catch {
      setFetchErr(true);
    } finally {
      setLoading(false);
    }
  }, [experimentId, privyDid]);

  // Initial fetch
  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  // Poll every 15 seconds
  useEffect(() => {
    const id = setInterval(() => { void fetchMessages(); }, 15_000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result?.messages.length]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setSendErr(false);
    try {
      const res = await fetch(
        `/api/study/${experimentId}/messages?privyDid=${encodeURIComponent(privyDid)}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ message_text: trimmed }),
        },
      );
      if (!res.ok) throw new Error('send failed');
      setText('');
      await fetchMessages();
    } catch {
      setSendErr(true);
    } finally {
      setSending(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashCard>
      <CardLabel>Study Messages</CardLabel>

      {loading ? (
        <div style={{
          padding:    '32px 24px',
          textAlign:  'center',
          fontFamily: 'var(--font-body)',
          fontSize:   14,
          color:      'var(--muted)',
        }}>
          Loading messages...
        </div>
      ) : fetchErr ? (
        <div style={{
          padding:    '32px 24px',
          textAlign:  'center',
          fontFamily: 'var(--font-body)',
          fontSize:   14,
          color:      '#dc2626',
        }}>
          Could not load messages. Try again.
          <button
            onClick={() => void fetchMessages()}
            style={{
              marginLeft:   12,
              fontFamily:   'var(--font-body)',
              fontSize:     13,
              fontWeight:   600,
              color:        'var(--teal-dark)',
              background:   'var(--teal-soft)',
              border:       'none',
              borderRadius: 'var(--radius-sm)',
              padding:      '5px 12px',
              cursor:       'pointer',
            }}
          >
            Retry
          </button>
        </div>
      ) : result?.myStudyId === null ? (
        <div style={{
          padding:      '24px',
          margin:       '16px 24px',
          borderRadius: 'var(--radius-sm)',
          background:   'var(--teal-faint)',
          border:       '1px solid var(--teal-soft)',
          fontFamily:   'var(--font-body)',
          fontSize:     14,
          color:        'var(--teal-dark)',
          lineHeight:   1.6,
        }}>
          Your pseudonymous study identity is being set up. Chat will be available once the research team enrolls you.
        </div>
      ) : (
        <>
          {/* Message list */}
          <div
            ref={scrollRef}
            style={{
              maxHeight:    400,
              overflowY:    'auto',
              padding:      '16px 20px',
              display:      'flex',
              flexDirection: 'column',
              gap:          12,
            }}
          >
            {(result?.messages ?? []).length === 0 ? (
              <div style={{
                textAlign:  'center',
                fontFamily: 'var(--font-body)',
                fontSize:   13,
                color:      'var(--muted)',
                padding:    '16px 0',
              }}>
                No messages yet. Send a message to the research team below.
              </div>
            ) : (
              (result?.messages ?? []).map((m) => {
                // System notices: centered italic
                if (m.messageType === 'system_notice') {
                  return (
                    <div
                      key={m.id}
                      style={{
                        textAlign:  'center',
                        fontFamily: 'var(--font-body)',
                        fontSize:   12,
                        color:      'var(--muted)',
                        fontStyle:  'italic',
                        padding:    '4px 0',
                      }}
                    >
                      {m.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    style={{
                      display:       'flex',
                      flexDirection: 'column',
                      alignItems:    m.isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {/* Sender label */}
                    <div style={{
                      fontFamily:    'var(--font-mono)',
                      fontSize:      10,
                      color:         'var(--muted)',
                      marginBottom:  3,
                    }}>
                      {m.senderLabel}
                    </div>

                    {/* Bubble */}
                    <div style={{
                      maxWidth:     '72%',
                      padding:      '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background:   m.isMe ? 'var(--teal-faint)' : 'var(--surface)',
                      border:       '1px solid var(--border-soft)',
                      fontFamily:   'var(--font-body)',
                      fontSize:     14,
                      color:        'var(--ink)',
                      lineHeight:   1.5,
                      wordBreak:    'break-word',
                    }}>
                      {m.text}
                    </div>

                    {/* Timestamp */}
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   10,
                      color:      'var(--muted)',
                      marginTop:  3,
                    }}>
                      {fmtTime(m.createdAt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Send form */}
          <div style={{
            borderTop: '1px solid var(--border-soft)',
            padding:   '16px 20px',
            display:   'flex',
            gap:       10,
            alignItems: 'flex-end',
          }}>
            <textarea
              rows={2}
              value={text}
              onChange={(e) => { setText(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Message the research team..."
              disabled={sending}
              style={{
                flex:         1,
                fontFamily:   'var(--font-body)',
                fontSize:     14,
                color:        'var(--ink)',
                background:   'var(--bg-page)',
                border:       '1px solid var(--border-mid)',
                borderRadius: 'var(--radius-sm)',
                padding:      '10px 12px',
                resize:       'none',
                outline:      'none',
                lineHeight:   1.5,
              }}
            />
            <button
              onClick={() => void send()}
              disabled={!text.trim() || sending}
              style={{
                fontFamily:   'var(--font-body)',
                fontSize:     13,
                fontWeight:   600,
                background:   !text.trim() || sending ? 'var(--border-mid)' : 'var(--teal)',
                color:        '#ffffff',
                border:       'none',
                borderRadius: 'var(--radius-sm)',
                padding:      '10px 16px',
                cursor:       !text.trim() || sending ? 'not-allowed' : 'pointer',
                whiteSpace:   'nowrap',
                flexShrink:   0,
              }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>

          {sendErr && (
            <div style={{
              padding:    '0 20px 12px',
              fontFamily: 'var(--font-body)',
              fontSize:   12,
              color:      '#dc2626',
            }}>
              Message failed to send. Please try again.
            </div>
          )}
        </>
      )}
    </DashCard>
  );
}

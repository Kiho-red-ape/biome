'use client';

// Announcement composer: sends an in-app notification to every enrolled
// participant of the study via POST /api/study/[id]/broadcast.

import { useState } from 'react';

interface Props {
  experimentId: string;
  privyDid: string;
}

export function NotifyComposer({ experimentId, privyDid }: Props) {
  const [title,   setTitle]   = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function send() {
    if (!title.trim() || !message.trim()) {
      setError('Both a title and a message are required.');
      return;
    }
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/study/${experimentId}/broadcast`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ privyDid, title: title.trim(), message: message.trim() }),
      });
      const data = await res.json() as { ok?: boolean; sent?: number; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Failed to send notification.');
        return;
      }
      const sent = data.sent ?? 0;
      setSuccess(`Sent to ${sent} participant${sent !== 1 ? 's' : ''}`);
      setTitle('');
      setMessage('');
    } catch {
      setError('Failed to send notification.');
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
        Announcement
      </div>

      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate)', lineHeight: 1.6, margin: 0 }}>
          Sends a one-off in-app notification to every enrolled participant.
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Visit 2 scheduling is now open"
            maxLength={140}
            className="outline-none"
            style={{ fontFamily: 'var(--font-body)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Message
          </span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write the announcement participants will see in their dashboard."
            rows={4}
            maxLength={1000}
            className="outline-none resize-y"
            style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.55, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-mid)', color: 'var(--ink)', background: 'var(--bg-page)' }}
          />
        </label>

        {error && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#dc2626', margin: 0 }}>{error}</p>
        )}
        {success && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal-dark)', margin: 0 }}>{success}</p>
        )}

        <div>
          <button
            onClick={send}
            disabled={sending || !title.trim() || !message.trim()}
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
            {sending ? 'Sending…' : 'Notify participants'}
          </button>
        </div>
      </div>
    </div>
  );
}

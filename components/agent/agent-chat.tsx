'use client';

import { useEffect, useRef, useState } from 'react';

type Stage = 'onboard' | 'screen' | 'consent' | 'support';

type ChatMsg = {
  role: 'agent' | 'participant';
  text: string;
  ts: number;
  flagged?: boolean;
};

type ConverseResponse = {
  conversationId: string;
  reply: string;
  extracted?: unknown;
  flagged?: boolean;
  flagReason?: string | null;
  status?: string;
  done?: boolean;
};

export function AgentChat({
  privyDid,
  stage,
  experimentId,
  intro,
  onDone,
}: {
  privyDid: string;
  stage: Stage;
  experimentId?: string;
  intro: string;
  onDone?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'agent', text: intro, ts: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pendingRetry, setPendingRetry] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setError(null);
    setPendingRetry(null);
    setMessages((m) => [...m, { role: 'participant', text: trimmed, ts: Date.now() }]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/agent/converse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyDid, stage, message: trimmed, experimentId }),
      });
      const json = (await res.json()) as ConverseResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Something went wrong.');

      setMessages((m) => [
        ...m,
        { role: 'agent', text: json.reply, ts: Date.now(), flagged: json.flagged },
      ]);

      if (json.done && !done) {
        setDone(true);
        onDone?.();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error.');
      setPendingRetry(trimmed);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-soft)',
        borderRadius: 'var(--radius)',
        background: 'var(--bg-page)',
        overflow: 'hidden',
      }}
    >
      {/* Message list */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: 420,
          overflowY: 'auto',
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}

        {sending && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                color: 'var(--muted)',
                letterSpacing: 2,
              }}
              aria-label="Agent is typing"
            >
              …
            </div>
          </div>
        )}

        {done && (
          <div
            style={{
              alignSelf: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--teal-dark)',
              background: 'var(--teal-faint)',
              border: '1px solid var(--teal-soft)',
              borderRadius: 999,
              padding: '4px 12px',
              marginTop: 4,
            }}
          >
            Conversation complete
          </div>
        )}
      </div>

      {/* Error / retry */}
      {error && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-soft)',
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#dc2626' }}>
            {error}
          </span>
          {pendingRetry && (
            <button
              onClick={() => void send(pendingRetry)}
              disabled={sending}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                color: '#ffffff',
                background: '#dc2626',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          borderTop: '1px solid var(--border-soft)',
          background: 'var(--surface)',
          padding: 12,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          rows={1}
          placeholder="Type your message…"
          style={{
            flex: 1,
            resize: 'none',
            minHeight: 44,
            maxHeight: 120,
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--ink)',
            background: 'var(--bg-page)',
            border: '1px solid var(--border-mid)',
            borderRadius: 'var(--radius-sm)',
            padding: '11px 12px',
            outline: 'none',
          }}
        />
        <button
          onClick={() => void send(input)}
          disabled={sending || !input.trim()}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            color: '#ffffff',
            background: sending || !input.trim() ? 'var(--muted)' : 'var(--teal)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '0 18px',
            height: 44,
            flexShrink: 0,
            cursor: sending || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: ChatMsg }) {
  const isParticipant = msg.role === 'participant';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isParticipant ? 'flex-end' : 'flex-start',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          background: isParticipant ? 'var(--teal-faint)' : 'var(--surface)',
          border: isParticipant ? '1px solid var(--teal-soft)' : '1px solid var(--border-soft)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          lineHeight: 1.5,
          color: 'var(--ink)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {msg.text}
      </div>

      {msg.flagged && (
        <div
          style={{
            marginTop: 6,
            maxWidth: '85%',
            background: 'var(--teal-faint)',
            border: '1px solid var(--teal-soft)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--teal-dark)',
          }}
        >
          A member of the BIOME team will follow up with you personally.
        </div>
      )}
    </div>
  );
}

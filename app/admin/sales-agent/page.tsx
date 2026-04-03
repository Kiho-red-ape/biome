'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const QUICK_PROMPTS = [
  'Find 10 supplement brand leads in the US',
  'Find 5 university researcher leads in India',
  'What should I focus on this week?',
  'Write a cold email to a sleep supplement brand',
  'Write a cold email to a university nutrition researcher',
  'Draft a LinkedIn DM for a CRO business development lead',
  'Generate a weekly pipeline report template',
  'Find 5 DeSci project leads (VitaDAO, etc.)',
];

export default function SalesAgentPage() {
  const { user, ready, authenticated } = usePrivy();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [denied, setDenied]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); }
  }, [ready, authenticated, user, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading || !user) return;
    setError(null);

    const userMsg: Message = { role: 'user', content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    // Placeholder for streaming assistant reply
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/sales-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyDid: user.id,
          messages: nextMessages,
        }),
      });

      if (res.status === 403) { setDenied(true); setLoading(false); return; }
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? 'Request failed');
        setMessages((prev) => prev.slice(0, -1)); // remove empty assistant placeholder
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setLoading(false); return; }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [loading, messages, user]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING...</span>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="mono text-xs" style={{ color: '#ff8f8f' }}>// ACCESS_DENIED</p>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>This page is restricted to BIOME admins.</p>
      </div>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <main className="min-h-screen flex flex-col" style={{ maxHeight: '100vh' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(77,255,128,0.08)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="mono text-xs mb-1" style={{ color: 'var(--green)' }}>// SALES_AGENT</p>
            <h1 className="text-xl font-black" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}>
              BIOME Sales Agent
            </h1>
            <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
              Outbound ops · lead gen · pipeline management
            </p>
          </div>
          <div className="flex items-center gap-3">
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setError(null); }}
                className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80"
                style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}
              >
                New chat
              </button>
            )}
            <Link
              href="/admin"
              className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80 no-underline"
              style={{ border: '1px solid rgba(77,255,128,0.15)', color: 'var(--green)' }}
            >
              ← Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ minHeight: 0 }}>
        <div className="max-w-3xl mx-auto space-y-6">

          {isEmpty && (
            <div className="text-center py-12">
              <p className="mono text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
                // READY — ask me to find leads, write emails, or manage the pipeline
              </p>
              <div className="grid grid-cols-2 gap-2 mt-6 text-left">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => void send(p)}
                    className="mono text-xs px-3 py-2 rounded text-left transition-all hover:opacity-80"
                    style={{
                      background: 'var(--bg2)',
                      border: '1px solid rgba(77,255,128,0.08)',
                      color: 'var(--text-dim)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="rounded px-4 py-3 text-sm"
                style={{
                  maxWidth: '80%',
                  background: msg.role === 'user' ? 'rgba(77,255,128,0.10)' : 'var(--bg2)',
                  border: msg.role === 'user'
                    ? '1px solid rgba(77,255,128,0.2)'
                    : '1px solid rgba(77,255,128,0.06)',
                  color: 'var(--text-bright)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.6',
                }}
              >
                {msg.role === 'assistant' && msg.content === '' && loading && (
                  <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>▊</span>
                  </span>
                )}
                {msg.content}
                {msg.role === 'assistant' && loading && i === messages.length - 1 && msg.content !== '' && (
                  <span className="mono" style={{ color: 'var(--green)', opacity: 0.6 }}>▊</span>
                )}
              </div>
            </div>
          ))}

          {error && (
            <p className="mono text-xs text-center" style={{ color: 'var(--amber)' }}>
              Error: {error}
            </p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-4" style={{ borderTop: '1px solid rgba(77,255,128,0.08)' }}>
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-end gap-3 rounded p-3"
            style={{ background: 'var(--bg2)', border: '1px solid rgba(77,255,128,0.12)' }}
          >
            <textarea
              ref={textareaRef}
              className="flex-1 mono text-sm resize-none outline-none bg-transparent"
              style={{ color: 'var(--text-bright)', minHeight: '2.5rem', maxHeight: '10rem' }}
              placeholder="Find leads, write emails, update pipeline..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              onClick={() => void send(input)}
              disabled={!input.trim() || loading}
              className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90 disabled:opacity-30 flex-shrink-0"
              style={{ background: 'var(--green)', color: '#050709' }}
            >
              {loading ? '...' : 'Send →'}
            </button>
          </div>
          <p className="mono text-xs mt-2 text-center" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </main>
  );
}

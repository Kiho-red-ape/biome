'use client';

import { useEffect, useState, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { SiteHeader } from '@/components/nav/header';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dispute {
  id:              string;
  experiment_id:   string;
  application_id:  string;
  milestone_id:    string | null;
  raised_by:       string;
  subject:         string;
  description:     string;
  status:          string;
  resolution_note: string | null;
  resolved_at:     string | null;
  fee_charged:     boolean;
  fee_amount:      number;
  created_at:      string;
  updated_at:      string;
}

interface DMessage {
  id:          string;
  author_id:   string;
  author_role: 'participant' | 'experimenter' | 'admin';
  content:     string;
  created_at:  string;
}

const STATUS_LABELS: Record<string, string> = {
  open:                         'OPEN',
  under_review:                 'UNDER REVIEW',
  resolved_for_participant:     'RESOLVED — Participant',
  resolved_for_experimenter:    'RESOLVED — Experimenter',
  closed:                       'CLOSED',
};

const STATUS_COLORS: Record<string, string> = {
  open:                         'var(--amber)',
  under_review:                 'var(--cyan)',
  resolved_for_participant:     'var(--green)',
  resolved_for_experimenter:    'var(--text-dim)',
  closed:                       'var(--text-dim)',
};

function relTime(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DisputeThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, authenticated } = usePrivy();
  const [id, setId]             = useState<string>('');
  const [dispute,   setDispute]   = useState<Dispute | null>(null);
  const [messages,  setMessages]  = useState<DMessage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [reply,     setReply]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resNote,   setResNote]   = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve the async params
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  async function load() {
    if (!id) return;
    const res = await fetch(`/api/disputes/${id}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json() as { dispute: Dispute; messages: DMessage[] };
    setDispute(data.dispute);
    setMessages(data.messages);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendReply() {
    if (!reply.trim() || !user || !dispute) return;
    setSending(true);
    const role = user.id === dispute.raised_by ? 'participant' : 'experimenter';
    const res = await fetch(`/api/disputes/${id}/messages`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privy_did: user.id, content: reply, author_role: role }),
    });
    if (res.ok) {
      setReply('');
      await load();
    }
    setSending(false);
  }

  async function resolve(status: string) {
    if (!user || !dispute) return;
    setResolving(true);
    await fetch(`/api/disputes/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privy_did: user.id, status, resolution_note: resNote }),
    });
    await load();
    setResolving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// LOADING_DISPUTE…</p>
        </div>
      </main>
    );
  }

  if (!dispute) {
    return (
      <main className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="mono text-xs" style={{ color: 'var(--amber)' }}>// DISPUTE_NOT_FOUND</p>
        </div>
      </main>
    );
  }

  const isClosed    = dispute.status === 'closed' ||
                      dispute.status === 'resolved_for_participant' ||
                      dispute.status === 'resolved_for_experimenter';
  const isOwner     = user?.id === dispute.raised_by;
  const statusColor = STATUS_COLORS[dispute.status] ?? 'var(--text-dim)';

  return (
    <main className="min-h-screen flex flex-col">
      <SiteHeader />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">

        {/* ── Breadcrumb ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mono text-xs mb-6" style={{ color: 'var(--text-dim)' }}>
          <Link href="/dashboard" className="no-underline hover:underline" style={{ color: 'var(--text-dim)' }}>DASHBOARD</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-bright)' }}>DISPUTE</span>
        </div>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="mono text-xs px-2 py-0.5 rounded flex items-center gap-1"
              style={{ border: `1px solid ${statusColor}40`, color: statusColor, background: `${statusColor}0a` }}
            >
              <span className={['open','under_review'].includes(dispute.status) ? 'blink' : ''}>●</span>
              {STATUS_LABELS[dispute.status] ?? dispute.status.toUpperCase()}
            </span>
            {dispute.fee_charged && (
              <span className="mono text-xs px-2 py-0.5 rounded" style={{ border: '1px solid rgba(255,179,0,0.3)', color: 'var(--amber)', background: 'rgba(255,179,0,0.06)' }}>
                ${dispute.fee_amount} FEE
              </span>
            )}
          </div>
          <h1
            className="text-xl font-black mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}
          >
            {dispute.subject}
          </h1>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            Raised {relTime(dispute.created_at)}
            {dispute.resolved_at && ` · Resolved ${relTime(dispute.resolved_at)}`}
          </p>
        </div>

        {/* ── Message thread ──────────────────────────────────────── */}
        <div
          className="rounded mb-4 flex flex-col gap-0"
          style={{ border: '1px solid rgba(77,255,128,0.08)', background: 'var(--bg2)' }}
        >
          {messages.map((msg) => {
            const isMe    = user?.id === msg.author_id;
            const roleClr = msg.author_role === 'participant' ? 'var(--cyan)'
                          : msg.author_role === 'experimenter' ? 'var(--green)'
                          : 'var(--amber)';
            return (
              <div
                key={msg.id}
                className="px-4 py-4"
                style={{
                  borderBottom: '1px solid rgba(77,255,128,0.06)',
                  background: isMe ? 'rgba(77,255,128,0.02)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="mono text-xs font-bold" style={{ color: roleClr }}>
                    {msg.author_role.toUpperCase()}
                  </span>
                  {isMe && <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>(you)</span>}
                  <span className="mono text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
                    {relTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── Resolution note (if resolved) ───────────────────────── */}
        {dispute.resolution_note && (
          <div
            className="rounded p-4 mb-4"
            style={{ border: '1px solid rgba(77,255,128,0.15)', background: 'rgba(77,255,128,0.04)' }}
          >
            <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>// RESOLUTION_NOTE</p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-bright)' }}>
              {dispute.resolution_note}
            </p>
          </div>
        )}

        {/* ── Reply box ───────────────────────────────────────────── */}
        {authenticated && !isClosed && (
          <div className="mb-6">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Add a message to this dispute..."
              rows={4}
              className="w-full rounded p-3 mono text-xs outline-none resize-none mb-2"
              style={{
                background: 'var(--bg2)',
                border: '1px solid rgba(77,255,128,0.12)',
                color: 'var(--text-bright)',
              }}
            />
            <button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="mono text-xs px-4 py-2 rounded transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'var(--green)', color: '#060a14', fontWeight: 700 }}
            >
              {sending ? 'SENDING…' : 'SEND MESSAGE →'}
            </button>
          </div>
        )}

        {/* ── Experimenter resolution controls ────────────────────── */}
        {authenticated && !isOwner && !isClosed && (
          <div
            className="rounded p-4"
            style={{ border: '1px solid rgba(77,255,128,0.1)', background: 'var(--bg2)' }}
          >
            <p className="mono text-xs mb-3" style={{ color: 'var(--text-dim)' }}>// RESOLVE_DISPUTE</p>
            <textarea
              value={resNote}
              onChange={(e) => setResNote(e.target.value)}
              placeholder="Resolution note (optional)..."
              rows={2}
              className="w-full rounded p-2 mono text-xs outline-none resize-none mb-3"
              style={{
                background: 'var(--bg3)',
                border: '1px solid rgba(77,255,128,0.08)',
                color: 'var(--text-bright)',
              }}
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => resolve('under_review')}
                disabled={resolving}
                className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40"
                style={{ border: '1px solid rgba(0,229,255,0.3)', color: 'var(--cyan)', background: 'rgba(0,229,255,0.05)' }}
              >
                MARK UNDER REVIEW
              </button>
              <button
                onClick={() => resolve('resolved_for_participant')}
                disabled={resolving}
                className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40"
                style={{ border: '1px solid rgba(77,255,128,0.3)', color: 'var(--green)', background: 'rgba(77,255,128,0.05)' }}
              >
                RESOLVE FOR PARTICIPANT
              </button>
              <button
                onClick={() => resolve('resolved_for_experimenter')}
                disabled={resolving}
                className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40"
                style={{ border: '1px solid rgba(77,255,128,0.1)', color: 'var(--text-dim)', background: 'transparent' }}
              >
                RESOLVE FOR EXPERIMENTER
              </button>
              <button
                onClick={() => resolve('closed')}
                disabled={resolving}
                className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40"
                style={{ border: '1px solid rgba(255,179,0,0.2)', color: 'var(--amber)', background: 'transparent' }}
              >
                CLOSE DISPUTE
              </button>
            </div>
          </div>
        )}

        {isClosed && (
          <p className="mono text-xs text-center py-4" style={{ color: 'var(--text-dim)' }}>
            // DISPUTE_CLOSED — no further messages can be added
          </p>
        )}

      </div>

      <footer
        className="text-center py-4 mono text-xs"
        style={{ color: 'var(--text-dim)', borderTop: '1px solid rgba(77,255,128,0.06)' }}
      >
        // BIOME_PROTOCOL — disputes governed by platform ToS
      </footer>
    </main>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { SiteHeader } from '@/components/nav/header';

// ─── Types ────────────────────────────────────────────────────────────────────

type OmeSession = {
  id: string;
  title: string | null;
  total_tokens: number;
  total_cost_usd: number;
  created_at: string;
  updated_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const secs  = Math.floor(ms / 1000);
  const mins  = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);

  if (secs  < 60)   return 'just now';
  if (mins  < 60)   return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  if (hours < 24)   return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days  < 30)   return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtCost(n: number): string {
  return `$${n.toFixed(5)}`;
}

function truncate(str: string | null, max: number): string {
  if (!str) return 'Untitled session';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OmeSessionsPage() {
  const router = useRouter();
  const { user, ready, authenticated } = usePrivy();

  const [sessions, setSessions] = useState<OmeSession[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }

    async function load() {
      if (!user) return;
      try {
        const res  = await fetch('/api/ome/sessions', {
          headers: { 'x-privy-did': user.id },
        });
        const data = await res.json() as { sessions?: OmeSession[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Failed to load sessions');
        setSessions(data.sessions ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [ready, authenticated, user, router]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!ready || loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>Loading…</span>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
        <SiteHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#dc2626' }}>Error: {error}</p>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <SiteHeader />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 16px 80px' }}>

        {/* Page header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   32,
          flexWrap:       'wrap',
          gap:            12,
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize:   24,
              color:      'var(--ink)',
              margin:     0,
            }}>
              OME Sessions
            </h1>
            <p style={{
              fontFamily:  'var(--font-body)',
              fontSize:    13,
              color:       'var(--muted)',
              margin:      '4px 0 0',
            }}>
              Your past conversations with OME recruitment intelligence
            </p>
          </div>
          <Link
            href="/ome"
            style={{
              fontFamily:     'var(--font-body)',
              fontSize:       13,
              fontWeight:     600,
              padding:        '8px 18px',
              borderRadius:   'var(--radius-sm)',
              background:     'var(--teal)',
              color:          '#ffffff',
              textDecoration: 'none',
              whiteSpace:     'nowrap',
            }}>
            New session →
          </Link>
        </div>

        {/* Empty state */}
        {sessions.length === 0 && (
          <div style={{
            background:   'var(--surface)',
            border:       '1px solid var(--border-soft)',
            borderRadius: 'var(--radius)',
            padding:      '64px 32px',
            textAlign:    'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize:   15,
              color:      'var(--muted)',
              margin:     0,
            }}>
              No sessions yet. Start a conversation with OME.
            </p>
            <Link
              href="/ome"
              style={{
                display:        'inline-block',
                marginTop:      20,
                fontFamily:     'var(--font-body)',
                fontSize:       13,
                fontWeight:     600,
                padding:        '8px 20px',
                borderRadius:   'var(--radius-sm)',
                background:     'var(--teal)',
                color:          '#ffffff',
                textDecoration: 'none',
              }}>
              Open OME →
            </Link>
          </div>
        )}

        {/* Session list */}
        {sessions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((s) => (
              <Link
                key={s.id}
                href={`/ome?session=${s.id}`}
                style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background:   'var(--surface)',
                    border:       '1px solid var(--border-soft)',
                    borderRadius: 'var(--radius-sm)',
                    padding:      '14px 16px',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'space-between',
                    gap:          16,
                    transition:   'background 0.15s',
                    cursor:       'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--teal-faint)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                >
                  {/* Title + date */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontFamily:   'var(--font-body)',
                      fontSize:     14,
                      fontWeight:   500,
                      color:        'var(--ink)',
                      margin:       0,
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace:   'nowrap',
                    }}>
                      {truncate(s.title, 80)}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   11,
                      color:      'var(--muted)',
                      margin:     '3px 0 0',
                    }}>
                      {relTime(s.updated_at)}
                    </p>
                  </div>

                  {/* Tokens + cost */}
                  <div style={{
                    flexShrink: 0,
                    textAlign:  'right',
                  }}>
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   11,
                      color:      'var(--slate)',
                      margin:     0,
                    }}>
                      {s.total_tokens.toLocaleString()} tokens
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize:   11,
                      color:      'var(--muted)',
                      margin:     '2px 0 0',
                    }}>
                      {fmtCost(s.total_cost_usd)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

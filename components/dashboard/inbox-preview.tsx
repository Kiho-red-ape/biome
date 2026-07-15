'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashCard, CardLabel } from './card';

type Notification = {
  id: string;
  type: string;
  payload: { title?: string; message?: string } | null;
  read: boolean;
  created_at: string;
};

function relTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function InboxPreview({ privyDid }: { privyDid: string }) {
  const [items,    setItems]    = useState<Notification[] | null>(null);
  const [unread,   setUnread]   = useState(0);
  const [error,    setError]    = useState(false);
  const [marking,  setMarking]  = useState(false);

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`/api/notifications?privyDid=${encodeURIComponent(privyDid)}&limit=5`);
      const data = (await res.json()) as { notifications?: Notification[]; unreadCount?: number };
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      setError(true);
    }
  }, [privyDid]);

  useEffect(() => { void load(); }, [load]);

  async function markAllRead() {
    setMarking(true);
    try {
      await fetch(`/api/notifications?privyDid=${encodeURIComponent(privyDid)}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({}),
      });
      await load();
    } finally {
      setMarking(false);
    }
  }

  // Hide entirely when there are no notifications (or on error) — calm hub.
  if (error || !items || items.length === 0) return null;

  return (
    <DashCard>
      <CardLabel>
        <span style={{ flex: 1 }}>
          Inbox
          {unread > 0 && (
            <span style={{
              marginLeft: 10, background: 'var(--teal)', color: '#fff', borderRadius: 999,
              fontSize: 10, fontWeight: 700, padding: '1px 8px', letterSpacing: 0,
            }}>
              {unread} new
            </span>
          )}
        </span>
        {unread > 0 && (
          <button
            onClick={() => void markAllRead()}
            disabled={marking}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
              textTransform: 'none', color: 'var(--teal-dark)', background: 'transparent',
              border: 'none', cursor: marking ? 'default' : 'pointer', opacity: marking ? 0.5 : 1,
            }}
          >
            Mark all read
          </button>
        )}
      </CardLabel>
      <div>
        {items.map((n, i) => (
          <div key={n.id} style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          12,
            padding:      '13px 24px',
            borderBottom: i < items.length - 1 ? '1px solid var(--border-soft)' : 'none',
            borderLeft:   n.read ? '3px solid transparent' : '3px solid var(--teal)',
            background:   n.read ? 'var(--surface)' : 'var(--teal-faint)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 14,
                fontWeight: n.read ? 400 : 600, color: 'var(--ink)',
              }}>
                {n.payload?.title ?? 'Notification'}
              </div>
              {n.payload?.message && (
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {n.payload.message}
                </div>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {relTime(n.created_at)}
            </span>
          </div>
        ))}
      </div>
    </DashCard>
  );
}

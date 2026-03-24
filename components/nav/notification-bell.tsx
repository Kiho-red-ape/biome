'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

type Notif = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

const TYPE_MAP: Record<string, { label: string; icon: string; color: string }> = {
  enrollment_confirmed:   { label: 'Enrolled in study',      icon: '✓', color: 'var(--green)' },
  application_approved:   { label: 'Application approved',   icon: '●', color: 'var(--cyan)'  },
  application_rejected:   { label: 'Application rejected',   icon: '✕', color: 'var(--amber)' },
  application_waitlisted: { label: 'Application waitlisted', icon: '○', color: 'var(--text-dim)' },
  milestone_verified:     { label: 'Milestone verified',     icon: '✓', color: 'var(--green)' },
  milestone_rejected:     { label: 'Milestone rejected',     icon: '✕', color: 'var(--amber)' },
  study_commenced:        { label: 'Study has commenced',    icon: '▶', color: 'var(--cyan)'  },
};

function relDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  const hrs   = Math.floor((Date.now() - new Date(d).getTime()) / 3_600_000);
  if (hrs < 1)   return 'just now';
  if (hrs < 24)  return `${hrs}h ago`;
  if (days === 1) return '1d ago';
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface Props {
  privyDid: string;
}

export function NotificationBell({ privyDid }: Props) {
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [unread,  setUnread]  = useState(0);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res  = await fetch(`/api/notifications?privyDid=${encodeURIComponent(privyDid)}&limit=20`);
      const data = await res.json() as { notifications: Notif[]; unreadCount: number };
      if (res.ok) {
        setNotifs(data.notifications);
        setUnread(data.unreadCount);
      }
    } catch {
      // network error — silently ignore
    }
  }, [privyDid]);

  // Poll every 30s + on focus
  useEffect(() => {
    void fetchNotifs();
    const interval = setInterval(() => void fetchNotifs(), 30_000);
    window.addEventListener('focus', fetchNotifs);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchNotifs);
    };
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAllRead() {
    setLoading(true);
    await fetch(`/api/notifications?privyDid=${encodeURIComponent(privyDid)}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({}),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    setLoading(false);
  }

  function handleOpen() {
    setOpen((o) => !o);
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={`relative flex items-center justify-center w-8 h-8 rounded transition-all hover:opacity-80${unread > 0 ? ' bell-has-unread' : ''}`}
        style={{ color: unread > 0 ? 'var(--green)' : 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
        title="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1a5 5 0 0 0-5 5v2.5L1.5 11h13L13 8.5V6a5 5 0 0 0-5-5zm0 14a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z"
            fill="currentColor"
            opacity={unread > 0 ? 1 : 0.5}
          />
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 mono text-xs flex items-center justify-center rounded-full"
            style={{
              background: 'var(--green)',
              color:      '#050709',
              minWidth:   16,
              height:     16,
              fontSize:   9,
              fontWeight: 700,
              padding:    '0 3px',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded overflow-hidden"
          style={{
            background:     'rgba(11,18,11,0.97)',
            border:         '1px solid rgba(77,255,128,0.14)',
            backdropFilter: 'blur(12px)',
            width:          320,
            maxHeight:      440,
            zIndex:         200,
            boxShadow:      '0 8px 32px rgba(0,0,0,0.5)',
            display:        'flex',
            flexDirection:  'column',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(77,255,128,0.08)', flexShrink: 0 }}
          >
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              // NOTIFICATIONS
              {unread > 0 && (
                <span className="ml-2" style={{ color: 'var(--green)' }}>[{unread} unread]</span>
              )}
            </p>
            {unread > 0 && (
              <button
                onClick={() => void markAllRead()}
                disabled={loading}
                className="mono transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10 }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>// NO_NOTIFICATIONS_YET</p>
              </div>
            ) : (
              notifs.map((n) => {
                const meta    = TYPE_MAP[n.type] ?? { label: n.type, icon: '·', color: 'var(--text-dim)' };
                const expTitle = n.payload.experiment_title as string | undefined;
                const expId    = n.payload.experiment_id as string | undefined;

                return (
                  <div
                    key={n.id}
                    className="px-4 py-3 flex items-start gap-3"
                    style={{
                      borderBottom:  '1px solid rgba(77,255,128,0.04)',
                      background:    !n.read ? 'rgba(77,255,128,0.03)' : 'transparent',
                    }}
                  >
                    <span className="mono text-xs mt-0.5 shrink-0" style={{ color: meta.color }}>{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: !n.read ? 'var(--text-white)' : 'var(--text-dim)' }}>
                        {meta.label}
                      </p>
                      {expTitle && expId && (
                        <Link
                          href={`/experiments/${expId}`}
                          onClick={() => setOpen(false)}
                          className="mono text-xs truncate block no-underline hover:underline"
                          style={{ color: 'var(--text-dim)', fontSize: 10 }}
                        >
                          {expTitle}
                        </Link>
                      )}
                      {expTitle && !expId && (
                        <p className="mono text-xs truncate" style={{ color: 'var(--text-dim)', fontSize: 10 }}>
                          {expTitle}
                        </p>
                      )}
                      <p className="mono" style={{ color: 'var(--text-dim)', fontSize: 9, marginTop: 2 }}>
                        {relDate(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                        style={{ background: 'var(--green)', display: 'block' }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

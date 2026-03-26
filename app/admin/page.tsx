'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

type ExperimenterRow = {
  id: string;
  user_id: string;
  org_name: string;
  org_website: string | null;
  org_description: string | null;
  role_title: string | null;
  screening_status: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string | null;
    region: string | null;
  } | null;
};

function relDate(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_COLOR: Record<string, string> = {
  approved: 'var(--green)',
  rejected: '#ff8f8f',
  pending:  'var(--amber)',
};

export default function AdminPage() {
  const { user, ready, authenticated } = usePrivy();
  const router = useRouter();

  const [profiles, setProfiles]   = useState<ExperimenterRow[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [denied,   setDenied]     = useState(false);
  const [acting,   setActing]     = useState<string | null>(null);
  const [msg,      setMsg]        = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin?privyDid=${encodeURIComponent(user.id)}`);
      if (res.status === 403) { setDenied(true); return; }
      const data = await res.json() as { profiles?: ExperimenterRow[] };
      setProfiles(data.profiles ?? []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated || !user) { router.replace('/'); return; }
    void load();
  }, [ready, authenticated, user, router, load]);

  async function act(profileId: string, action: 'approve' | 'reject') {
    if (!user) return;
    setActing(profileId);
    setMsg(null);
    const res  = await fetch('/api/admin', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ privyDid: user.id, profileId, action }),
    });
    const data = await res.json() as { profile?: { org_name: string; screening_status: string }; error?: string };
    if (!res.ok) {
      setMsg(`Error: ${data.error ?? 'Failed'}`);
    } else {
      setMsg(`✓ ${data.profile?.org_name} → ${data.profile?.screening_status}`);
      void load();
    }
    setActing(null);
  }

  const filtered = profiles.filter((p) => filter === 'all' || p.screening_status === filter);
  const counts   = {
    all:      profiles.length,
    pending:  profiles.filter((p) => p.screening_status === 'pending').length,
    approved: profiles.filter((p) => p.screening_status === 'approved').length,
    rejected: profiles.filter((p) => p.screening_status === 'rejected').length,
  };

  if (!ready || loading) {
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
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
          This page is restricted to BIOME admins.
        </p>
        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
          If you are the admin, run the migration and set is_admin = true for your account.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="mono text-xs mb-2" style={{ color: 'var(--green)' }}>// ADMIN_PANEL</p>
          <h1 className="text-2xl font-black mb-1" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-white)' }}>
            BIOME Admin
          </h1>
          <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            Experimenter profile approvals · logged in as {user?.email?.address ?? user?.id}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded p-3 text-left transition-all hover:opacity-80"
              style={{
                background: filter === f ? 'rgba(77,255,128,0.08)' : 'var(--bg2)',
                border: `1px solid ${filter === f ? 'rgba(77,255,128,0.3)' : 'rgba(77,255,128,0.06)'}`,
              }}
            >
              <p className="mono text-xs mb-1" style={{ color: 'var(--text-dim)' }}>{f.toUpperCase()}</p>
              <p className="mono text-xl font-bold" style={{ color: STATUS_COLOR[f] ?? 'var(--text-white)' }}>
                {counts[f]}
              </p>
            </button>
          ))}
        </div>

        {msg && (
          <p className="mono text-xs mb-4" style={{ color: msg.startsWith('Error') ? 'var(--amber)' : 'var(--green)' }}>
            {msg}
          </p>
        )}

        {/* Profiles table */}
        {filtered.length === 0 ? (
          <div className="rounded px-6 py-10 text-center" style={{ border: '1px solid rgba(77,255,128,0.06)' }}>
            <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
              No {filter === 'all' ? '' : filter} profiles.
            </p>
          </div>
        ) : (
          <div className="rounded overflow-hidden" style={{ border: '1px solid rgba(77,255,128,0.1)' }}>
            {filtered.map((p, i) => (
              <div
                key={p.id}
                className="px-5 py-4 flex flex-wrap items-start gap-4"
                style={{
                  background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg)',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(77,255,128,0.05)' : 'none',
                }}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className="mono text-sm font-bold" style={{ color: 'var(--text-bright)' }}>
                      {p.org_name}
                    </p>
                    <span
                      className="mono text-xs px-2 py-0.5 rounded"
                      style={{
                        color: STATUS_COLOR[p.screening_status] ?? 'var(--text-dim)',
                        border: `1px solid ${STATUS_COLOR[p.screening_status] ?? 'rgba(255,255,255,0.1)'}40`,
                        background: `${STATUS_COLOR[p.screening_status] ?? 'rgba(255,255,255,0.05)'}12`,
                      }}
                    >
                      {p.screening_status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mono text-xs mb-0.5" style={{ color: 'var(--text-dim)' }}>
                    {p.profiles?.display_name ?? 'No name'}
                    {p.profiles?.email && <> · {p.profiles.email}</>}
                    {p.profiles?.region && <> · {p.profiles.region}</>}
                  </p>
                  {p.role_title && (
                    <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{p.role_title}</p>
                  )}
                  {p.org_description && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-dim)', maxWidth: 500 }}>
                      {p.org_description.slice(0, 140)}{p.org_description.length > 140 ? '…' : ''}
                    </p>
                  )}
                  {p.org_website && (
                    <a href={p.org_website} target="_blank" rel="noopener noreferrer"
                      className="mono text-xs" style={{ color: 'var(--cyan)' }}>
                      {p.org_website}
                    </a>
                  )}
                  <p className="mono text-xs mt-1" style={{ color: 'var(--text-dim)', opacity: 0.5 }}>
                    Applied {relDate(p.created_at)}
                  </p>
                </div>

                {/* Actions */}
                {p.screening_status === 'pending' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => act(p.id, 'approve')}
                      disabled={acting === p.id}
                      className="mono text-xs px-4 py-2 rounded font-bold transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ background: 'var(--green)', color: '#050709' }}
                    >
                      {acting === p.id ? '...' : 'Approve ✓'}
                    </button>
                    <button
                      onClick={() => act(p.id, 'reject')}
                      disabled={acting === p.id}
                      className="mono text-xs px-4 py-2 rounded transition-all hover:opacity-80 disabled:opacity-40"
                      style={{ border: '1px solid rgba(255,100,100,0.3)', color: '#ff8f8f' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {p.screening_status === 'approved' && (
                  <button
                    onClick={() => act(p.id, 'reject')}
                    disabled={acting === p.id}
                    className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-70 disabled:opacity-40 flex-shrink-0"
                    style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}
                  >
                    Revoke
                  </button>
                )}
                {p.screening_status === 'rejected' && (
                  <button
                    onClick={() => act(p.id, 'approve')}
                    disabled={acting === p.id}
                    className="mono text-xs px-3 py-1.5 rounded transition-all hover:opacity-80 disabled:opacity-40 flex-shrink-0"
                    style={{ border: '1px solid rgba(77,255,128,0.2)', color: 'var(--green)' }}
                  >
                    Re-approve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

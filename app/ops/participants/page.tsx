'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

interface User {
  privy_id: string;
  email: string | null;
  created_at: string;
  supabase_role: string | null;
  supabase_region: string | null;
  participant_id: string | null;
  verification_status: string | null;
  previous_study_count: number | null;
  country: string | null;
  in_supabase: boolean;
  onboarded: boolean;
}

function verBadge(u: User) {
  if (!u.in_supabase) return { label: 'NOT SYNCED', color: '#ff6464' };
  if (!u.onboarded)   return { label: 'NO PROFILE', color: '#3a4a43' };
  const s = u.verification_status;
  if (s === 'fully_verified')  return { label: 'FULL',    color: '#f59e0b' };
  if (s === 'phone_verified')  return { label: 'PHONE',   color: '#38bdf8' };
  if (s === 'email_verified')  return { label: 'EMAIL',   color: '#ffb300' };
  return { label: 'PENDING', color: '#5b5b3a' };
}

export default function OpsParticipants() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<'all' | 'onboarded' | 'not_synced' | 'verified'>('all');

  useEffect(() => {
    fetch('/api/ops/privy-users')
      .then(r => r.json())
      .then((d: { users?: User[]; error?: string }) => {
        if (d.error) { setError(d.error); return; }
        setUsers(d.users ?? []);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    if (filter === 'onboarded')  return u.onboarded;
    if (filter === 'not_synced') return !u.in_supabase;
    if (filter === 'verified')   return u.verification_status === 'fully_verified';
    return true;
  });

  const notSynced = users.filter(u => !u.in_supabase).length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 6 }}>
            // PARTICIPANTS
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: '#f8fafc', marginBottom: 4 }}>
            All Users
          </h1>
          {!loading && (
            <p style={{ ...MONO, fontSize: 11, color: '#475569' }}>
              {users.length} in Privy · {users.filter(u => u.onboarded).length} onboarded
              {notSynced > 0 && <span style={{ color: '#ff6464' }}> · {notSynced} not synced to Supabase</span>}
            </p>
          )}
        </div>
        <Link href="/ops/notifications" style={{
          ...MONO, fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase',
          padding: '8px 18px', background: 'rgba(255,179,0,0.08)',
          border: '1px solid rgba(255,179,0,0.3)', color: '#ffb300',
          borderRadius: 2, textDecoration: 'none',
        }}>
          Send Notification →
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {([
          { key: 'all',        label: 'All' },
          { key: 'onboarded',  label: 'Onboarded' },
          { key: 'verified',   label: 'Verified' },
          { key: 'not_synced', label: 'Not Synced' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            ...MONO, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase',
            padding: '5px 14px', cursor: 'pointer',
            border: `1px solid ${filter === key ? '#ffb300' : 'rgba(255,255,255,0.08)'}`,
            background: filter === key ? 'rgba(255,179,0,0.06)' : 'transparent',
            color: filter === key ? '#ffb300' : '#475569',
            borderRadius: 2,
          }}>{label}</button>
        ))}
      </div>

      {loading && (
        <p style={{ ...MONO, fontSize: 11, color: '#475569', padding: '32px 0' }}>// Loading from Privy...</p>
      )}

      {error && (
        <div style={{ ...MONO, fontSize: 11, color: '#ff6464', background: 'rgba(255,100,100,0.06)', border: '1px solid rgba(255,100,100,0.2)', padding: '16px', borderRadius: 2, marginBottom: 24 }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>Failed to load Privy users</p>
          <p style={{ color: '#94a3b8' }}>{error}</p>
          <p style={{ marginTop: 8, color: '#475569' }}>
            Make sure <code>PRIVY_APP_SECRET</code> is set in your environment variables (Netlify → Site config → Environment variables).
          </p>
        </div>
      )}

      {!loading && !error && (
        <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...MONO, fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                {['Email', 'Participant ID', 'Status', 'Role', 'Country', 'Studies', 'Joined', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#475569', fontWeight: 400, letterSpacing: '1px', whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 32, color: '#475569', textAlign: 'center' }}>No users found.</td></tr>
              )}
              {filtered.map(u => {
                const badge = verBadge(u);
                return (
                  <tr key={u.privy_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: u.in_supabase ? 1 : 0.5 }}>
                    <td style={{ padding: '10px 12px', color: '#f8fafc' }}>{u.email ?? <span style={{ color: '#3a4a43' }}>—</span>}</td>
                    <td style={{ padding: '10px 12px', color: '#475569', whiteSpace: 'nowrap', fontSize: 10 }}>
                      {u.participant_id ?? <span style={{ color: '#3a4a43' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 9, letterSpacing: '1px', padding: '2px 8px', border: `1px solid ${badge.color}44`, color: badge.color, borderRadius: 2 }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{u.supabase_role ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {u.country ?? u.supabase_region ?? '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{u.previous_study_count ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#475569', whiteSpace: 'nowrap', fontSize: 10 }}>
                      {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {u.participant_id && (
                        <Link href={`/ops/notifications?to=${encodeURIComponent(u.participant_id)}`}
                          style={{ ...MONO, fontSize: 10, color: '#475569', textDecoration: 'none' }}>
                          Notify
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

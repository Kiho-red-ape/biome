'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  OpsPageHeader, OpsStats, OpsBadge, OpsButton, OpsTabs,
  OpsTable, OpsTd, OpsEmpty, OpsAlert,
} from '../_components/ui';

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

function verBadge(u: User): { label: string; tone: 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue' } {
  if (!u.in_supabase) return { label: 'Not synced', tone: 'red' };
  if (!u.onboarded)   return { label: 'No profile', tone: 'slate' };
  const s = u.verification_status;
  if (s === 'fully_verified')  return { label: 'Full',    tone: 'green' };
  if (s === 'phone_verified')  return { label: 'Phone',   tone: 'blue' };
  if (s === 'email_verified')  return { label: 'Email',   tone: 'teal' };
  return { label: 'Pending', tone: 'amber' };
}

export default function OpsParticipants() {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<'all' | 'onboarded' | 'not_synced' | 'verified'>('all');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch('/api/ops/privy-users')
      .then(r => r.json())
      .then((d: { users?: User[]; error?: string }) => {
        if (d.error) { setError(d.error); return; }
        setError(null);
        setUsers(d.users ?? []);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function syncToSupabase() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/ops/privy-users/sync', { method: 'POST' });
      const d = await res.json() as { ok?: boolean; synced?: number; error?: string };
      if (d.ok) {
        setSyncMsg(d.synced ? `Synced ${d.synced} account${d.synced === 1 ? '' : 's'} to Supabase.` : 'All accounts already synced.');
        load();
      } else {
        setSyncMsg(d.error ?? 'Sync failed.');
      }
    } catch (e) {
      setSyncMsg(String(e));
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 5000);
    }
  }

  const filtered = users.filter(u => {
    if (filter === 'onboarded')  return u.onboarded;
    if (filter === 'not_synced') return !u.in_supabase;
    if (filter === 'verified')   return u.verification_status === 'fully_verified';
    return true;
  });

  const onboardedCount = users.filter(u => u.onboarded).length;
  const notSynced      = users.filter(u => !u.in_supabase).length;

  return (
    <div>
      <OpsPageHeader
        label="Participants"
        title="All Users"
        subtitle={!loading ? `Privy accounts cross-referenced with Supabase profiles` : undefined}
        actions={
          <>
            {notSynced > 0 && (
              <OpsButton onClick={syncToSupabase} disabled={syncing} variant="ghost">
                {syncing ? 'Syncing…' : `Sync ${notSynced} to Supabase`}
              </OpsButton>
            )}
            <OpsButton href="/ops/notifications" variant="primary">Send notification →</OpsButton>
          </>
        }
      />

      {syncMsg && <OpsAlert tone={syncMsg.includes('fail') || syncMsg.includes('Error') ? 'err' : 'ok'}>{syncMsg}</OpsAlert>}

      {!loading && !error && (
        <OpsStats items={[
          { label: 'In Privy',   value: users.length },
          { label: 'Onboarded',  value: onboardedCount, accent: true },
          { label: 'Not synced', value: notSynced },
        ]} />
      )}

      <OpsTabs
        active={filter}
        onChange={setFilter}
        tabs={[
          { key: 'all',        label: 'All',        count: users.length },
          { key: 'onboarded',  label: 'Onboarded',  count: onboardedCount },
          { key: 'verified',   label: 'Verified',   count: users.filter(u => u.verification_status === 'fully_verified').length },
          { key: 'not_synced', label: 'Not synced', count: notSynced },
        ]}
      />

      {error && (
        <OpsAlert tone="err">
          <strong>Failed to load Privy users.</strong> {error}
          <br />Make sure <code>PRIVY_APP_SECRET</code> is set in your environment variables.
        </OpsAlert>
      )}

      {loading && <OpsAlert tone="info">Loading from Privy…</OpsAlert>}

      {!loading && !error && (
        <OpsTable head={['Email', 'Participant ID', 'Status', 'Role', 'Country', 'Studies', 'Joined', '']}>
          {filtered.length === 0 && <OpsEmpty>No users found.</OpsEmpty>}
          {filtered.map(u => {
            const badge = verBadge(u);
            return (
              <tr key={u.privy_id} style={{ opacity: u.in_supabase ? 1 : 0.62 }}>
                <OpsTd>{u.email ?? <span style={{ color: 'var(--muted)' }}>—</span>}</OpsTd>
                <OpsTd mono dim nowrap>{u.participant_id ?? '—'}</OpsTd>
                <OpsTd nowrap><OpsBadge tone={badge.tone}>{badge.label}</OpsBadge></OpsTd>
                <OpsTd dim>{u.supabase_role ?? '—'}</OpsTd>
                <OpsTd dim nowrap>{u.country ?? u.supabase_region ?? '—'}</OpsTd>
                <OpsTd dim>{u.previous_study_count ?? '—'}</OpsTd>
                <OpsTd mono dim nowrap>
                  {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </OpsTd>
                <OpsTd nowrap>
                  {u.participant_id && (
                    <Link href={`/ops/notifications?to=${encodeURIComponent(u.participant_id)}`}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal-dark)', textDecoration: 'none' }}>
                      Notify
                    </Link>
                  )}
                </OpsTd>
              </tr>
            );
          })}
        </OpsTable>
      )}
    </div>
  );
}

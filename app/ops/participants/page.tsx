import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function OpsParticipants({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const db = createServiceClient();

  // Query ALL profiles with role=participant, left-joining participant_profiles.
  // This shows everyone who authenticated via Privy, even if onboarding is incomplete.
  const { data: profileRows } = await db
    .from('profiles')
    .select('id, email, region, created_at')
    .eq('role', 'participant')
    .order('created_at', { ascending: false });

  const userIds = (profileRows ?? []).map(p => p.id as string);

  // Fetch participant_profiles separately to avoid join column assumptions
  const ppMap: Record<string, Record<string, unknown>> = {};
  if (userIds.length > 0) {
    const { data: ppRows } = await db
      .from('participant_profiles')
      .select('user_id, participant_id, pseudonym, country, email_verified, phone_verified, verification_status, previous_study_count, reliability_score, onboarding_step')
      .in('user_id', userIds);
    (ppRows ?? []).forEach((r: Record<string, unknown>) => {
      ppMap[r.user_id as string] = r;
    });
  }

  const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

  // Merge rows
  let rows = (profileRows ?? []).map(p => ({
    ...p,
    ...(ppMap[p.id as string] ?? {}),
  })) as Record<string, unknown>[];

  // Apply filters
  if (filter === 'verified')  rows = rows.filter(r => r.verification_status === 'fully_verified');
  if (filter === 'onboarding') rows = rows.filter(r => !ppMap[r.id as string]);

  function verBadge(r: Record<string, unknown>) {
    if (!ppMap[r.id as string]) return { label: 'NO PROFILE', color: '#3a4a43' };
    const s = r.verification_status as string | undefined;
    if (s === 'fully_verified')  return { label: 'FULL',    color: '#b7ff61' };
    if (s === 'phone_verified')  return { label: 'PHONE',   color: '#22d3ee' };
    if (s === 'email_verified')  return { label: 'EMAIL',   color: '#ffb300' };
    return { label: 'PENDING', color: '#5b5b3a' };
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ ...MONO, fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 6 }}>
            // PARTICIPANTS
          </p>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, color: '#f2faf4', marginBottom: 4 }}>
            Research Partners
          </h1>
          <p style={{ ...MONO, fontSize: 11, color: '#5b8a9a' }}>{rows.length} total · {Object.keys(ppMap).length} fully onboarded</p>
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
        {[
          { label: 'All',        href: '/ops/participants' },
          { label: 'Verified',   href: '/ops/participants?filter=verified' },
          { label: 'Incomplete', href: '/ops/participants?filter=onboarding' },
        ].map(({ label, href }) => {
          const key = label.toLowerCase();
          const active = (!filter && label === 'All') || filter === key;
          return (
            <Link key={label} href={href} style={{
              ...MONO, fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase',
              padding: '5px 14px',
              border: `1px solid ${active ? '#ffb300' : 'rgba(255,255,255,0.08)'}`,
              background: active ? 'rgba(255,179,0,0.06)' : 'transparent',
              color: active ? '#ffb300' : '#5b8a9a',
              borderRadius: 2, textDecoration: 'none',
            }}>{label}</Link>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', ...MONO, fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              {['Email', 'Participant ID', 'Country', 'Status', 'Email ✓', 'Phone ✓', 'Studies', 'Score', 'Joined', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#5b8a9a', fontWeight: 400, letterSpacing: '1px', whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={10} style={{ padding: 32, color: '#5b8a9a', textAlign: 'center' }}>No participants found.</td></tr>
            )}
            {rows.map(p => {
              const badge = verBadge(p);
              const hasProfile = !!ppMap[p.id as string];
              return (
                <tr key={p.id as string} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: hasProfile ? 1 : 0.6 }}>
                  <td style={{ padding: '10px 12px', color: '#f2faf4', fontSize: 11 }}>{(p.email as string | null) ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#5b8a9a', whiteSpace: 'nowrap', fontSize: 10 }}>
                    {(p.participant_id as string | null) ?? <span style={{ color: '#3a4a43' }}>not set</span>}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#aab8b1', whiteSpace: 'nowrap' }}>
                    {(p.country as string | null) ?? (p.region as string | null) ?? '—'}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 9, letterSpacing: '1px', padding: '2px 8px', border: `1px solid ${badge.color}44`, color: badge.color, borderRadius: 2 }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: p.email_verified ? '#b7ff61' : '#3a4a43' }}>{p.email_verified ? '✓' : '—'}</td>
                  <td style={{ padding: '10px 12px', color: p.phone_verified ? '#22d3ee' : '#3a4a43' }}>{p.phone_verified ? '✓' : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#aab8b1' }}>{(p.previous_study_count as number | null) ?? '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#b7ff61' }}>
                    {p.reliability_score != null ? (p.reliability_score as number).toFixed(2) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#5b8a9a', whiteSpace: 'nowrap', fontSize: 10 }}>
                    {new Date(p.created_at as string).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <Link href={`/ops/notifications?to=${encodeURIComponent((p.participant_id as string) ?? (p.id as string))}`}
                      style={{ ...MONO, fontSize: 10, color: '#5b8a9a', textDecoration: 'none' }}>
                      Notify
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

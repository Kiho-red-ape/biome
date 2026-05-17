import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

// fetch participant_profiles joined with profiles (for email)
// columns: participant_id, pseudonym, country, email_verified, phone_verified,
//          phone_number, verification_status, previous_study_count, reliability_score,
//          violation_flagged, created_at, user_id
// join: profiles(email)

export default async function OpsParticipants({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
  const db = createServiceClient();

  // Fetch participant profiles
  let q = db.from('participant_profiles')
    .select('participant_id, pseudonym, country, email_verified, phone_verified, phone_number, verification_status, previous_study_count, reliability_score, violation_flagged, created_at, user_id')
    .order('created_at', { ascending: false });

  if (filter === 'verified') q = q.eq('verification_status', 'fully_verified');
  if (filter === 'flagged')  q = q.eq('violation_flagged', true);

  const { data: participants } = await q;
  const rows = (participants ?? []) as Record<string, unknown>[];

  // Fetch emails separately (profiles table)
  const userIds = rows.map(r => r.user_id as string);
  const emailMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profileData } = await db.from('profiles').select('id, email').in('id', userIds);
    (profileData ?? []).forEach((p: Record<string, unknown>) => {
      if (p.id && p.email) emailMap[p.id as string] = p.email as string;
    });
  }

  // Verification badge logic
  function verBadge(status: string) {
    if (status === 'fully_verified') return { label: 'FULL', color: '#b7ff61' };
    if (status === 'phone_verified') return { label: 'PHONE', color: '#22d3ee' };
    if (status === 'email_verified') return { label: 'EMAIL', color: '#ffb300' };
    return { label: 'PENDING', color: '#3a4a43' };
  }

  const MONO: React.CSSProperties = { fontFamily: 'var(--font-mono)' };

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
          <p style={{ ...MONO, fontSize: 11, color: '#5b8a9a' }}>{rows.length} total</p>
        </div>
        {/* Go to notifications */}
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
          { label: 'All', href: '/ops/participants' },
          { label: 'Verified', href: '/ops/participants?filter=verified' },
          { label: 'Flagged', href: '/ops/participants?filter=flagged' },
        ].map(({ label, href }) => {
          const active = (label === 'All' && !filter) || (label.toLowerCase() === filter);
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
              {['Participant ID', 'Pseudonym', 'Email', 'Country', 'Verification', 'Email ✓', 'Phone ✓', 'Studies', 'Score', 'Flagged', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#5b8a9a', fontWeight: 400, letterSpacing: '1px', whiteSpace: 'nowrap', fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={11} style={{ padding: 32, color: '#5b8a9a', textAlign: 'center', ...MONO, fontSize: 11 }}>No participants found.</td></tr>
            )}
            {rows.map(p => {
              const badge = verBadge(p.verification_status as string);
              const email = emailMap[p.user_id as string] ?? '—';
              return (
                <tr key={p.participant_id as string} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px', color: '#5b8a9a', whiteSpace: 'nowrap' }}>{p.participant_id as string}</td>
                  <td style={{ padding: '10px 12px', color: '#f2faf4', whiteSpace: 'nowrap' }}>{p.pseudonym as string}</td>
                  <td style={{ padding: '10px 12px', color: '#aab8b1', fontSize: 10 }}>{email}</td>
                  <td style={{ padding: '10px 12px', color: '#aab8b1', whiteSpace: 'nowrap' }}>{(p.country as string | null) ?? '—'}</td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{ ...MONO, fontSize: 9, letterSpacing: '1px', padding: '2px 8px', border: `1px solid ${badge.color}33`, color: badge.color, borderRadius: 2 }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: p.email_verified ? '#b7ff61' : '#3a4a43' }}>{p.email_verified ? '✓' : '—'}</td>
                  <td style={{ padding: '10px 12px', color: p.phone_verified ? '#22d3ee' : '#3a4a43' }}>{p.phone_verified ? '✓' : '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#aab8b1' }}>{(p.previous_study_count as number | null) ?? 0}</td>
                  <td style={{ padding: '10px 12px', color: '#b7ff61' }}>
                    {p.reliability_score != null ? (p.reliability_score as number).toFixed(2) : '—'}
                  </td>
                  <td style={{ padding: '10px 12px', color: p.violation_flagged ? '#ffb300' : '#3a4a43' }}>{p.violation_flagged ? '⚠' : '—'}</td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/profile/${p.participant_id as string}`} target="_blank" rel="noreferrer"
                        style={{ ...MONO, fontSize: 10, color: '#ffb300', textDecoration: 'none' }}>View →</Link>
                      <Link href={`/ops/notifications?to=${encodeURIComponent(p.participant_id as string)}`}
                        style={{ ...MONO, fontSize: 10, color: '#5b8a9a', textDecoration: 'none' }}>Notify</Link>
                    </div>
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

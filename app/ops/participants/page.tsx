import { createServiceClient } from '@/lib/supabase/server';

export default async function OpsParticipants({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const db = createServiceClient();

  let query = db
    .from('participant_profiles')
    .select('participant_id, pseudonym, country, previous_study_count, completion_rate, reliability_score, verification_status, violation_flagged, created_at, user_id')
    .order('created_at', { ascending: false });

  if (filter === 'verified') {
    query = query.eq('verification_status', 'fully_verified');
  } else if (filter === 'flagged') {
    query = query.eq('violation_flagged', true);
  }

  const { data: participants } = await query;
  const rows = (participants ?? []) as Record<string, unknown>[];

  const title = filter === 'verified' ? 'VERIFIED_PARTICIPANTS'
    : filter === 'flagged' ? 'FLAGGED_PARTICIPANTS'
    : 'ALL_PARTICIPANTS';

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // {title}
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['ID', 'Pseudonym', 'Country', 'Studies', 'Completion', 'Score', 'Verified', 'Flagged', 'Actions'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#4a6050', fontWeight: 400, letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 24, color: '#4a6050', textAlign: 'center' }}>No participants found.</td></tr>
            )}
            {rows.map((p) => (
              <tr key={p.participant_id as string} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px', color: '#4a6050' }}>{p.participant_id as string}</td>
                <td style={{ padding: '8px 12px', color: '#f2faf4' }}>{p.pseudonym as string}</td>
                <td style={{ padding: '8px 12px', color: '#aab8b1' }}>{(p.country as string | null) ?? '—'}</td>
                <td style={{ padding: '8px 12px', color: '#aab8b1' }}>{(p.previous_study_count as number | null) ?? 0}</td>
                <td style={{ padding: '8px 12px', color: '#aab8b1' }}>
                  {p.completion_rate != null ? `${(p.completion_rate as number).toFixed(0)}%` : '—'}
                </td>
                <td style={{ padding: '8px 12px', color: '#b7ff61' }}>
                  {p.reliability_score != null ? (p.reliability_score as number).toFixed(1) : '—'}
                </td>
                <td style={{ padding: '8px 12px', color: (p.verification_status as string) === 'fully_verified' ? '#b7ff61' : '#4a6050' }}>
                  {(p.verification_status as string) === 'fully_verified' ? '✓' : '—'}
                </td>
                <td style={{ padding: '8px 12px', color: p.violation_flagged ? '#ffb300' : '#4a6050' }}>
                  {p.violation_flagged ? '⚠' : '—'}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <a
                    href={`/profile/${p.participant_id as string}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#ffb300', fontFamily: 'var(--font-mono)', fontSize: 10, textDecoration: 'none' }}
                  >
                    View →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

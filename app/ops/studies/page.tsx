import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  draft:      '#5b8a9a',
  recruiting: '#22d3ee',
  active:     '#b7ff61',
  completed:  '#5b8a9a',
  cancelled:  '#5b8a9a',
};

export default async function OpsStudies() {
  const db = createServiceClient();

  const { data: studies } = await db
    .from('experiments')
    .select('id, title, status, category, slots_filled, slots_total, bounty_per_participant, total_bounty_pool, is_verified, created_at, experiment_code')
    .order('created_at', { ascending: false });

  const rows = studies ?? [];

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // ALL_STUDIES
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Code', 'Title', 'Status', 'Category', 'Slots', 'Bounty', 'Pool', 'Verified', 'Created'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#5b8a9a', fontWeight: 400, letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 24, color: '#5b8a9a', textAlign: 'center' }}>No studies yet.</td></tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 12px', color: '#5b8a9a' }}>{(s.experiment_code as string | null) ?? '—'}</td>
                <td style={{ padding: '10px 12px', maxWidth: 240 }}>
                  <Link href={`/experiments/${s.id}`} target="_blank" style={{ color: '#f2faf4', textDecoration: 'none' }}>
                    {(s.title as string).slice(0, 50)}{(s.title as string).length > 50 ? '…' : ''}
                  </Link>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: STATUS_COLOR[s.status as string] ?? '#5b8a9a' }}>{s.status as string}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#aab8b1' }}>{s.category as string}</td>
                <td style={{ padding: '10px 12px', color: '#aab8b1' }}>{s.slots_filled as number}/{s.slots_total as number}</td>
                <td style={{ padding: '10px 12px', color: '#b7ff61' }}>${s.bounty_per_participant as number}</td>
                <td style={{ padding: '10px 12px', color: '#aab8b1' }}>${(s.total_bounty_pool as number).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: s.is_verified ? '#b7ff61' : '#5b8a9a' }}>{s.is_verified ? '✓' : '—'}</td>
                <td style={{ padding: '10px 12px', color: '#5b8a9a', whiteSpace: 'nowrap' }}>
                  {new Date(s.created_at as string).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

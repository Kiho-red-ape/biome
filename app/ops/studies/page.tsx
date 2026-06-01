import { createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  draft:      '#475569',
  recruiting: '#38bdf8',
  active:     '#f59e0b',
  completed:  '#475569',
  cancelled:  '#475569',
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
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#475569', fontWeight: 400, letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 24, color: '#475569', textAlign: 'center' }}>No studies yet.</td></tr>
            )}
            {rows.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '10px 12px', color: '#475569' }}>{(s.experiment_code as string | null) ?? '—'}</td>
                <td style={{ padding: '10px 12px', maxWidth: 240 }}>
                  <Link href={`/experiments/${s.id}`} target="_blank" style={{ color: '#f8fafc', textDecoration: 'none' }}>
                    {(s.title as string).slice(0, 50)}{(s.title as string).length > 50 ? '…' : ''}
                  </Link>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ color: STATUS_COLOR[s.status as string] ?? '#475569' }}>{s.status as string}</span>
                </td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{s.category as string}</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{s.slots_filled as number}/{s.slots_total as number}</td>
                <td style={{ padding: '10px 12px', color: '#f59e0b' }}>${s.bounty_per_participant as number}</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>${(s.total_bounty_pool as number).toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: s.is_verified ? '#f59e0b' : '#475569' }}>{s.is_verified ? '✓' : '—'}</td>
                <td style={{ padding: '10px 12px', color: '#475569', whiteSpace: 'nowrap' }}>
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

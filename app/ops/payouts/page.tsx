import { createServiceClient } from '@/lib/supabase/server';

export default async function OpsPayouts({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const db = createServiceClient();

  let query = db
    .from('applications')
    .select('id, participant_id, experiment_id, payout_status, payout_net_amount, payout_fee_amount, payout_initiated_at, payout_completed_at, trolley_payment_id, experiments(title)')
    .order('payout_initiated_at', { ascending: false });

  const ps = status ?? 'pending';
  query = query.eq('payout_status', ps);

  const { data: payouts } = await query;
  const rows = (payouts ?? []) as Record<string, unknown>[];

  const title = ps === 'pending' ? 'PENDING_PAYOUTS' : ps === 'paid' ? 'COMPLETED_PAYOUTS' : 'PAYOUTS';

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '3px', color: '#ffb300', textTransform: 'uppercase', marginBottom: 20 }}>
        // {title}
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Application', 'Study', 'Participant', 'Amount', 'Fee', 'Status', 'Trolley ID', 'Initiated'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#4a6050', fontWeight: 400, letterSpacing: '1px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 24, color: '#4a6050', textAlign: 'center' }}>No payouts with status: {ps}</td></tr>
            )}
            {rows.map((p) => {
              const exp = p.experiments as { title: string } | null;
              return (
                <tr key={p.id as string} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 12px', color: '#4a6050', fontSize: 10 }}>{(p.id as string).slice(0, 8)}…</td>
                  <td style={{ padding: '8px 12px', color: '#aab8b1', maxWidth: 200 }}>{exp?.title?.slice(0, 30) ?? '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#aab8b1' }}>{(p.participant_id as string).slice(0, 16)}…</td>
                  <td style={{ padding: '8px 12px', color: '#b7ff61' }}>
                    {p.payout_net_amount != null ? `$${(p.payout_net_amount as number).toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#4a6050' }}>
                    {p.payout_fee_amount != null ? `$${(p.payout_fee_amount as number).toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: p.payout_status === 'paid' ? '#b7ff61' : '#ffb300' }}>
                    {p.payout_status as string}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#4a6050', fontSize: 10 }}>
                    {(p.trolley_payment_id as string | null) ?? '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#4a6050', whiteSpace: 'nowrap' }}>
                    {p.payout_initiated_at ? new Date(p.payout_initiated_at as string).toLocaleDateString() : '—'}
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

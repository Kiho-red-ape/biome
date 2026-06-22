import { createServiceClient } from '@/lib/supabase/server';
import { OpsPageHeader, OpsBadge, OpsTable, OpsTd, OpsEmpty } from '../_components/ui';

type PayoutTone = 'teal' | 'green' | 'amber' | 'red' | 'slate' | 'blue';

function payoutTone(status: string): PayoutTone {
  if (status === 'paid') return 'green';
  if (status === 'failed') return 'red';
  if (status === 'pending' || status === 'processing') return 'amber';
  return 'slate';
}

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

  const title = ps === 'pending' ? 'Pending Payouts' : ps === 'paid' ? 'Completed Payouts' : 'Payouts';

  return (
    <div>
      <OpsPageHeader label="Payouts" title={title} />

      <OpsTable head={['Application', 'Study', 'Participant', 'Amount', 'Fee', 'Status', 'Trolley ID', 'Initiated']}>
        {rows.length === 0 && <OpsEmpty>No payouts with status: {ps}</OpsEmpty>}
        {rows.map((p) => {
          const exp = p.experiments as { title: string } | null;
          return (
            <tr key={p.id as string}>
              <OpsTd mono dim nowrap>{(p.id as string).slice(0, 8)}…</OpsTd>
              <OpsTd>{exp?.title?.slice(0, 30) ?? '—'}</OpsTd>
              <OpsTd mono dim>{(p.participant_id as string).slice(0, 16)}…</OpsTd>
              <OpsTd mono nowrap>
                {p.payout_net_amount != null ? `$${(p.payout_net_amount as number).toFixed(2)}` : '—'}
              </OpsTd>
              <OpsTd mono dim>
                {p.payout_fee_amount != null ? `$${(p.payout_fee_amount as number).toFixed(2)}` : '—'}
              </OpsTd>
              <OpsTd nowrap><OpsBadge tone={payoutTone(p.payout_status as string)}>{p.payout_status as string}</OpsBadge></OpsTd>
              <OpsTd mono dim nowrap>
                {(p.trolley_payment_id as string | null) ?? '—'}
              </OpsTd>
              <OpsTd mono dim nowrap>
                {p.payout_initiated_at ? new Date(p.payout_initiated_at as string).toLocaleDateString() : '—'}
              </OpsTd>
            </tr>
          );
        })}
      </OpsTable>
    </div>
  );
}

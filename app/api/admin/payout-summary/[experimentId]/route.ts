import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

async function verifyAdmin(privyDid: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', privyDid).single();
  return data?.is_admin === true;
}

interface Props { params: Promise<{ experimentId: string }> }

// GET /api/admin/payout-summary/[experimentId]?privyDid=...
export async function GET(req: NextRequest, { params }: Props) {
  const { experimentId } = await params;
  const privyDid = req.nextUrl.searchParams.get('privyDid');

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const isAdmin = await verifyAdmin(privyDid);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const supabase = createServiceClient();

  const { data: exp } = await supabase
    .from('experiments')
    .select('id, title, status, bounty_pool_deposited, bounty_per_participant, experiment_code, launch_fee_paid')
    .eq('id', experimentId)
    .single();

  if (!exp) return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });

  const { data: apps } = await supabase
    .from('applications')
    .select(
      'id, participant_id, status, payout_status, payout_net_amount, ' +
      'payout_initiated_at, payout_completed_at, stripe_transfer_id, ' +
      'participant_profiles!participant_id(pseudonym, participant_id, stripe_onboarding_complete, stripe_account_id)'
    )
    .eq('experiment_id', experimentId)
    .in('status', ['enrolled', 'approved', 'completed']);

  const rows = (apps ?? []) as unknown as Array<{
    id: string;
    participant_id: string;
    status: string;
    payout_status: string;
    payout_net_amount: number | null;
    payout_initiated_at: string | null;
    payout_completed_at: string | null;
    stripe_transfer_id: string | null;
    participant_profiles: {
      pseudonym: string;
      participant_id: string;
      stripe_onboarding_complete: boolean;
      stripe_account_id: string | null;
    } | null;
  }>;

  const counts: Record<string, number> = {};
  let totalPaid = 0;
  let totalNet  = 0;

  for (const r of rows) {
    counts[r.payout_status] = (counts[r.payout_status] ?? 0) + 1;
    if (r.payout_status === 'paid') totalPaid += r.payout_net_amount ?? 0;
    totalNet += r.payout_net_amount ?? (Number(exp.bounty_per_participant) * 0.995);
  }

  return NextResponse.json({
    experiment: {
      id:                   exp.id,
      title:                exp.title,
      status:               exp.status,
      launch_fee_paid:      exp.launch_fee_paid,
      bounty_pool_deposited: exp.bounty_pool_deposited,
      experiment_code:      exp.experiment_code,
    },
    summary: {
      total:          rows.length,
      paid:           counts['paid']           ?? 0,
      processing:     counts['processing']     ?? 0,
      pending:        counts['pending']        ?? 0,
      method_missing: counts['method_missing'] ?? 0,
      failed:         counts['failed']         ?? 0,
      total_paid:     totalPaid,
      total_net:      totalNet,
    },
    applications: rows.map((r) => ({
      id:                         r.id,
      participant_id:             r.participant_id,
      pseudonym:                  r.participant_profiles?.pseudonym ?? r.participant_id,
      payout_status:              r.payout_status,
      payout_net_amount:          r.payout_net_amount,
      payout_initiated_at:        r.payout_initiated_at,
      payout_completed_at:        r.payout_completed_at,
      stripe_transfer_id:         r.stripe_transfer_id,
      stripe_onboarding_complete: r.participant_profiles?.stripe_onboarding_complete ?? false,
    })),
  });
}

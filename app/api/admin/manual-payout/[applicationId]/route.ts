import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

async function verifyAdmin(privyDid: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', privyDid).single();
  return data?.is_admin === true;
}

interface Props { params: Promise<{ applicationId: string }> }

// POST /api/admin/manual-payout/[applicationId]
// Marks a payout as manually completed (e.g. bank wire outside Trolley)
export async function POST(req: NextRequest, { params }: Props) {
  const { applicationId } = await params;
  const body = await req.json() as { privyDid?: string; netAmount?: number; notes?: string };
  const { privyDid, netAmount, notes } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const isAdmin = await verifyAdmin(privyDid);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const supabase = createServiceClient();

  const { data: app } = await supabase
    .from('applications')
    .select('id, participant_id, experiment_id, payout_status, payout_net_amount, experiments(bounty_per_participant)')
    .eq('id', applicationId)
    .single();

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  if (app.payout_status === 'paid') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 });
  }

  const exp   = app.experiments as { bounty_per_participant?: number } | null;
  const gross = Number(exp?.bounty_per_participant ?? 0);
  const fee   = gross * 0.005;
  const net   = netAmount ?? parseFloat((gross - fee).toFixed(2));

  const now = new Date().toISOString();

  await supabase.from('applications').update({
    payout_status:        'paid',
    payout_completed_at:  now,
    payout_initiated_at:  app.payout_status === 'pending' ? now : undefined,
    payout_net_amount:    net,
    payout_fee_amount:    gross * 0.005,
  }).eq('id', applicationId);

  // Increment participant total_earned (non-fatal)
  await supabase.rpc('increment_total_earned', {
    p_user_id: app.participant_id as string,
    p_amount:  net,
  }).then(() => {/* non-fatal */});

  return NextResponse.json({
    ok: true,
    applicationId,
    netAmount: net,
    notes: notes ?? null,
    message: 'Manual payout recorded',
  });
}

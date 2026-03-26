import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

async function verifyAdmin(privyDid: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', privyDid).single();
  return data?.is_admin === true;
}

interface Props { params: Promise<{ experimentId: string }> }

// POST /api/admin/confirm-deposit/[experimentId]
// Marks the escrow deposit as received for an experiment
export async function POST(req: NextRequest, { params }: Props) {
  const { experimentId } = await params;
  const body = await req.json() as { privyDid?: string; notes?: string };
  const { privyDid, notes } = body;

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const isAdmin = await verifyAdmin(privyDid);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const supabase = createServiceClient();

  const { data: exp, error: expErr } = await supabase
    .from('experiments')
    .select('id, title, escrow_status, bounty_per_participant')
    .eq('id', experimentId)
    .single();

  if (expErr || !exp) return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });

  if (exp.escrow_status === 'deposited') {
    return NextResponse.json({ ok: true, message: 'Already confirmed' });
  }

  const { error } = await supabase
    .from('experiments')
    .update({
      escrow_status:       'deposited',
      escrow_deposited_at: new Date().toISOString(),
    })
    .eq('id', experimentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    experimentId,
    message: notes
      ? `Deposit confirmed. Notes: ${notes}`
      : 'Deposit confirmed — payouts can now be processed',
  });
}

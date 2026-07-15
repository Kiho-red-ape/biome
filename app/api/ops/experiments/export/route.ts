import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = createServiceClient();

  const [
    { data: experiment },
    { data: applications },
    { data: kits },
    { data: notifications },
  ] = await Promise.all([
    db.from('experiments').select('*').eq('id', id).single(),
    db.from('applications').select('*').eq('experiment_id', id),
    db.from('sample_kits').select('*').eq('experiment_id', id),
    db.from('notifications').select('*').eq('experiment_id', id).limit(500),
  ]);

  const pack = {
    generated_at:     new Date().toISOString(),
    experiment_id:    id,
    experiment,
    consent_records:  (applications ?? []).filter((a) => a.study_agreement_accepted_at),
    payout_records:   (applications ?? []).map((a) => ({
      id:              a.id,
      participant_id:  a.participant_id,
      payout_status:   a.payout_status,
      payout_net:      a.payout_net_amount,
      payout_fee:      a.payout_fee_amount,
      completed_at:    a.payout_completed_at,
      trolley_id:      a.trolley_payment_id,
    })),
    sample_kits:       kits ?? [],
    communications:    notifications ?? [],
  };

  return new NextResponse(JSON.stringify(pack, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="biome-compliance-${id.slice(0, 8)}.json"`,
    },
  });
}

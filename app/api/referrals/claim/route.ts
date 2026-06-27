// POST /api/referrals/claim  { privyDid, code }
// Attributes a freshly-signed-up participant to the referrer who shared `code`.
// Sets the referral to 'signed_up' and stamps source_channel='referral'.
// (Community-builder credit only unlocks later, when the referee completes the
// awareness ladder — see lib/referrals/credit.onReferredBecameAware.)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const schema = z.object({
  privyDid: z.string().min(1),
  code:     z.string().min(4).max(12),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'privyDid and code required' }, { status: 400 });
  }

  const { privyDid, code } = parsed;
  const db = createServiceClient();

  // Resolve the referrer from the code.
  const { data: referrerProf } = await db
    .from('participant_profiles')
    .select('user_id')
    .eq('referral_code', code.toUpperCase())
    .maybeSingle();

  const referrerId = (referrerProf as { user_id: string } | null)?.user_id;
  if (!referrerId) return NextResponse.json({ matched: false, reason: 'unknown_code' });
  if (referrerId === privyDid) return NextResponse.json({ matched: false, reason: 'self_referral' });

  // Idempotency: if this referee is already attributed, do nothing.
  const { data: already } = await db
    .from('referrals')
    .select('id')
    .eq('referred_id', privyDid)
    .maybeSingle();
  if (already) return NextResponse.json({ matched: true, alreadyClaimed: true });

  const now = new Date().toISOString();

  // Claim an outstanding invite for this code, else create the referral edge.
  const { data: pending } = await db
    .from('referrals')
    .select('id')
    .eq('referral_code', code.toUpperCase())
    .is('referred_id', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (pending) {
    await db.from('referrals')
      .update({ referred_id: privyDid, status: 'signed_up', signed_up_at: now })
      .eq('id', (pending as { id: string }).id);
  } else {
    await db.from('referrals').insert({
      referrer_id: referrerId, referred_id: privyDid, referral_code: code.toUpperCase(),
      status: 'signed_up', signed_up_at: now,
    });
  }

  // Mark attribution on the new participant.
  await db.from('participant_profiles')
    .update({ source_channel: 'referral' })
    .eq('user_id', privyDid);

  return NextResponse.json({ matched: true });
}

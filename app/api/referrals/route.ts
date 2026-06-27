// GET  /api/referrals?privyDid=  → referral code + community standing + referral list
// POST /api/referrals            → { action: 'ensure_code' | 'send' }
//
// Framing is "help grow the research community" — never per-head earning. The
// community_credit ledger is separate and never shown with study reimbursement.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { ensureReferralCode } from '@/lib/referrals/code';
import { COMMUNITY_BUILDER_THRESHOLD } from '@/lib/referrals/credit';

export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const db = createServiceClient();
  const code = await ensureReferralCode(privyDid, db);

  const [{ data: prof }, { data: refs }] = await Promise.all([
    db.from('participant_profiles')
      .select('verification_level, successful_referrals, community_credit')
      .eq('user_id', privyDid).maybeSingle(),
    db.from('referrals')
      .select('id, referred_email, status, signed_up_at, created_at')
      .eq('referrer_id', privyDid)
      .order('created_at', { ascending: false }),
  ]);

  const p = prof as { verification_level: string | null; successful_referrals: number | null; community_credit: number | null } | null;

  return NextResponse.json({
    referralCode:        code,
    verificationLevel:   p?.verification_level ?? 'unverified',
    successfulReferrals: p?.successful_referrals ?? 0,
    communityCredit:     p?.community_credit ?? 0,
    threshold:           COMMUNITY_BUILDER_THRESHOLD,
    referrals:           (refs ?? []).map((r) => ({
      id: r.id, email: r.referred_email, status: r.status,
      signedUpAt: r.signed_up_at, createdAt: r.created_at,
    })),
  });
}

const postSchema = z.union([
  z.object({ privyDid: z.string().min(1), action: z.literal('ensure_code') }),
  z.object({ privyDid: z.string().min(1), action: z.literal('send'), email: z.string().email() }),
]);

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof postSchema>;
  try {
    parsed = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const db = createServiceClient();
  const code = await ensureReferralCode(parsed.privyDid, db);

  if (parsed.action === 'ensure_code') {
    return NextResponse.json({ referralCode: code });
  }

  // action === 'send' — record an invite (gated: only verified members can refer,
  // because the awareness modules teach that consent is independent and unpressured).
  const { data: prof } = await db
    .from('participant_profiles')
    .select('verification_level')
    .eq('user_id', parsed.privyDid)
    .maybeSingle();

  const level = (prof as { verification_level: string | null } | null)?.verification_level ?? 'unverified';
  if (level === 'unverified') {
    return NextResponse.json({ error: 'Complete the research-awareness modules before inviting others' }, { status: 403 });
  }

  await db.from('referrals').insert({
    referrer_id:    parsed.privyDid,
    referral_code:  code,
    referred_email: parsed.email,
    status:         'sent',
  });

  return NextResponse.json({ ok: true, referralCode: code });
}

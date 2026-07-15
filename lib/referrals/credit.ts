// Community-builder unlock logic — shared by the awareness route (which fires
// when a referred person becomes research-aware) and the Stage 3 referral route.
//
// ETHICS: community_credit is a flat, fixed community acknowledgment. It is NOT a
// per-head bounty, NOT a percentage, NOT tied to any study, and is held in a
// ledger that is never blended with study reimbursement.

import { createServiceClient } from '@/lib/supabase/server';

export const COMMUNITY_BUILDER_THRESHOLD = 3;     // referrals who complete awareness
export const COMMUNITY_CREDIT_AWARD       = 25.00; // flat, one-time community acknowledgment

type Db = ReturnType<typeof createServiceClient>;

// Recompute a referrer's standing. Counts referred people who have completed the
// awareness ladder; on crossing the threshold, promotes to community_builder and
// grants the flat credit exactly once. Idempotent.
export async function recomputeCommunityBuilder(referrerId: string, db?: Db): Promise<void> {
  const supabase = db ?? createServiceClient();

  const { count } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('status', 'awareness_complete');

  const successful = count ?? 0;

  const { data: prof } = await supabase
    .from('participant_profiles')
    .select('verification_level, community_credit')
    .eq('user_id', referrerId)
    .maybeSingle();

  if (!prof) return;

  const current = prof as { verification_level: string | null; community_credit: number | null };
  const update: Record<string, unknown> = { successful_referrals: successful };

  const qualifies = successful >= COMMUNITY_BUILDER_THRESHOLD;
  const alreadyBuilder = current.verification_level === 'community_builder';

  if (qualifies && !alreadyBuilder) {
    update.verification_level = 'community_builder';
    // Grant the flat credit once, on promotion.
    update.community_credit = (current.community_credit ?? 0) + COMMUNITY_CREDIT_AWARD;
  }

  await supabase.from('participant_profiles').update(update).eq('user_id', referrerId);
}

// Mark a referred participant's referral as awareness-complete, then recompute
// their referrer. Called when someone reaches verification_level 'aware'.
export async function onReferredBecameAware(referredId: string, db?: Db): Promise<void> {
  const supabase = db ?? createServiceClient();

  const { data: refs } = await supabase
    .from('referrals')
    .select('id, referrer_id, status')
    .eq('referred_id', referredId);

  const rows = (refs ?? []) as { id: string; referrer_id: string; status: string }[];
  if (rows.length === 0) return;

  await supabase
    .from('referrals')
    .update({ status: 'awareness_complete' })
    .eq('referred_id', referredId)
    .neq('status', 'awareness_complete');

  // Recompute each distinct referrer (normally one).
  const referrers = [...new Set(rows.map((r) => r.referrer_id))];
  await Promise.all(referrers.map((r) => recomputeCommunityBuilder(r, supabase)));
}

// GET   /api/ops/agent  → operator agent console aggregates
// PATCH /api/ops/agent  → resolve a flagged conversation
//
// Mirrors the batched Promise.all pattern of /api/ops/dashboard-stats.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import type { AgentMessage, ReusableEligibility } from '@/lib/agent/types';

export async function GET() {
  const db = createServiceClient();

  const [
    flaggedRes, funnelTotal, funnelAware, funnelVerified, funnelBuilder,
    consentRes, referralsRes, verifiedPoolRes,
  ] = await Promise.all([
    db.from('agent_conversations')
      .select('id, participant_id, stage, experiment_id, operator_flag_reason, messages, updated_at')
      .eq('status', 'flagged_operator')
      .order('updated_at', { ascending: false })
      .limit(100),
    db.from('participant_profiles').select('user_id', { count: 'exact', head: true }),
    db.from('participant_profiles').select('user_id', { count: 'exact', head: true }).eq('verification_level', 'aware'),
    db.from('participant_profiles').select('user_id', { count: 'exact', head: true }).eq('verification_level', 'verified'),
    db.from('participant_profiles').select('user_id', { count: 'exact', head: true }).eq('verification_level', 'community_builder'),
    db.from('consent_records')
      .select('id, participant_id, experiment_id, icf_version, comprehension_quiz_score, comprehension_quiz_passed, consent_given, consent_timestamp, withdrawn')
      .order('created_at', { ascending: false })
      .limit(200),
    db.from('referrals').select('id, referrer_id, referred_id, status, created_at'),
    db.from('participant_profiles')
      .select('reusable_eligibility')
      .in('verification_level', ['verified', 'community_builder']),
  ]);

  // Flagged queue — attach the last message for triage context.
  const flagged = (flaggedRes.data ?? []).map((c) => {
    const msgs = (c.messages as AgentMessage[] | null) ?? [];
    const last = msgs.length ? msgs[msgs.length - 1] : null;
    return {
      id: c.id, participantId: c.participant_id, stage: c.stage,
      experimentId: c.experiment_id, reason: c.operator_flag_reason,
      lastMessage: last ? `${last.role}: ${last.content.slice(0, 240)}` : null,
      updatedAt: c.updated_at,
    };
  });

  // Awareness funnel.
  const funnel = {
    signedUp:         funnelTotal.count ?? 0,
    aware:            funnelAware.count ?? 0,
    verified:         funnelVerified.count ?? 0,
    communityBuilder: funnelBuilder.count ?? 0,
  };

  // Referral graph rollups.
  const refRows = (referralsRes.data ?? []) as { status: string; referrer_id: string }[];
  const referrals = {
    totalSent:         refRows.length,
    signedUp:          refRows.filter((r) => r.status === 'signed_up' || r.status === 'awareness_complete').length,
    awarenessComplete: refRows.filter((r) => r.status === 'awareness_complete').length,
    builders:          funnel.communityBuilder,
  };

  // Pool readiness — verified participants grouped by sample comfort + location.
  const bySample: Record<string, number> = {};
  const byLocation: Record<string, number> = {};
  for (const row of (verifiedPoolRes.data ?? [])) {
    const re = (row.reusable_eligibility ?? {}) as ReusableEligibility;
    for (const s of re.samples_comfortable_with ?? []) bySample[s] = (bySample[s] ?? 0) + 1;
    if (re.location) byLocation[re.location] = (byLocation[re.location] ?? 0) + 1;
  }

  const poolReadiness = {
    verifiedCount: (verifiedPoolRes.data ?? []).length,
    bySample,
    byLocation,
  };

  const consent = (consentRes.data ?? []).map((c) => ({
    id: c.id, participantId: c.participant_id, experimentId: c.experiment_id,
    icfVersion: c.icf_version, quizScore: c.comprehension_quiz_score,
    quizPassed: c.comprehension_quiz_passed, consentGiven: c.consent_given,
    consentAt: c.consent_timestamp, withdrawn: c.withdrawn,
  }));

  return NextResponse.json({ flagged, funnel, referrals, poolReadiness, consent });
}

const patchSchema = z.object({
  conversationId: z.string().uuid(),
  action:         z.literal('resolve'),
});

export async function PATCH(req: NextRequest) {
  let parsed: z.infer<typeof patchSchema>;
  try {
    parsed = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'conversationId required' }, { status: 400 });
  }

  const db = createServiceClient();
  const { error } = await db
    .from('agent_conversations')
    .update({ status: 'complete', updated_at: new Date().toISOString() })
    .eq('id', parsed.conversationId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

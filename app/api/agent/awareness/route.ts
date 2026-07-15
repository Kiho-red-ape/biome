// GET  /api/agent/awareness?privyDid=  → modules (no answer key) + progress + level
// POST /api/agent/awareness            → grade a module submission, update progress,
//                                          and level the participant up when all pass.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { gradeModule, publicModules, TOTAL_MODULES } from '@/lib/agent/awareness-content';
import { onReferredBecameAware } from '@/lib/referrals/credit';
import type { ReusableEligibility, VerificationLevel } from '@/lib/agent/types';

const PRIORITY_AWARE    = 50;
const PRIORITY_VERIFIED = 100;

// "Profile complete enough to be verified" — has the core matchable signals.
function profileComplete(re: ReusableEligibility, country: string | null): boolean {
  return !!country && !!re.age_range && !!re.location;
}

export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const db = createServiceClient();
  const { data: progressRows } = await db
    .from('awareness_progress')
    .select('module_id, completed, quiz_passed, quiz_score, attempts, completed_at')
    .eq('participant_id', privyDid);

  const { data: prof } = await db
    .from('participant_profiles')
    .select('verification_level, awareness_completed_at')
    .eq('user_id', privyDid)
    .maybeSingle();

  const byId = new Map((progressRows ?? []).map((r) => [r.module_id as string, r]));
  const modules = publicModules().map((m) => {
    const p = byId.get(m.id);
    return {
      ...m,
      progress: {
        completed:   p?.completed ?? false,
        quizPassed:  p?.quiz_passed ?? false,
        quizScore:   p?.quiz_score ?? null,
        attempts:    p?.attempts ?? 0,
        completedAt: p?.completed_at ?? null,
      },
    };
  });

  const passedCount = modules.filter((m) => m.progress.quizPassed).length;

  return NextResponse.json({
    modules,
    passedCount,
    totalModules: TOTAL_MODULES,
    verificationLevel:   (prof?.verification_level as VerificationLevel) ?? 'unverified',
    awarenessCompletedAt: prof?.awareness_completed_at ?? null,
  });
}

const submitSchema = z.object({
  privyDid: z.string().min(1),
  moduleId: z.string().min(1),
  answers:  z.array(z.number().int().min(0)).min(1).max(10),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof submitSchema>;
  try {
    parsed = submitSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'privyDid, moduleId and answers required' }, { status: 400 });
  }

  const { privyDid, moduleId, answers } = parsed;
  const graded = gradeModule(moduleId, answers);
  if (!graded) return NextResponse.json({ error: 'Unknown module' }, { status: 404 });

  const db = createServiceClient();

  // Read prior attempt count to increment.
  const { data: existing } = await db
    .from('awareness_progress')
    .select('attempts')
    .eq('participant_id', privyDid)
    .eq('module_id', moduleId)
    .maybeSingle();

  const attempts = ((existing?.attempts as number) ?? 0) + 1;
  const now = new Date().toISOString();

  await db.from('awareness_progress').upsert({
    participant_id: privyDid,
    module_id:      moduleId,
    completed:      graded.passed,
    quiz_passed:    graded.passed,
    quiz_score:     graded.score,
    attempts,
    completed_at:   graded.passed ? now : null,
  }, { onConflict: 'participant_id,module_id' });

  // ── Re-evaluate verification level across all modules ──────────────────────────
  const { data: allProgress } = await db
    .from('awareness_progress')
    .select('module_id, quiz_passed')
    .eq('participant_id', privyDid);

  const passedCount = (allProgress ?? []).filter((r) => r.quiz_passed).length;
  const allPassed   = passedCount >= TOTAL_MODULES;

  let levelChange: { verificationLevel: VerificationLevel } | null = null;

  if (allPassed) {
    const { data: prof } = await db
      .from('participant_profiles')
      .select('verification_level, country, reusable_eligibility, awareness_completed_at')
      .eq('user_id', privyDid)
      .maybeSingle();

    const p = prof as {
      verification_level: VerificationLevel | null;
      country: string | null;
      reusable_eligibility: ReusableEligibility | null;
      awareness_completed_at: string | null;
    } | null;

    // Never downgrade a community_builder.
    if (p && p.verification_level !== 'community_builder') {
      const isVerified = profileComplete(p.reusable_eligibility ?? {}, p.country);
      const nextLevel: VerificationLevel = isVerified ? 'verified' : 'aware';
      const wasUnaware = (p.verification_level ?? 'unverified') === 'unverified';

      await db.from('participant_profiles').update({
        verification_level:     nextLevel,
        awareness_completed_at: p.awareness_completed_at ?? now,
        priority_match_score:   isVerified ? PRIORITY_VERIFIED : PRIORITY_AWARE,
      }).eq('user_id', privyDid);

      levelChange = { verificationLevel: nextLevel };

      // First time reaching awareness → advance any referral that points at them.
      if (wasUnaware) {
        try { await onReferredBecameAware(privyDid, db); } catch (e) { console.error('[awareness] referral hook', e); }
      }
    }
  }

  return NextResponse.json({
    passed: graded.passed,
    score:  graded.score,
    total:  graded.total,
    attempts,
    passedCount,
    totalModules: TOTAL_MODULES,
    allPassed,
    levelChange,
  });
}

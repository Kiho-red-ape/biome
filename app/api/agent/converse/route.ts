// POST /api/agent/converse
// The single conversational endpoint for all four agent modes. Loads persistent
// memory, runs one turn, persists it, and (onboarding) folds captured signals
// into the participant's reusable_eligibility under the hood.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { runAgentTurn } from '@/lib/agent/engine';
import type { ReusableEligibility } from '@/lib/agent/types';

const schema = z.object({
  privyDid:     z.string().min(1),
  stage:        z.enum(['onboard', 'screen', 'consent', 'support']),
  message:      z.string().min(1).max(4000),
  experimentId: z.string().uuid().nullable().optional(),
});

// Keys we lift from onboarding `extracted` into participant_profiles.reusable_eligibility.
const ELIGIBILITY_KEYS: (keyof ReusableEligibility)[] = [
  'age_range', 'location', 'general_health_context', 'samples_comfortable_with',
  'conditions_disclosed', 'interests', 'languages', 'devices_owned',
];

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'privyDid, stage and message required' }, { status: 400 });
  }

  const { privyDid, stage, message, experimentId } = parsed;

  // Consent mode requires a study context.
  if ((stage === 'screen' || stage === 'consent') && !experimentId) {
    return NextResponse.json({ error: `${stage} mode requires experimentId` }, { status: 400 });
  }

  let result;
  try {
    result = await runAgentTurn({
      participantId: privyDid,
      mode:          stage,
      userMessage:   message,
      experimentId:  experimentId ?? null,
    });
  } catch (err) {
    console.error('[agent/converse]', err);
    return NextResponse.json({ error: 'Agent unavailable — please try again' }, { status: 502 });
  }

  // ── Onboarding side-effect: merge captured signals into reusable_eligibility ──
  if (stage === 'onboard' && Object.keys(result.extracted).length > 0) {
    const db = createServiceClient();
    const { data: prof } = await db
      .from('participant_profiles')
      .select('reusable_eligibility, language_fluency')
      .eq('user_id', privyDid)
      .maybeSingle();

    const current = (prof?.reusable_eligibility ?? {}) as ReusableEligibility;
    const merged: ReusableEligibility = { ...current };
    for (const key of ELIGIBILITY_KEYS) {
      const v = (result.extracted as Record<string, unknown>)[key];
      if (v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0)) {
        // @ts-expect-error — key/value types align by construction
        merged[key] = v;
      }
    }

    const update: Record<string, unknown> = { reusable_eligibility: merged };
    // Mirror languages into the existing structured column when present.
    if (Array.isArray(merged.languages) && merged.languages.length > 0 && !prof?.language_fluency) {
      update.language_fluency = merged.languages;
    }

    await db.from('participant_profiles').update(update).eq('user_id', privyDid);
  }

  return NextResponse.json(result);
}

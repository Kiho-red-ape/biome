// GET  /api/agent/find?experimentId=  → latest run + outreach targets
// POST /api/agent/find                 → run the Stage 0 find agent for a study

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { runFindAgent } from '@/lib/agent/find-engine';

// The agent makes several model calls (research + extraction); allow headroom.
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const experimentId = req.nextUrl.searchParams.get('experimentId');
  if (!experimentId) return NextResponse.json({ error: 'experimentId required' }, { status: 400 });

  const db = createServiceClient();

  const [{ data: run }, { data: targets }] = await Promise.all([
    db.from('recruitment_runs')
      .select('id, status, summary, targets_found, created_at, completed_at, error')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('recruitment_targets')
      .select('id, cohort, kind, name, region, url, fit_score, size_estimate, accessibility, trust, rationale, contact_hint, status')
      .eq('experiment_id', experimentId)
      .order('fit_score', { ascending: false, nullsFirst: false })
      .limit(60),
  ]);

  return NextResponse.json({ run: run ?? null, targets: targets ?? [] });
}

const postSchema = z.object({
  experimentId:     z.string().uuid(),
  operatorPrivyDid: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof postSchema>;
  try {
    parsed = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'experimentId and operatorPrivyDid required' }, { status: 400 });
  }

  try {
    const result = await runFindAgent(parsed.experimentId, 'manual');
    return NextResponse.json(result);
  } catch (err) {
    console.error('[agent/find]', err);
    return NextResponse.json({ error: 'Find agent failed — please retry' }, { status: 502 });
  }
}

// GET   /api/ops/launch-requests  → studies awaiting payment confirmation
// PATCH /api/ops/launch-requests  → { experimentId, operatorPrivyDid, action:'confirm_paid' }
//   confirms the (placeholder) deposit, flips draft → recruiting, and queues the
//   Stage 0 find agent.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const db = createServiceClient();

  const { data: rows } = await db
    .from('experiments')
    .select('id, title, category, slots_total, bounty_per_participant, total_bounty_pool, experimenter_id, launch_requested_at, payment_status')
    .eq('payment_status', 'launch_requested')
    .order('launch_requested_at', { ascending: true });

  const list = (rows ?? []) as Array<Record<string, unknown>>;

  // Attach org names.
  const ownerIds = [...new Set(list.map((r) => r.experimenter_id as string))];
  const orgByOwner = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: orgs } = await db
      .from('experimenter_profiles').select('user_id, org_name').in('user_id', ownerIds);
    for (const o of (orgs ?? []) as { user_id: string; org_name: string }[]) orgByOwner.set(o.user_id, o.org_name);
  }

  return NextResponse.json({
    requests: list.map((r) => ({
      id: r.id, title: r.title, category: r.category,
      slotsTotal: r.slots_total, bountyPerParticipant: r.bounty_per_participant,
      totalPool: r.total_bounty_pool, orgName: orgByOwner.get(r.experimenter_id as string) ?? '—',
      requestedAt: r.launch_requested_at,
    })),
  });
}

const patchSchema = z.object({
  experimentId:     z.string().uuid(),
  operatorPrivyDid: z.string().min(1),
  action:           z.literal('confirm_paid'),
});

export async function PATCH(req: NextRequest) {
  let parsed: z.infer<typeof patchSchema>;
  try { parsed = patchSchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'experimentId and operatorPrivyDid required' }, { status: 400 }); }

  const db = createServiceClient();
  const now = new Date().toISOString();

  const { data: exp } = await db
    .from('experiments').select('status, payment_status').eq('id', parsed.experimentId).maybeSingle();
  const e = exp as { status: string; payment_status: string | null } | null;
  if (!e) return NextResponse.json({ error: 'Study not found' }, { status: 404 });

  // Confirm payment + open recruiting.
  await db.from('experiments').update({
    payment_status:       'paid',
    payment_confirmed_by: parsed.operatorPrivyDid,
    payment_confirmed_at: now,
    status:               'recruiting',
  }).eq('id', parsed.experimentId);

  // Trigger Stage 0: queue a find run. The heavy model work is executed by
  // POST /api/agent/find (kept off the request path so the confirm stays fast).
  await db.from('recruitment_runs')
    .insert({ experiment_id: parsed.experimentId, status: 'queued', trigger: 'recruiting' });

  return NextResponse.json({ ok: true, status: 'recruiting', stage0: 'queued' });
}

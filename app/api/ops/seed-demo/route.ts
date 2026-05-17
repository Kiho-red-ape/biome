// POST /api/ops/seed-demo
// Relinks a demo placeholder profile to a real Privy DID.
// Call after the real user logs in so their DID is known.
// Body: { demoId: 'demo:researcher' | 'demo:participant' | 'demo:partner', realDid: string }
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  demoId:  z.enum(['demo:researcher', 'demo:participant', 'demo:partner']),
  realDid: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body: unknown = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { demoId, realDid } = parsed.data;
  const db = createServiceClient();

  // Check if the real DID already has a profile
  const { data: existing } = await db.from('profiles').select('id').eq('id', realDid).single();
  if (existing) {
    return NextResponse.json({ ok: true, message: 'Profile already exists for this DID — no migration needed.' });
  }

  // Relink all tables from placeholder demoId → realDid
  // profiles
  const { error: pErr } = await db.from('profiles').update({ id: realDid }).eq('id', demoId);
  if (pErr) return NextResponse.json({ error: `profiles: ${pErr.message}` }, { status: 500 });

  // experimenter_profiles
  await db.from('experimenter_profiles').update({ user_id: realDid }).eq('user_id', demoId);
  // participant_profiles
  await db.from('participant_profiles').update({ user_id: realDid }).eq('user_id', demoId);
  // experiments
  await db.from('experiments').update({ experimenter_id: realDid }).eq('experimenter_id', demoId);
  // applications
  await db.from('applications').update({ participant_id: realDid }).eq('participant_id', demoId);
  // participant_milestones
  await db.from('participant_milestones').update({ participant_id: realDid }).eq('participant_id', demoId);

  return NextResponse.json({ ok: true, message: `Relinked ${demoId} → ${realDid}` });
}

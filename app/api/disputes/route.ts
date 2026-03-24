// POST /api/disputes — raise a new dispute
// Rules:
//   - 7-day window from the milestone rejection or flag event
//   - 3 free disputes per participant; 4th+ costs $10 (fee_charged flag, experimenter to bill)
//   - Participant must own the application

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const FREE_DISPUTES = 3;

const Schema = z.object({
  experiment_id:  z.string().uuid(),
  application_id: z.string().uuid(),
  milestone_id:   z.string().uuid().optional(),
  subject:        z.string().min(5).max(200),
  description:    z.string().min(20).max(2000),
  privy_did:      z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { experiment_id, application_id, milestone_id, subject, description, privy_did } = parsed.data;
  const supabase = createServiceClient();

  // 1. Verify the application belongs to this participant
  const { data: appRow } = await supabase
    .from('applications')
    .select('id, participant_id, applied_at, status')
    .eq('id', application_id)
    .single();

  if (!appRow || appRow.participant_id !== privy_did) {
    return NextResponse.json({ error: 'Application not found or access denied' }, { status: 403 });
  }

  // 2. Enforce 7-day window if milestone_id provided
  if (milestone_id) {
    const { data: pm } = await supabase
      .from('participant_milestones')
      .select('updated_at, status')
      .eq('id', milestone_id)
      .single();

    if (pm && (pm.status === 'rejected' || pm.status === 'missed')) {
      const updatedAt = new Date(pm.updated_at as string);
      const windowEnd = new Date(updatedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (new Date() > windowEnd) {
        return NextResponse.json({ error: 'Dispute window has closed (7 days after milestone decision)' }, { status: 422 });
      }
    }
  }

  // 3. Get or create dispute_credits row
  const { data: credits } = await supabase
    .from('dispute_credits')
    .select('free_used, total_raised')
    .eq('participant_id', privy_did)
    .single();

  const freeUsed    = (credits?.free_used  ?? 0) as number;
  const totalRaised = (credits?.total_raised ?? 0) as number;
  const feeCharged  = freeUsed >= FREE_DISPUTES;
  const feeAmount   = feeCharged ? 10.00 : 0;

  // 4. Insert dispute
  const { data: dispute, error: insertErr } = await supabase
    .from('disputes')
    .insert({
      experiment_id,
      application_id,
      milestone_id: milestone_id ?? null,
      raised_by: privy_did,
      subject,
      description,
      fee_charged: feeCharged,
      fee_amount: feeAmount,
    })
    .select('id')
    .single();

  if (insertErr || !dispute) {
    return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
  }

  // 5. Upsert credits
  await supabase.from('dispute_credits').upsert({
    participant_id: privy_did,
    free_used:    Math.min(freeUsed + 1, FREE_DISPUTES),
    total_raised: totalRaised + 1,
    updated_at: new Date().toISOString(),
  });

  // 6. Auto-post opening message from participant
  await supabase.from('dispute_messages').insert({
    dispute_id:  dispute.id,
    author_id:   privy_did,
    author_role: 'participant',
    content:     description,
  });

  return NextResponse.json({
    dispute_id: dispute.id,
    fee_charged: feeCharged,
    fee_amount:  feeAmount,
    free_remaining: Math.max(0, FREE_DISPUTES - (freeUsed + 1)),
  }, { status: 201 });
}

// GET /api/disputes?privy_did=xxx — list disputes for a participant
export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privy_did');
  if (!privyDid) return NextResponse.json({ error: 'privy_did required' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('disputes')
    .select('id, experiment_id, subject, status, fee_charged, fee_amount, created_at')
    .eq('raised_by', privyDid)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ disputes: data ?? [] });
}

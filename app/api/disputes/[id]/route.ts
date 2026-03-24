// GET  /api/disputes/[id] — fetch dispute + messages
// PATCH /api/disputes/[id] — update status / post resolution (experimenter/admin)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: dispute }, { data: messages }] = await Promise.all([
    supabase.from('disputes').select('*').eq('id', id).single(),
    supabase
      .from('dispute_messages')
      .select('id, author_id, author_role, content, created_at')
      .eq('dispute_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ dispute, messages: messages ?? [] });
}

const PatchSchema = z.object({
  privy_did:       z.string().min(1),
  status:          z.enum(['under_review', 'resolved_for_participant', 'resolved_for_experimenter', 'closed']).optional(),
  resolution_note: z.string().max(2000).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { privy_did, status, resolution_note } = parsed.data;
  const supabase = createServiceClient();

  // Verify access: experimenter owns the experiment associated with this dispute
  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, experiment_id, raised_by')
    .eq('id', id)
    .single();

  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: exp } = await supabase
    .from('experiments')
    .select('experimenter_id')
    .eq('id', dispute.experiment_id as string)
    .single();

  const isExperimenter = exp && (exp.experimenter_id as string) === privy_did;
  const isOwner        = (dispute.raised_by as string) === privy_did;

  if (!isExperimenter && !isOwner) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (status)          updates.status          = status;
  if (resolution_note) updates.resolution_note = resolution_note;
  if (status && ['resolved_for_participant', 'resolved_for_experimenter', 'closed'].includes(status)) {
    updates.resolved_at = new Date().toISOString();
    updates.resolved_by = privy_did;
  }

  const { error } = await supabase.from('disputes').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

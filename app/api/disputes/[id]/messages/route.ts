// POST /api/disputes/[id]/messages — add a message to a dispute thread

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const Schema = z.object({
  privy_did:   z.string().min(1),
  content:     z.string().min(1).max(2000),
  author_role: z.enum(['participant', 'experimenter', 'admin']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body   = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { privy_did, content, author_role } = parsed.data;
  const supabase = createServiceClient();

  // Verify access
  const { data: dispute } = await supabase
    .from('disputes')
    .select('id, experiment_id, raised_by, status')
    .eq('id', id)
    .single();

  if (!dispute) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Closed disputes cannot receive new messages
  if ((dispute.status as string) === 'closed') {
    return NextResponse.json({ error: 'Dispute is closed' }, { status: 422 });
  }

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

  const { data: msg, error } = await supabase
    .from('dispute_messages')
    .insert({ dispute_id: id, author_id: privy_did, author_role, content })
    .select('id, author_id, author_role, content, created_at')
    .single();

  if (error || !msg) return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  return NextResponse.json({ message: msg }, { status: 201 });
}

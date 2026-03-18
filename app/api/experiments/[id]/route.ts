import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH /api/experiments/[id] — publish draft (status: 'draft' → 'recruiting')
export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;

  const body = await req.json() as { privyDid?: string; action?: string };
  const { privyDid, action } = body;

  if (!privyDid || action !== 'publish') {
    return NextResponse.json({ error: 'Missing privyDid or action' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch experiment and verify ownership
  const { data: exp, error: fetchErr } = await supabase
    .from('experiments')
    .select('id, status, experimenter_id')
    .eq('id', id)
    .single();

  if (fetchErr || !exp) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
  }

  if (exp.experimenter_id !== privyDid) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (exp.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft experiments can be published' }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from('experiments')
    .update({ status: 'recruiting' })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ experiment: updated });
}

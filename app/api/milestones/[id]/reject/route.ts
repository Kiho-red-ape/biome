import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH /api/milestones/[id]/reject
// Body: { privyDid, reason }
// Experimenter rejects a submitted milestone → status 'rejected'
export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json() as { privyDid?: string; reason?: string };
  const { privyDid, reason } = body;
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: pmRaw } = await supabase
    .from('participant_milestones')
    .select('id, status, experiment_id')
    .eq('id', id)
    .single();

  if (!pmRaw) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

  const pm = pmRaw as Record<string, unknown>;

  const { data: expRaw } = await supabase
    .from('experiments')
    .select('experimenter_id')
    .eq('id', pm.experiment_id as string)
    .single();

  const exp = expRaw as Record<string, unknown> | null;
  if (!exp || (exp.experimenter_id as string) !== privyDid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!['submitted', 'pending', 'completed'].includes(pm.status as string)) {
    return NextResponse.json({ error: `Cannot reject milestone with status '${pm.status as string}'` }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('participant_milestones')
    .update({ status: 'rejected', rejection_reason: reason ?? null })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ milestone: updated });
}

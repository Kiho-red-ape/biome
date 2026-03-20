import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH /api/milestones/[id]/verify
// Body: { privyDid }
// Experimenter verifies a submitted milestone → status 'completed'
export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  // Fetch milestone + experiment (to validate experimenter ownership)
  const { data: pmRaw } = await supabase
    .from('participant_milestones')
    .select('id, status, experiment_id')
    .eq('id', id)
    .single();

  if (!pmRaw) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

  const pm = pmRaw as Record<string, unknown>;

  // Validate experimenter owns the experiment
  const { data: expRaw } = await supabase
    .from('experiments')
    .select('experimenter_id')
    .eq('id', pm.experiment_id as string)
    .single();

  const exp = expRaw as Record<string, unknown> | null;
  if (!exp || (exp.experimenter_id as string) !== privyDid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!['submitted', 'pending'].includes(pm.status as string)) {
    return NextResponse.json({ error: `Cannot verify milestone with status '${pm.status as string}'` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from('participant_milestones')
    .update({ status: 'completed', completed_at: now, verified_at: now, verified_by: privyDid })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ milestone: updated });
}

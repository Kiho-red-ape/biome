import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

// POST /api/milestones/[id]/submit
// Body: { privyDid }
// Marks a self_report participant_milestone as completed
export async function POST(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json() as { privyDid?: string };
  const { privyDid } = body;

  if (!privyDid) {
    return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch milestone + study milestone metadata
  const { data: pm } = await supabase
    .from('participant_milestones')
    .select('id, participant_id, status, study_milestones(milestone_type)')
    .eq('id', id)
    .single();

  if (!pm) return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });

  const p = pm as Record<string, unknown>;
  if ((p.participant_id as string) !== privyDid) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const sm = p.study_milestones as { milestone_type?: string } | null;
  if (sm?.milestone_type !== 'self_report') {
    return NextResponse.json({ error: 'Only self-report milestones can be submitted' }, { status: 400 });
  }

  if ((p.status as string) === 'completed') {
    return NextResponse.json({ error: 'Milestone already submitted' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from('participant_milestones')
    .update({ status: 'completed', completed_at: now, submitted_at: now })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ milestone: updated });
}

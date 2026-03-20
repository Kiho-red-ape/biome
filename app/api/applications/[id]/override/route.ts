import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

// PATCH /api/applications/[id]/override
// Body: { privyDid, reason }
// Experimenter overrides the compliance gate for a participant,
// manually marking them as payout-eligible regardless of score
export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json() as { privyDid?: string; reason?: string };
  const { privyDid, reason } = body;
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });
  if (!reason?.trim()) return NextResponse.json({ error: 'reason required' }, { status: 400 });

  const supabase = createServiceClient();

  const { data: appRaw } = await supabase
    .from('applications')
    .select('id, experiment_id')
    .eq('id', id)
    .single();

  if (!appRaw) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  const app = appRaw as Record<string, unknown>;

  const { data: expRaw } = await supabase
    .from('experiments')
    .select('experimenter_id')
    .eq('id', app.experiment_id as string)
    .single();

  const exp = expRaw as Record<string, unknown> | null;
  if (!exp || (exp.experimenter_id as string) !== privyDid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from('applications')
    .update({ override_requested: true, override_reason: reason.trim() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: updated });
}

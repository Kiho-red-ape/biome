import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/experiments/[id]
export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ experiment: data });
}

// PATCH /api/experiments/[id]
// action: 'publish'   — move draft → recruiting
// action: 'commence'  — move recruiting/active → active, generate milestones, notify enrolled participants
export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json() as { privyDid?: string; action?: string };
  const { privyDid, action } = body;

  if (!privyDid || !['publish', 'commence'].includes(action ?? '')) {
    return NextResponse.json({ error: 'Missing privyDid or invalid action' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: exp } = await supabase
    .from('experiments')
    .select('id, status, experimenter_id, commenced, title')
    .eq('id', id)
    .single();

  if (!exp) return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
  if (exp.experimenter_id !== privyDid) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  // ── Publish ────────────────────────────────────────────────────────────────
  if (action === 'publish') {
    if (exp.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft experiments can be published' }, { status: 400 });
    }
    const { data: updated, error: updateErr } = await supabase
      .from('experiments')
      .update({ status: 'recruiting' })
      .eq('id', id)
      .select()
      .single();
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    return NextResponse.json({ experiment: updated });
  }

  // ── Commence ───────────────────────────────────────────────────────────────
  if (action === 'commence') {
    if (exp.commenced) {
      return NextResponse.json({ error: 'Study already commenced' }, { status: 400 });
    }
    if (!['recruiting', 'active'].includes(exp.status)) {
      return NextResponse.json({ error: 'Study must be recruiting or active to commence' }, { status: 400 });
    }

    // Setting commenced = true triggers:
    //   1. BEFORE trigger sets commenced_at + status = 'active'
    //   2. AFTER trigger generates milestones for all enrolled participants + notifies them
    const { data: updated, error: updateErr } = await supabase
      .from('experiments')
      .update({ commenced: true })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    return NextResponse.json({ experiment: updated, commenced: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// PUT /api/experiments/[id] — edit experiment fields + log amendments
export async function PUT(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const body = await req.json() as Record<string, unknown>;
  const { privyDid, ...fields } = body as { privyDid?: string; [k: string]: unknown };

  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();

  // Fetch current experiment
  const { data: current } = await supabase
    .from('experiments')
    .select('*, amendment_log, launch_date')
    .eq('id', id)
    .single();

  if (!current) return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
  if (current.experimenter_id !== privyDid) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  if (current.status === 'completed' || current.status === 'cancelled') {
    return NextResponse.json({ error: 'Cannot edit a completed experiment' }, { status: 400 });
  }

  // Enforce 7-day edit lock if launch_date is set
  if (current.launch_date) {
    const daysToLaunch = Math.ceil(
      (new Date(current.launch_date).getTime() - Date.now()) / 86_400_000
    );
    if (daysToLaunch <= 7 && daysToLaunch >= 0) {
      return NextResponse.json(
        { error: `Editing locked — study launches in ${daysToLaunch} day${daysToLaunch !== 1 ? 's' : ''}` },
        { status: 400 }
      );
    }
  }

  // Build amendment log entries for changed fields
  const EDITABLE = [
    'title', 'description', 'category', 'bounty_per_participant', 'slots_total',
    'duration_weeks', 'region', 'is_remote', 'inclusion_criteria', 'exclusion_criteria',
    'launch_date',
  ] as const;

  type EditableField = typeof EDITABLE[number];

  const amendments: { ts: string; field: string; old_value: string; new_value: string; edited_by: string }[] = [];
  const updates: Record<string, unknown> = {};

  for (const field of EDITABLE) {
    if (!(field in fields)) continue;
    const newVal = fields[field];
    const oldVal = (current as Record<string, unknown>)[field];
    if (String(newVal ?? '') !== String(oldVal ?? '')) {
      amendments.push({
        ts:        new Date().toISOString(),
        field:     field as string,
        old_value: String(oldVal ?? ''),
        new_value: String(newVal ?? ''),
        edited_by: privyDid,
      });
      updates[field] = newVal;
    }
  }

  // Recalculate total_bounty_pool if relevant fields changed
  const newBounty = (updates.bounty_per_participant ?? current.bounty_per_participant) as number;
  const newSlots  = (updates.slots_total ?? current.slots_total) as number;
  updates.total_bounty_pool = newBounty * newSlots;

  if (amendments.length === 0) {
    return NextResponse.json({ experiment: current, amended: false });
  }

  const existingLog = (current.amendment_log ?? []) as typeof amendments;
  updates.amendment_log = [...existingLog, ...amendments];

  const { data: updated, error } = await supabase
    .from('experiments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ experiment: updated, amended: true, amendments });
}

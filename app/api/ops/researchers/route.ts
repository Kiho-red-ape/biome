import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/ops/researchers — list all experimenter profiles
export async function GET(_req: NextRequest) {
  const db = createServiceClient();

  const { data, error } = await db
    .from('experimenter_profiles')
    .select('id, user_id, org_name, org_website, org_description, role_title, expertise_areas, review_status, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ researchers: data ?? [] });
}

// PATCH /api/ops/researchers — approve or reject an experimenter
export async function PATCH(req: NextRequest) {
  const body = await req.json() as { userId?: string; review_status?: string };
  const { userId, review_status } = body;

  if (!userId || !review_status) {
    return NextResponse.json({ error: 'userId and review_status required' }, { status: 400 });
  }

  if (!['active', 'rejected', 'pending_review'].includes(review_status)) {
    return NextResponse.json({ error: 'Invalid review_status' }, { status: 400 });
  }

  const db = createServiceClient();

  // Keep review_status (ops UI) and screening_status (post-study gate) in sync.
  const screening_status =
    review_status === 'active' ? 'approved'
    : review_status === 'rejected' ? 'rejected'
    : 'pending';

  const { error } = await db
    .from('experimenter_profiles')
    .update({ review_status, screening_status, screened_at: new Date().toISOString(), screened_by: 'Ops' })
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/ops/researchers — remove an org entirely (test/stale accounts).
// Refuses while the org has live studies; deletes draft/cancelled studies,
// team memberships, and the org profile. The base user account is kept.
export async function DELETE(req: NextRequest) {
  const body = await req.json() as { userId?: string };
  if (!body.userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const db = createServiceClient();

  const { data: org } = await db
    .from('experimenter_profiles').select('id').eq('user_id', body.userId).maybeSingle();
  if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 });
  const orgId = (org as { id: string }).id;

  const { data: exps } = await db
    .from('experiments').select('id, status').eq('experimenter_id', body.userId);
  const rows = (exps ?? []) as { id: string; status: string }[];
  // Live studies block removal; completed ones carry payout history — never delete.
  const blocking = rows.filter((e) => ['recruiting', 'active', 'completed'].includes(e.status));
  if (blocking.length > 0) {
    return NextResponse.json(
      { error: `Org has ${blocking.length} live or completed stud${blocking.length === 1 ? 'y' : 'ies'} — cannot remove` },
      { status: 409 },
    );
  }

  // Only draft/cancelled test studies are removed (children cascade via FKs).
  const removable = rows.map((e) => e.id);
  if (removable.length > 0) await db.from('experiments').delete().in('id', removable);
  await db.from('org_members').delete().eq('org_id', orgId);
  const { error } = await db.from('experimenter_profiles').delete().eq('id', orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, removedStudies: removable.length });
}

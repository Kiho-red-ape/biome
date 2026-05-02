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

  const { error } = await db
    .from('experimenter_profiles')
    .update({ review_status })
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

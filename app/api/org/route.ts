// GET /api/org?privyDid=  → the caller's org, their role, and the team roster.

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { resolveOrgForUser } from '@/lib/org/resolve';

export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const db = createServiceClient();
  const resolved = await resolveOrgForUser(db, privyDid);
  if (!resolved) return NextResponse.json({ org: null });

  const [{ data: org }, { data: members }, { count: studyCount }] = await Promise.all([
    // select('*'): drift-proof — a missing optional column must not kill the read.
    db.from('experimenter_profiles')
      .select('*')
      .eq('id', resolved.orgId).maybeSingle(),
    db.from('org_members')
      .select('id, email, role, status, user_id, invited_at, accepted_at')
      .eq('org_id', resolved.orgId)
      .order('created_at', { ascending: true }),
    db.from('experiments')
      .select('id', { count: 'exact', head: true })
      .eq('experimenter_id', resolved.ownerId),
  ]);

  const o = org as Record<string, unknown> | null;

  return NextResponse.json({
    org: o ? {
      id:              o.id,
      orgName:         o.org_name,
      website:         o.org_website,
      description:     o.org_description,
      screeningStatus: o.screening_status,
      reviewStatus:    o.review_status,
      studyCount:      studyCount ?? 0,
    } : null,
    callerRole: resolved.role,
    isAdmin:    resolved.isAdmin,
    members:    (members ?? []).map((m) => ({
      id: m.id, email: m.email, role: m.role, status: m.status,
      pending: !m.user_id, invitedAt: m.invited_at, acceptedAt: m.accepted_at,
    })),
  });
}

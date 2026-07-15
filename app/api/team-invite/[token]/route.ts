// GET  /api/team-invite/[token]  → invite info for the accept page
// POST /api/team-invite/[token]  { privyDid } → accept and join the org

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

async function loadInvite(db: ReturnType<typeof createServiceClient>, token: string) {
  const { data } = await db
    .from('org_members')
    .select('id, org_id, email, role, status')
    .eq('invite_token', token)
    .maybeSingle();
  return data as { id: string; org_id: string; email: string; role: string; status: string } | null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = createServiceClient();
  const inv = await loadInvite(db, token);
  if (!inv) return NextResponse.json({ valid: false, reason: 'not_found' });
  if (inv.status !== 'invited') return NextResponse.json({ valid: false, reason: inv.status });

  const { data: org } = await db
    .from('experimenter_profiles').select('org_name').eq('id', inv.org_id).maybeSingle();

  return NextResponse.json({
    valid: true,
    email:   inv.email,
    role:    inv.role,
    orgName: (org as { org_name: string } | null)?.org_name ?? 'a BIOME organization',
  });
}

const schema = z.object({ privyDid: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'privyDid required' }, { status: 400 }); }

  const db = createServiceClient();
  const inv = await loadInvite(db, token);
  if (!inv) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  if (inv.status !== 'invited') return NextResponse.json({ error: 'Invitation no longer active' }, { status: 409 });

  await db.from('org_members')
    .update({ user_id: body.privyDid, status: 'active', accepted_at: new Date().toISOString() })
    .eq('id', inv.id);

  return NextResponse.json({ ok: true, orgId: inv.org_id });
}

// POST  /api/org/members  { privyDid, email, role }            → invite a teammate (admin only)
// PATCH /api/org/members  { privyDid, memberId, role?, remove? } → change role / remove (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';
import { resolveOrgForUser } from '@/lib/org/resolve';
import { generateToken } from '@/lib/org/invites';
import { sendEmail } from '@/lib/email';

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://biome.to';
const ROLES = ['clinical_operator', 'researcher', 'sponsor'] as const;

const postSchema = z.object({
  privyDid: z.string().min(1),
  email:    z.string().email(),
  role:     z.enum(ROLES),
});

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof postSchema>;
  try { parsed = postSchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'email and a valid role are required' }, { status: 400 }); }

  const db = createServiceClient();
  const org = await resolveOrgForUser(db, parsed.privyDid);
  if (!org || !org.isAdmin) return NextResponse.json({ error: 'Only the org admin can invite teammates' }, { status: 403 });

  const token = generateToken();
  const { error } = await db.from('org_members').upsert({
    org_id:       org.orgId,
    email:        parsed.email.toLowerCase(),
    role:         parsed.role,
    status:       'invited',
    invite_token: token,
    invited_by:   parsed.privyDid,
    invited_at:   new Date().toISOString(),
  }, { onConflict: 'org_id,email' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: orgRow } = await db
    .from('experimenter_profiles').select('org_name').eq('id', org.orgId).maybeSingle();
  const orgName = (orgRow as { org_name: string } | null)?.org_name ?? 'a BIOME organization';
  const link = `${SITE}/team-invite/${token}`;
  const roleLabel = parsed.role.replace('_', ' ');

  await sendEmail(
    parsed.email.toLowerCase(),
    `You've been added to ${orgName} on BIOME`,
    `You've been invited to join ${orgName} on BIOME as ${roleLabel}.\n\nAccept your invitation:\n${link}\n\n— The BIOME team\nhello@biome.to`,
  );

  return NextResponse.json({ ok: true, link });
}

const patchSchema = z.object({
  privyDid: z.string().min(1),
  memberId: z.string().uuid(),
  role:     z.enum(['admin', ...ROLES]).optional(),
  remove:   z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  let parsed: z.infer<typeof patchSchema>;
  try { parsed = patchSchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'memberId required' }, { status: 400 }); }

  const db = createServiceClient();
  const org = await resolveOrgForUser(db, parsed.privyDid);
  if (!org || !org.isAdmin) return NextResponse.json({ error: 'Only the org admin can manage the team' }, { status: 403 });

  // Scope the update to this org's members only.
  const { data: member } = await db
    .from('org_members').select('id, org_id, role').eq('id', parsed.memberId).maybeSingle();
  const m = member as { id: string; org_id: string; role: string } | null;
  if (!m || m.org_id !== org.orgId) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  if (m.role === 'admin') return NextResponse.json({ error: 'Cannot modify the founding admin' }, { status: 400 });

  if (parsed.remove) {
    await db.from('org_members').update({ status: 'removed' }).eq('id', m.id);
  } else if (parsed.role) {
    await db.from('org_members').update({ role: parsed.role }).eq('id', m.id);
  }

  return NextResponse.json({ ok: true });
}

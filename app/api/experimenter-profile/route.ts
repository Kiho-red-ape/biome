import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { ensureAdminMember } from '@/lib/org/invites';
import type { ExperimenterProfile } from '@/lib/types';
import { z } from 'zod';

const createSchema = z.object({
  privyDid:         z.string().min(1),
  org_name:         z.string().min(1).max(120),
  org_website:      z.string().url().nullable().optional(),
  org_description:  z.string().max(1000).nullable().optional(),
  role_title:       z.string().max(100).nullable().optional(),
  expertise_areas:  z.array(z.string()).nullable().optional(),
  // When present, this onboarding fulfils an ops → researcher invite: the org
  // is auto-approved (ops already vetted the lead) and linked to the intake.
  inviteToken:      z.string().min(8).nullable().optional(),
});

// GET /api/experimenter-profile?privyDid=...
export async function GET(request: NextRequest) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('experimenter_profiles')
    .select('id, user_id, org_name, org_website, org_description, role_title, expertise_areas, screening_status, screened_at, screened_by, experiments_posted, verified_experiments, free_study_used, created_at, updated_at')
    .eq('user_id', privyDid)
    .single();

  if (error && error.code === 'PGRST116') return NextResponse.json({ profile: null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data as ExperimenterProfile });
}

// POST /api/experimenter-profile — create experimenter profile
export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { privyDid, org_name, org_website, org_description, role_title, expertise_areas, inviteToken } = parsed.data;
  const supabase = createServiceClient();

  // Validate an ops invite, if supplied.
  let invite: { id: string; intake_id: string | null; email: string | null } | null = null;
  if (inviteToken) {
    const { data: inv } = await supabase
      .from('org_invites')
      .select('id, intake_id, email, status, expires_at')
      .eq('invite_token', inviteToken)
      .maybeSingle();
    const row = inv as { id: string; intake_id: string | null; email: string | null; status: string; expires_at: string | null } | null;
    const expired = row?.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
    if (row && row.status === 'sent' && !expired) invite = { id: row.id, intake_id: row.intake_id, email: row.email };
  }

  // Existing base profile + org (if any).
  const { data: existingProfile } = await supabase.from('profiles').select('id, email').eq('id', privyDid).maybeSingle();
  const { data: existingOrg } = await supabase.from('experimenter_profiles').select('id').eq('user_id', privyDid).maybeSingle();

  // Organization access is INVITATION-ONLY: creating a new org requires a valid
  // ops invite. (Existing orgs may keep editing their own profile.)
  if (!existingOrg && !invite) {
    return NextResponse.json(
      { error: 'Organization access on BIOME is by invitation only. Ask our team for an invite link.' },
      { status: 403 },
    );
  }

  // Invited users arrive straight from the link with no base profile — create one.
  let profileEmail = (existingProfile as { email?: string | null } | null)?.email ?? null;
  if (!existingProfile) {
    profileEmail = invite?.email ?? null;
    const { error: pErr } = await supabase.from('profiles').insert({
      id: privyDid, auth_type: 'email', role: 'experimenter', email: profileEmail,
    });
    if (pErr) return NextResponse.json({ error: `profile: ${pErr.message}` }, { status: 500 });
  }

  // Upsert the org — the invite only gates WHO can fill this form (and prefills/
  // links it); ops still reviews + approves the submitted org.
  const { data, error } = await supabase
    .from('experimenter_profiles')
    .upsert(
      {
        user_id:         privyDid,
        org_name,
        org_website:     org_website ?? null,
        org_description: org_description ?? null,
        role_title:      role_title ?? null,
        expertise_areas: expertise_areas ?? null,
        review_status:   'pending_review',
        screening_status: 'pending',
      },
      { onConflict: 'user_id' }
    )
    .select('id, user_id, org_name, review_status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orgId = (data as { id: string }).id;

  // Founding user becomes the org admin.
  await ensureAdminMember(orgId, privyDid, profileEmail ?? `${privyDid}@biome.local`, supabase)
    .catch((e) => console.error('[experimenter-profile] admin member', e));

  // Fulfil the invite: mark accepted, link org, convert the intake.
  if (invite) {
    const now = new Date().toISOString();
    await supabase.from('org_invites')
      .update({ status: 'accepted', accepted_at: now, created_org_id: orgId })
      .eq('id', invite.id);
    if (invite.intake_id) {
      await supabase.from('client_intakes')
        .update({ triage_status: 'converted', triaged_at: now, converted_profile_id: privyDid })
        .eq('id', invite.intake_id);
    }
  }

  sendEmail(
    'kishore@biome.to',
    `New researcher application — ${org_name}`,
    `Organization: ${org_name}\n` +
    `Website: ${org_website ?? '—'}\n` +
    `Role: ${role_title ?? '—'}\n` +
    `Expertise: ${(expertise_areas ?? []).join(', ') || '—'}\n\n` +
    `Description:\n${org_description ?? '—'}\n\n` +
    `Review at: https://biome.to/ops/researchers`,
  ).catch((err: unknown) => console.error('[experimenter-profile] notification email failed:', err));

  return NextResponse.json({ profile: data as unknown as ExperimenterProfile }, { status: 201 });
}

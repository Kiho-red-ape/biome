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

  // Verify profiles row exists
  const { data: profile } = await supabase.from('profiles').select('id, email').eq('id', privyDid).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found. Complete basic onboarding first.' }, { status: 404 });

  // Validate an ops invite, if supplied → org is pre-approved + active.
  let invite: { id: string; intake_id: string | null } | null = null;
  if (inviteToken) {
    const { data: inv } = await supabase
      .from('org_invites')
      .select('id, intake_id, status, expires_at')
      .eq('invite_token', inviteToken)
      .maybeSingle();
    const row = inv as { id: string; intake_id: string | null; status: string; expires_at: string | null } | null;
    const expired = row?.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
    if (row && row.status === 'sent' && !expired) invite = { id: row.id, intake_id: row.intake_id };
  }

  const invited = !!invite;

  // Upsert — update if already exists
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
        // Invited researchers are already vetted in the pipeline → approve + activate.
        review_status:    invited ? 'active' : 'pending_review',
        screening_status: invited ? 'approved' : 'pending',
        ...(invited ? { screened_at: new Date().toISOString(), screened_by: 'Ops invite' } : {}),
      },
      { onConflict: 'user_id' }
    )
    .select('id, user_id, org_name, review_status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orgId = (data as { id: string }).id;

  // Founding user becomes the org admin.
  await ensureAdminMember(orgId, privyDid, (profile as { email?: string }).email ?? `${privyDid}@biome.local`, supabase)
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

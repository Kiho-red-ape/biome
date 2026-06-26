// POST /api/ops/intakes/activate
// Converts a qualified client-intake lead into a draft study + a new client
// experimenter profile, then links the intake to both. Idempotent: if the
// intake was already activated, returns the existing study without duplicating.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  intakeId:        z.string().uuid(),
  operatorPrivyDid: z.string().min(1),
});

// Best-effort map of free-text intake study_type → a known experiment category.
const CATEGORY_MAP: Record<string, string> = {
  supplement:           'Nutrition',
  supplement_novel:     'Nutrition',
  supplement_existing:  'Nutrition',
  nutrition:            'Nutrition',
  microbiome:           'Microbiome',
  sleep:                'Sleep',
  psychedelics:         'Psychedelics',
  fitness:              'Fitness',
  longevity:            'Longevity',
  cognitive:            'Cognitive',
  mental_health:        'Mental Health',
  digital_intervention: 'Behavioral',
  lifestyle_behavioral: 'Behavioral',
  biomarker_wearable:   'Wearables',
  wearable:             'Wearables',
};

function mapCategory(studyType: string | null): string {
  if (!studyType) return 'Other';
  return CATEGORY_MAP[studyType.toLowerCase()] ?? 'Other';
}

// Pull a leading integer out of a free-text duration field ("8_12" → 8, "12 weeks" → 12).
function parseDurationWeeks(duration: string | null): number | null {
  if (!duration) return null;
  const m = duration.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

type IntakeRow = {
  id: string;
  name: string | null;
  organization: string | null;
  email: string | null;
  website: string | null;
  study_title: string | null;
  study_type: string | null;
  description: string | null;
  target_participants: number | null;
  duration: string | null;
  geography: string[] | null;
  converted_experiment_id: string | null;
  converted_profile_id: string | null;
};

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'intakeId and operatorPrivyDid required' }, { status: 400 });
  }

  const { intakeId, operatorPrivyDid } = parsed;
  const db = createServiceClient();

  // ── Load intake ──────────────────────────────────────────────────────────────
  const { data: intakeRaw, error: intakeErr } = await db
    .from('client_intakes')
    .select('id, name, organization, email, website, study_title, study_type, ' +
            'description, target_participants, duration, geography, ' +
            'converted_experiment_id, converted_profile_id')
    .eq('id', intakeId)
    .maybeSingle();

  if (intakeErr) return NextResponse.json({ error: intakeErr.message }, { status: 500 });
  if (!intakeRaw) return NextResponse.json({ error: 'Intake not found' }, { status: 404 });

  const intake = intakeRaw as unknown as IntakeRow;

  // Idempotent: already activated → return the existing study.
  if (intake.converted_experiment_id) {
    return NextResponse.json({
      experimentId: intake.converted_experiment_id,
      profileId:    intake.converted_profile_id,
      alreadyActive: true,
    });
  }

  // ── 1. Client profile (deterministic id so re-runs don't duplicate) ──────────
  const clientProfileId = `client:${intake.id}`;
  const orgName = intake.organization?.trim() || intake.name?.trim() || 'New Client';

  const { error: profileErr } = await db
    .from('profiles')
    .upsert({
      id:           clientProfileId,
      auth_type:    'email',
      role:         'experimenter',
      display_name: orgName,
      email:        intake.email ?? null,
    }, { onConflict: 'id' });

  if (profileErr) return NextResponse.json({ error: `profile: ${profileErr.message}` }, { status: 500 });

  // ── 2. Experimenter profile (pre-approved — ops vetted the lead) ─────────────
  const { error: epErr } = await db
    .from('experimenter_profiles')
    .upsert({
      user_id:          clientProfileId,
      org_name:         orgName,
      org_website:      intake.website ?? null,
      org_description:  intake.description ?? null,
      screening_status: 'approved',
      review_status:    'active',
      screened_at:      new Date().toISOString(),
      screened_by:      'Operator (intake activation)',
    }, { onConflict: 'user_id' });

  if (epErr) return NextResponse.json({ error: `experimenter: ${epErr.message}` }, { status: 500 });

  // ── 3. Draft experiment pre-filled from intake ───────────────────────────────
  const { data: expRaw, error: expErr } = await db
    .from('experiments')
    .insert({
      experimenter_id:        clientProfileId,
      title:                  intake.study_title?.trim() || `${orgName} study`,
      description:            intake.description?.trim() || 'Draft created from client intake — details pending.',
      category:               mapCategory(intake.study_type),
      status:                 'draft',
      bounty_per_participant: 0,
      total_bounty_pool:      0,
      slots_total:            intake.target_participants ?? 0,
      slots_filled:           0,
      duration_weeks:         parseDurationWeeks(intake.duration),
      region:                 intake.geography?.[0] ?? null,
      is_remote:              true,
      is_verified:            false,
      verification_level:     'none',
    })
    .select('id, experiment_code')
    .single();

  if (expErr) return NextResponse.json({ error: `experiment: ${expErr.message}` }, { status: 500 });

  const exp = expRaw as { id: string; experiment_code: string | null };

  // ── 4. Link intake + mark converted ──────────────────────────────────────────
  const now = new Date().toISOString();
  const { error: linkErr } = await db
    .from('client_intakes')
    .update({
      triage_status:           'converted',
      triaged_at:              now,
      converted_experiment_id: exp.id,
      converted_profile_id:    clientProfileId,
      activated_at:            now,
      activated_by:            operatorPrivyDid,
    })
    .eq('id', intake.id);

  if (linkErr) return NextResponse.json({ error: `link: ${linkErr.message}` }, { status: 500 });

  return NextResponse.json({
    experimentId:   exp.id,
    experimentCode: exp.experiment_code,
    profileId:      clientProfileId,
    alreadyActive:  false,
  }, { status: 201 });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { Experiment } from '@/lib/types';
import { z } from 'zod';

const milestoneSchema = z.object({
  week_number:  z.number().int().positive(),
  title:        z.string().min(1).max(200),
  description:  z.string().max(500).optional(),
  type:         z.enum(['self_report', 'experimenter_confirm']),
  sort_order:   z.number().int().default(0),
});

const createSchema = z.object({
  privyDid:               z.string().min(1),
  title:                  z.string().min(3).max(200),
  description:            z.string().min(10),
  category:               z.enum(['Microbiome','Nutrition','Sleep','Psychedelics','Fitness','Longevity','Mental Health','Metabolomics','Cognitive','Wearables','Behavioral','Quantified Self','Other']),
  study_type:             z.string().optional(),
  bounty_per_participant: z.number().positive(),
  slots_total:            z.number().int().positive(),
  duration_weeks:         z.number().int().positive().nullable().optional(),
  region:                 z.string().nullable().optional(),
  is_remote:              z.boolean().default(true),
  inclusion_criteria:     z.string().nullable().optional(),
  exclusion_criteria:     z.string().nullable().optional(),
  tests_needed:           z.string().nullable().optional(),
  iec_approval:           z.string().nullable().optional(),
  external_comms_url:     z.string().url().nullable().optional(),
  short_description:      z.string().max(300).nullable().optional(),
  apply_for_verification: z.boolean().default(false),
  // New fields
  milestones:             z.array(milestoneSchema).optional(),
  compliance_threshold:   z.number().min(0).max(100).default(80),
  enrollment_url:         z.string().url().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { privyDid, apply_for_verification, milestones, compliance_threshold, enrollment_url, ...fields } = parsed.data;
  const supabase = createServiceClient();

  // Verify the experimenter has an approved profile
  const { data: ep } = await supabase
    .from('experimenter_profiles')
    .select('id, screening_status')
    .eq('user_id', privyDid)
    .single();

  if (!ep || ep.screening_status !== 'approved') {
    return NextResponse.json(
      { error: 'Your organization profile must be approved before posting experiments.' },
      { status: 403 }
    );
  }

  const totalPool = fields.bounty_per_participant * fields.slots_total;

  const { data, error } = await supabase
    .from('experiments')
    .insert({
      experimenter_id:        privyDid,
      title:                  fields.title,
      description:            fields.description,
      short_description:      fields.short_description ?? null,
      category:               fields.category,
      status:                 'draft',
      bounty_per_participant: fields.bounty_per_participant,
      total_bounty_pool:      totalPool,
      slots_total:            fields.slots_total,
      slots_filled:           0,
      duration_weeks:         fields.duration_weeks ?? null,
      region:                 fields.region ?? null,
      is_remote:              fields.is_remote,
      is_verified:            false,
      verification_level:     apply_for_verification ? 'biome' : 'none',
      tests_needed:           fields.tests_needed ?? null,
      inclusion_criteria:     fields.inclusion_criteria ?? null,
      exclusion_criteria:     fields.exclusion_criteria ?? null,
      iec_approval:           fields.iec_approval ?? null,
      external_comms_url:     fields.external_comms_url ?? null,
      enrollment_url:         enrollment_url ?? null,
      compliance_threshold:   compliance_threshold ?? 80,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert study milestones if provided
  if (milestones && milestones.length > 0 && data) {
    const milestoneRows = milestones.map((m, i) => ({
      experiment_id:  (data as { id: string }).id,
      title:          m.title,
      description:    m.description ?? null,
      week_number:    m.week_number,
      milestone_type: m.type,
      sort_order:     m.sort_order ?? i,
    }));

    await supabase.from('study_milestones').insert(milestoneRows);
    // Non-fatal: form submission succeeds even if milestone insert fails
  }

  // Increment experiments_posted on experimenter profile
  await supabase.rpc('increment_experiments_posted' as string, { p_user_id: privyDid }).then(() => {}, () => {});

  return NextResponse.json({ experiment: data as Experiment }, { status: 201 });
}

// POST /api/ops/estimate-leads/to-pipeline  { id, operatorPrivyDid }
// Promote an estimate lead into the client-intake pipeline so it can be triaged
// and invited. Idempotent: returns the existing intake if already promoted.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient } from '@/lib/supabase/server';

const schema = z.object({ id: z.string().uuid(), operatorPrivyDid: z.string().min(1) });

const STUDY_TYPE_LABEL: Record<string, string> = {
  supplement_novel: 'Supplement (Novel)', supplement_existing: 'Supplement (Existing)',
  digital_intervention: 'Digital Intervention', biomarker_wearable: 'Biomarker / Wearable',
  lifestyle_behavioral: 'Lifestyle & Behavioral', microbiome: 'Microbiome', cognitive: 'Cognitive',
};
function studyTitle(t: string | null): string {
  if (!t) return 'Study (from estimate)';
  return `${STUDY_TYPE_LABEL[t] ?? t.replace(/_/g, ' ')} study`;
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof schema>;
  try { body = schema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'id and operatorPrivyDid required' }, { status: 400 }); }

  const db = createServiceClient();

  const { data: leadRaw, error: leadErr } = await db
    .from('estimate_leads')
    .select('id, email, organization, study_type, participants, duration, geography, samples, irb_status, estimated_total, converted_intake_id')
    .eq('id', body.id)
    .maybeSingle();
  if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 });
  if (!leadRaw) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  const lead = leadRaw as {
    id: string; email: string; organization: string | null; study_type: string | null;
    participants: number | null; duration: string | null; geography: string[] | null;
    samples: string[] | null; irb_status: string | null; estimated_total: number | null;
    converted_intake_id: string | null;
  };

  if (lead.converted_intake_id) {
    return NextResponse.json({ intakeId: lead.converted_intake_id, alreadyInPipeline: true });
  }

  const orgLabel = lead.organization?.trim() || lead.email;
  const { data: intake, error: insErr } = await db
    .from('client_intakes')
    .insert({
      name:                orgLabel,
      organization:        orgLabel,
      email:               lead.email,
      study_title:         studyTitle(lead.study_type),
      study_type:          lead.study_type,
      target_participants: lead.participants,
      duration:            lead.duration,
      geography:           lead.geography ?? [],
      sample_types:        lead.samples ?? [],
      irb_status:          lead.irb_status,
      budget_range:        lead.estimated_total != null ? `~$${lead.estimated_total.toLocaleString()}` : null,
      referral_source:     'estimate_lead',
      triage_status:       'reviewing',
    })
    .select('id')
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const intakeId = (intake as { id: string }).id;
  await db.from('estimate_leads')
    .update({ converted_intake_id: intakeId, contacted: true, contacted_at: new Date().toISOString() })
    .eq('id', lead.id);

  return NextResponse.json({ intakeId });
}

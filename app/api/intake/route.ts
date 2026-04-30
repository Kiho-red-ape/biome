import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    const { name, organization, email, study_title } = body;
    if (!name || !organization || !email || !study_title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase.from('client_intakes').insert({
      name:                String(name),
      organization:        String(organization),
      email:               String(email),
      website:             body.website ? String(body.website) : null,
      study_title:         String(study_title),
      study_type:          body.study_type ? String(body.study_type) : null,
      description:         body.description ? String(body.description) : null,
      target_participants: body.target_participants ? Number(body.target_participants) : null,
      duration:            body.duration ? String(body.duration) : null,
      geography:           Array.isArray(body.geography) ? body.geography : [],
      sample_types:        Array.isArray(body.sample_types) ? body.sample_types : [],
      irb_status:          body.irb_status ? String(body.irb_status) : null,
      budget_range:        body.budget_range ? String(body.budget_range) : null,
      referral_source:     body.referral_source ? String(body.referral_source) : null,
      additional_notes:    body.additional_notes ? String(body.additional_notes) : null,
    });

    if (error) {
      console.error('intake insert error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('intake route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

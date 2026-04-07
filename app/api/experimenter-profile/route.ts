import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { ExperimenterProfile } from '@/lib/types';
import { z } from 'zod';

const createSchema = z.object({
  privyDid:         z.string().min(1),
  org_name:         z.string().min(1).max(120),
  org_website:      z.string().url().nullable().optional(),
  org_description:  z.string().max(1000).nullable().optional(),
  role_title:       z.string().max(100).nullable().optional(),
  expertise_areas:  z.array(z.string()).nullable().optional(),
});

// GET /api/experimenter-profile?privyDid=...
export async function GET(request: NextRequest) {
  const privyDid = request.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('experimenter_profiles')
    .select('id, user_id, org_name, org_website, org_description, role_title, expertise_areas, screening_status, screened_at, screened_by, experiments_posted, verified_experiments, created_at, updated_at')
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

  const { privyDid, org_name, org_website, org_description, role_title, expertise_areas } = parsed.data;
  const supabase = createServiceClient();

  // Verify profiles row exists
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', privyDid).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found. Complete basic onboarding first.' }, { status: 404 });

  // Upsert — update if already exists
  const { data, error } = await supabase
    .from('experimenter_profiles')
    .upsert(
      {
        user_id: privyDid,
        org_name,
        org_website: org_website ?? null,
        org_description: org_description ?? null,
        role_title: role_title ?? null,
        expertise_areas: expertise_areas ?? null,
        // DEMO MODE: auto-approve. Remove this and implement manual review for production.
        screening_status: 'approved',
        screened_at: new Date().toISOString(),
        screened_by: 'auto',
      },
      { onConflict: 'user_id' }
    )
    .select('id, user_id, org_name, screening_status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: data as ExperimenterProfile }, { status: 201 });
}

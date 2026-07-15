import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export type FacilityMatch = {
  id: string;
  status: string;
  researcher_notes: string | null;
  created_at: string;
  facility: {
    id: string;
    name: string;
    facility_type: string;
    city: string | null;
    state: string | null;
    nabh_accredited: boolean | null;
    nabl_accredited: boolean | null;
    icmr_registered: boolean | null;
    ctri_site: boolean | null;
    abdm_registered: boolean | null;
    capabilities: string[] | null;
    contact_email: string | null;
    contact_name: string | null;
    website: string | null;
  } | null;
};

// Save a facility to a study
export async function POST(req: NextRequest) {
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json() as {
    experimentId: string;
    facilityId: string;
    sessionId?: string;
    notes?: string;
  };

  if (!body.experimentId || !body.facilityId) {
    return NextResponse.json({ error: 'experimentId and facilityId required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify the experiment belongs to this researcher
  const { data: exp } = await supabase
    .from('experiments')
    .select('id')
    .eq('id', body.experimentId)
    .eq('experimenter_id', privyDid)
    .single();

  if (!exp) {
    return NextResponse.json({ error: 'Experiment not found or not authorized' }, { status: 403 });
  }

  // Check if already saved
  const { data: existing } = await supabase
    .from('ome_facility_matches')
    .select('id')
    .eq('experiment_id', body.experimentId)
    .eq('facility_id', body.facilityId)
    .single();

  if (existing) {
    return NextResponse.json({ id: existing.id as string, alreadySaved: true });
  }

  const { data: match, error } = await supabase
    .from('ome_facility_matches')
    .insert({
      experiment_id:    body.experimentId,
      facility_id:      body.facilityId,
      session_id:       body.sessionId ?? null,
      researcher_notes: body.notes ?? null,
      status:           'suggested',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: (match as { id: string }).id });
}

// List saved facilities for a study
export async function GET(req: NextRequest) {
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const experimentId = req.nextUrl.searchParams.get('experimentId');
  if (!experimentId) return NextResponse.json({ error: 'experimentId required' }, { status: 400 });

  const supabase = createServiceClient();

  // Verify experiment belongs to this researcher
  const { data: exp } = await supabase
    .from('experiments')
    .select('id')
    .eq('id', experimentId)
    .eq('experimenter_id', privyDid)
    .single();

  if (!exp) {
    return NextResponse.json({ error: 'Experiment not found or not authorized' }, { status: 403 });
  }

  const { data: rows, error } = await supabase
    .from('ome_facility_matches')
    .select(`
      id, status, researcher_notes, created_at,
      india_health_facilities (
        id, name, facility_type, city, state,
        nabh_accredited, nabl_accredited, icmr_registered, ctri_site, abdm_registered,
        capabilities, contact_email, contact_name, website
      )
    `)
    .eq('experiment_id', experimentId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type RawRow = {
    id: string;
    status: string;
    researcher_notes: string | null;
    created_at: string;
    india_health_facilities: FacilityMatch['facility'];
  };

  const matches: FacilityMatch[] = ((rows ?? []) as unknown as RawRow[]).map((r) => ({
    id:               r.id,
    status:           r.status,
    researcher_notes: r.researcher_notes,
    created_at:       r.created_at,
    facility:         r.india_health_facilities,
  }));

  return NextResponse.json({ matches });
}

// Update match status
export async function PATCH(req: NextRequest) {
  const privyDid = req.headers.get('x-privy-did');
  if (!privyDid) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  const body = await req.json() as {
    matchId: string;
    status: string;
    notes?: string;
  };

  if (!body.matchId || !body.status) {
    return NextResponse.json({ error: 'matchId and status required' }, { status: 400 });
  }

  const VALID_STATUSES = ['suggested', 'contacted', 'declined', 'partnership_active'];
  if (!VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Verify the match belongs to an experiment owned by this researcher
  const { data: matchRow } = await supabase
    .from('ome_facility_matches')
    .select('id, experiment_id')
    .eq('id', body.matchId)
    .single();

  if (!matchRow) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const { data: exp } = await supabase
    .from('experiments')
    .select('id')
    .eq('id', (matchRow as { id: string; experiment_id: string }).experiment_id)
    .eq('experimenter_id', privyDid)
    .single();

  if (!exp) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const update: Record<string, string | null> = { status: body.status };
  if (body.status === 'contacted') update.contacted_at = new Date().toISOString();
  if (body.notes !== undefined) update.researcher_notes = body.notes;

  const { error } = await supabase
    .from('ome_facility_matches')
    .update(update)
    .eq('id', body.matchId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

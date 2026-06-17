import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export type Facility = {
  id: string;
  name: string;
  facility_type: string;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  region_tier: string | null;
  nabh_accredited: boolean | null;
  nabl_accredited: boolean | null;
  icmr_registered: boolean | null;
  ctri_site: boolean | null;
  abdm_registered: boolean | null;
  abha_enabled: boolean | null;
  capabilities: string[] | null;
  contact_name: string | null;
  contact_email: string | null;
  website: string | null;
  patient_volume_per_day: number | null;
  research_active: boolean | null;
  notes: string | null;
  data_source: string | null;
  latitude: number | null;
  longitude: number | null;
};

const SELECTED_COLUMNS = [
  'id', 'name', 'facility_type', 'city', 'district', 'state', 'pincode',
  'region_tier', 'nabh_accredited', 'nabl_accredited', 'icmr_registered',
  'ctri_site', 'abdm_registered', 'abha_enabled', 'capabilities',
  'contact_name', 'contact_email', 'website', 'patient_volume_per_day',
  'research_active', 'notes', 'data_source', 'latitude', 'longitude',
].join(', ');

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const search     = searchParams.get('search')?.trim() ?? '';
  const state      = searchParams.get('state')?.trim() ?? '';
  const type       = searchParams.get('type')?.trim() ?? '';
  const capability = searchParams.get('capability')?.trim() ?? '';
  const abdm       = searchParams.get('abdm') === 'true';
  const ctri       = searchParams.get('ctri') === 'true';
  const research   = searchParams.get('research') === 'true';

  const rawLimit  = parseInt(searchParams.get('limit') ?? '24', 10);
  const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10);
  const limit  = Math.min(isNaN(rawLimit)  ? 24 : rawLimit,  50);
  const offset = isNaN(rawOffset) ? 0 : rawOffset;

  const supabase = createServiceClient();

  let query = supabase
    .from('india_health_facilities')
    .select(SELECTED_COLUMNS, { count: 'exact' });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,city.ilike.%${search}%,state.ilike.%${search}%`
    );
  }
  if (state)      query = query.eq('state', state);
  if (type)       query = query.eq('facility_type', type);
  if (capability) query = query.contains('capabilities', [capability]);
  if (abdm)       query = query.eq('abdm_registered', true);
  if (ctri)       query = query.eq('ctri_site', true);
  if (research)   query = query.eq('research_active', true);

  query = query.order('name').range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[facilities] supabase error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    facilities: (data ?? []) as unknown as Facility[],
    total:  count ?? 0,
    offset,
    limit,
  });
}

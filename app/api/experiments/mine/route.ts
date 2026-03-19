import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/experiments/mine?privyDid=...
// Returns all experiments posted by the given experimenter.
export async function GET(req: NextRequest) {
  const privyDid = req.nextUrl.searchParams.get('privyDid');
  if (!privyDid) return NextResponse.json({ error: 'privyDid required' }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('experiments')
    .select('id, title, status, category, bounty_per_participant, total_bounty_pool, slots_total, slots_filled, duration_weeks, region, is_remote, is_verified, verification_level, launch_date, created_at, updated_at')
    .eq('experimenter_id', privyDid)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ experiments: data ?? [] });
}

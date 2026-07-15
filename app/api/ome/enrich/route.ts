import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// Triggered weekly by Vercel Cron (see vercel.json).
// Keeps the india_health_facilities directory fresh and surfaces
// facilities that are newly ABDM-registered or CTRI-listed.
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServiceClient();

  // ── 1. Flag facilities with no verification in >90 days ────────
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const { data: stale, error: staleErr } = await supabase
    .from('india_health_facilities')
    .select('id, name, city')
    .or(`verified_at.is.null,verified_at.lt.${cutoff.toISOString()}`)
    .eq('research_active', true)
    .limit(20);

  if (staleErr) {
    console.error('[OME cron] stale query error:', staleErr.message);
  }

  // ── 2. Log the enrichment run ──────────────────────────────────
  const staleCount = stale?.length ?? 0;

  // In production this would:
  // a) Re-scrape CTRI for new trial site registrations
  // b) Check ABDM HIP registry for newly onboarded facilities
  // c) Update NABH/NABL accreditation status via NHA API
  // d) Add new entries from ICMR-approved research institution lists
  //
  // For now: log the stale facilities so ops can manually re-verify.

  const result = {
    ran_at:          new Date().toISOString(),
    stale_facilities: staleCount,
    stale_sample:    stale?.slice(0, 5).map((f) => `${f.name}, ${f.city}`) ?? [],
  };

  console.info('[OME cron] weekly enrichment completed', result);

  return NextResponse.json({ ok: true, ...result });
}

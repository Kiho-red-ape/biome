/**
 * GET /api/admin/sync-ctgov?secret=YOUR_CRON_SECRET
 *
 * Fetches recruiting trials from ClinicalTrials.gov and upserts into ctgov_studies.
 * Protected by CRON_SECRET env var. Trigger from browser or set as a Netlify cron job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';

const PAGE_SIZE  = 100;
const MAX_PAGES  = 10;
const STALE_DAYS = 14;
const CTGOV_BASE = 'https://clinicaltrials.gov/api/v2/studies';

// ─── Category mapping ─────────────────────────────────────────────────────────

function mapCategory(conditions: string[], interventionTypes: string[]): string {
  const all = [...conditions, ...interventionTypes].map((s) => s.toLowerCase()).join(' ');
  if (/microbiome|gut|probiotic|prebiotic|intestinal/.test(all))    return 'microbiome';
  if (/sleep|insomnia|circadian|rest/.test(all))                     return 'sleep';
  if (/aging|longevity|sarcopenia|age.related|senescence/.test(all)) return 'longevity';
  if (/wearable|device|sensor|fitbit|oura|actigraphy/.test(all))     return 'wearables';
  if (/nutrition|diet|obesity|diabetes|metabolic|weight/.test(all))  return 'nutrition';
  if (/cognitive|memory|brain|alzheimer|mental|depression|anxiety/.test(all)) return 'quantified_self';
  return 'other';
}

function hasCompensation(eligText: string | undefined): boolean {
  if (!eligText) return false;
  return /\$|\bcompensation\b|\breimbursement\b|\bpayment\b|\bpaid\b/i.test(eligText);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawStudy {
  protocolSection: {
    identificationModule:        { nctId: string; briefTitle: string };
    statusModule:                { overallStatus: string; startDateStruct?: { date: string }; completionDateStruct?: { date: string } };
    descriptionModule?:          { briefSummary?: string };
    conditionsModule?:           { conditions?: string[] };
    armsInterventionsModule?:    { interventions?: Array<{ type: string; name: string }> };
    designModule?:               { phases?: string[] };
    sponsorCollaboratorsModule?: { leadSponsor?: { name: string; class: string } };
    eligibilityModule?:          { eligibilityCriteria?: string; minimumAge?: string; maximumAge?: string; sex?: string; healthyVolunteers?: boolean };
    contactsLocationsModule?:    { centralContacts?: Array<{ name?: string; email?: string; phone?: string }>; locations?: Array<{ facility?: string; city?: string; state?: string; country?: string }> };
  };
}

function transform(raw: RawStudy) {
  const p   = raw.protocolSection;
  const id  = p.identificationModule;
  const st  = p.statusModule;
  const co  = p.conditionsModule;
  const ai  = p.armsInterventionsModule;
  const sp  = p.sponsorCollaboratorsModule;
  const el  = p.eligibilityModule;
  const cl  = p.contactsLocationsModule;

  const conditions        = co?.conditions ?? [];
  const interventions     = (ai?.interventions ?? []).map((i) => i.name);
  const interventionTypes = (ai?.interventions ?? []).map((i) => i.type);
  const firstContact      = cl?.centralContacts?.[0];

  return {
    id:                   id.nctId,
    nct_id:               id.nctId,
    title:                id.briefTitle,
    brief_summary:        p.descriptionModule?.briefSummary ?? null,
    conditions,
    interventions,
    intervention_types:   interventionTypes,
    phase:                p.designModule?.phases?.[0] ?? null,
    status:               st.overallStatus,
    sponsor_name:         sp?.leadSponsor?.name  ?? null,
    sponsor_class:        sp?.leadSponsor?.class ?? null,
    start_date:           st.startDateStruct?.date      ?? null,
    completion_date:      st.completionDateStruct?.date ?? null,
    minimum_age:          el?.minimumAge        ?? null,
    maximum_age:          el?.maximumAge        ?? null,
    sex:                  el?.sex               ?? null,
    healthy_volunteers:   el?.healthyVolunteers ?? null,
    enrollment_count:     null,
    locations:            (cl?.locations ?? []).slice(0, 20).map((l) => ({
      facility: l.facility ?? null, city: l.city ?? null,
      state: l.state ?? null, country: l.country ?? null,
    })),
    eligibility_criteria: el?.eligibilityCriteria ?? null,
    contact_name:         firstContact?.name  ?? null,
    contact_email:        firstContact?.email ?? null,
    contact_phone:        firstContact?.phone ?? null,
    ctgov_url:            `https://clinicaltrials.gov/study/${id.nctId}`,
    biome_category:       mapCategory(conditions, interventionTypes),
    has_compensation:     hasCompensation(el?.eligibilityCriteria),
    last_synced_at:       new Date().toISOString(),
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export const maxDuration = 60; // Netlify / Vercel max function duration (seconds)

export async function GET(req: NextRequest) {
  // Auth check
  const secret = req.nextUrl.searchParams.get('secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  let totalFetched  = 0;
  let totalUpserted = 0;
  let pageToken: string | undefined;
  const errors: string[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      format:                  'json',
      pageSize:                String(PAGE_SIZE),
      'filter.overallStatus':  'RECRUITING,NOT_YET_RECRUITING',
      'filter.interventionType': 'DIETARY_SUPPLEMENT,BEHAVIORAL,DEVICE,OTHER',
      'query.cond':            'nutrition OR microbiome OR gut OR sleep OR longevity OR cognitive OR aging OR metabolic',
    });
    if (pageToken) params.set('pageToken', pageToken);

    let studies: RawStudy[];
    let nextPageToken: string | undefined;

    try {
      const res = await fetch(`${CTGOV_BASE}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) { errors.push(`Page ${page + 1}: HTTP ${res.status}`); break; }
      const json = await res.json() as { studies: RawStudy[]; nextPageToken?: string };
      studies       = json.studies ?? [];
      nextPageToken = json.nextPageToken;
    } catch (err) {
      errors.push(`Page ${page + 1}: ${String(err)}`);
      break;
    }

    if (studies.length === 0) break;
    totalFetched += studies.length;

    const rows = studies.map(transform);
    const { error } = await supabase
      .from('ctgov_studies')
      .upsert(rows, { onConflict: 'nct_id' });

    if (error) { errors.push(`Upsert: ${error.message}`); }
    else        { totalUpserted += rows.length; }

    if (!nextPageToken) break;
    pageToken = nextPageToken;

    await new Promise((r) => setTimeout(r, 300));
  }

  // Delete stale entries
  const staleDate = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString();
  const { error: delError, count: deleted } = await supabase
    .from('ctgov_studies')
    .delete()
    .lt('last_synced_at', staleDate);

  if (delError) errors.push(`Delete stale: ${delError.message}`);

  return NextResponse.json({
    ok: errors.length === 0,
    fetched:  totalFetched,
    upserted: totalUpserted,
    deleted:  deleted ?? 0,
    errors,
  });
}

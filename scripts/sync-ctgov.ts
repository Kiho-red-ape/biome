/**
 * sync-ctgov.ts
 * Fetches recruiting/not-yet-recruiting trials from ClinicalTrials.gov API v2
 * and upserts them into the ctgov_studies Supabase table.
 *
 * Run: npm run sync-ctgov
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env
 */

import { createClient } from '@supabase/supabase-js';

// ─── Config ───────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CTGOV_BASE   = 'https://clinicaltrials.gov/api/v2/studies';
const PAGE_SIZE    = 100;
const MAX_PAGES    = 10;
const STALE_DAYS   = 14;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────

interface CTGovStudy {
  protocolSection: {
    identificationModule: {
      nctId:        string;
      briefTitle:   string;
    };
    statusModule: {
      overallStatus:   string;
      startDateStruct?: { date: string };
      completionDateStruct?: { date: string };
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    conditionsModule?: {
      conditions?: string[];
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        type: string;
        name: string;
      }>;
    };
    designModule?: {
      phases?: string[];
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: {
        name:  string;
        class: string;
      };
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      minimumAge?:          string;
      maximumAge?:          string;
      sex?:                 string;
      healthyVolunteers?:   boolean;
    };
    contactsLocationsModule?: {
      centralContacts?: Array<{
        name?:  string;
        email?: string;
        phone?: string;
      }>;
      locations?: Array<{
        facility?: string;
        city?:     string;
        state?:    string;
        country?:  string;
      }>;
    };
    designModule2?: {
      enrollmentInfo?: { count: number };
    };
  };
}

// ─── Category mapping ─────────────────────────────────────────────────────────

function mapCategory(conditions: string[], interventionTypes: string[]): string {
  const all = [...conditions, ...interventionTypes].map((s) => s.toLowerCase()).join(' ');
  if (/microbiome|gut|probiotic|prebiotic|intestinal/.test(all)) return 'microbiome';
  if (/sleep|insomnia|circadian|rest/.test(all))                  return 'sleep';
  if (/aging|longevity|sarcopenia|age.related|senescence/.test(all)) return 'longevity';
  if (/wearable|device|sensor|fitbit|oura|actigraphy/.test(all)) return 'wearables';
  if (/nutrition|diet|obesity|diabetes|metabolic|weight/.test(all)) return 'nutrition';
  if (/cognitive|memory|brain|alzheimer|mental|depression|anxiety/.test(all)) return 'quantified_self';
  return 'other';
}

function hasCompensation(eligText: string | undefined): boolean {
  if (!eligText) return false;
  return /\$|\bcompensation\b|\breimbursement\b|\bpayment\b|\bpaid\b/i.test(eligText);
}

// ─── Fetch one page ───────────────────────────────────────────────────────────

async function fetchPage(pageToken?: string): Promise<{ studies: CTGovStudy[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    format:       'json',
    pageSize:     String(PAGE_SIZE),
    filter.overallStatus: 'RECRUITING,NOT_YET_RECRUITING',
    filter.interventionType: 'DIETARY_SUPPLEMENT,BEHAVIORAL,DEVICE,OTHER',
    query.cond:   'nutrition OR microbiome OR gut OR sleep OR longevity OR cognitive OR aging OR metabolic',
    fields:       [
      'NCTId','BriefTitle','OverallStatus','BriefSummary',
      'Condition','InterventionType','InterventionName',
      'Phase','LeadSponsorName','LeadSponsorClass',
      'StartDate','CompletionDate','MinimumAge','MaximumAge','Sex','HealthyVolunteers',
      'EligibilityCriteria','CentralContactName','CentralContactEMail','CentralContactPhone',
      'LocationFacility','LocationCity','LocationState','LocationCountry',
      'EnrollmentCount',
    ].join(','),
  });

  if (pageToken) params.set('pageToken', pageToken);

  const url = `${CTGOV_BASE}?${params.toString()}`;
  const res  = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!res.ok) {
    throw new Error(`CT.gov API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json() as { studies: CTGovStudy[]; nextPageToken?: string };
  return { studies: json.studies ?? [], nextPageToken: json.nextPageToken };
}

// ─── Transform one study ──────────────────────────────────────────────────────

function transform(raw: CTGovStudy) {
  const p  = raw.protocolSection;
  const id = p.identificationModule;
  const st = p.statusModule;
  const ds = p.descriptionModule;
  const co = p.conditionsModule;
  const ai = p.armsInterventionsModule;
  const sp = p.sponsorCollaboratorsModule;
  const el = p.eligibilityModule;
  const cl = p.contactsLocationsModule;

  const conditions       = co?.conditions ?? [];
  const interventions    = (ai?.interventions ?? []).map((i) => i.name);
  const interventionTypes= (ai?.interventions ?? []).map((i) => i.type);
  const category         = mapCategory(conditions, interventionTypes);
  const firstContact     = cl?.centralContacts?.[0];

  const locations = (cl?.locations ?? []).slice(0, 20).map((l) => ({
    facility: l.facility ?? null,
    city:     l.city     ?? null,
    state:    l.state    ?? null,
    country:  l.country  ?? null,
  }));

  return {
    id:                  id.nctId,
    nct_id:              id.nctId,
    title:               id.briefTitle,
    brief_summary:       ds?.briefSummary ?? null,
    conditions,
    interventions,
    intervention_types:  interventionTypes,
    phase:               p.designModule?.phases?.[0] ?? null,
    status:              st.overallStatus,
    sponsor_name:        sp?.leadSponsor?.name  ?? null,
    sponsor_class:       sp?.leadSponsor?.class ?? null,
    start_date:          st.startDateStruct?.date       ?? null,
    completion_date:     st.completionDateStruct?.date  ?? null,
    minimum_age:         el?.minimumAge        ?? null,
    maximum_age:         el?.maximumAge        ?? null,
    sex:                 el?.sex               ?? null,
    healthy_volunteers:  el?.healthyVolunteers ?? null,
    enrollment_count:    null as number | null, // field path varies — skip for now
    locations,
    eligibility_criteria: el?.eligibilityCriteria ?? null,
    contact_name:        firstContact?.name  ?? null,
    contact_email:       firstContact?.email ?? null,
    contact_phone:       firstContact?.phone ?? null,
    ctgov_url:           `https://clinicaltrials.gov/study/${id.nctId}`,
    biome_category:      category,
    has_compensation:    hasCompensation(el?.eligibilityCriteria),
    last_synced_at:      new Date().toISOString(),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('→ Starting CT.gov sync…');
  let totalFetched = 0;
  let totalUpserted = 0;
  let pageToken: string | undefined;
  let page = 0;

  while (page < MAX_PAGES) {
    console.log(`  Page ${page + 1} / ${MAX_PAGES}…`);

    let studies: CTGovStudy[];
    try {
      const result = await fetchPage(pageToken);
      studies      = result.studies;
      pageToken    = result.nextPageToken;
    } catch (err) {
      console.error('  Fetch error:', err);
      break;
    }

    if (studies.length === 0) break;
    totalFetched += studies.length;

    const rows = studies.map(transform);

    const { error } = await supabase
      .from('ctgov_studies')
      .upsert(rows, { onConflict: 'nct_id' });

    if (error) {
      console.error('  Upsert error:', error.message);
    } else {
      totalUpserted += rows.length;
    }

    if (!pageToken) break;
    page++;

    // Brief pause to be polite to the API
    await new Promise((r) => setTimeout(r, 500));
  }

  // Delete stale entries (last_synced_at older than STALE_DAYS)
  const staleDate = new Date(Date.now() - STALE_DAYS * 86_400_000).toISOString();
  const { error: deleteError, count } = await supabase
    .from('ctgov_studies')
    .delete()
    .lt('last_synced_at', staleDate);

  if (deleteError) {
    console.error('  Delete stale error:', deleteError.message);
  } else {
    console.log(`  Deleted ${count ?? 0} stale entries (older than ${STALE_DAYS}d)`);
  }

  console.log(`✓ Done. Fetched: ${totalFetched}, Upserted: ${totalUpserted}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});

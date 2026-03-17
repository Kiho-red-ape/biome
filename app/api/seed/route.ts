import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const SEED_SECRET = process.env.SEED_SECRET;

const PROFILES = [
  { id: 'did:privy:seed-vitadao',    auth_type: 'wallet' as const, display_name: 'VitaDAO',                role: 'experimenter' as const, bio: 'Longevity-focused DAO funding early-stage research.',          region: 'Global'         },
  { id: 'did:privy:seed-cerebrum',   auth_type: 'wallet' as const, display_name: 'Cerebrum DAO',           role: 'experimenter' as const, bio: 'Decentralized neuroscience research collective.',             region: 'Global'         },
  { id: 'did:privy:seed-biohackers', auth_type: 'wallet' as const, display_name: 'Biohackers DAO',         role: 'experimenter' as const, bio: 'Community-driven open-science biohacking experiments.',      region: 'Global'         },
  { id: 'did:privy:seed-stanford',   auth_type: 'email'  as const, display_name: 'Stanford Longevity Lab', role: 'experimenter' as const, bio: 'Academic research lab at Stanford University.',              region: 'United States'  },
];

const EXPERIMENTS = [
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000001',
    experimenter_id: 'did:privy:seed-vitadao',
    title: 'NAD+ Precursor Titration Response',
    description: 'Measuring cellular NAD+ response curves across three oral precursor compounds (NMN, NR, Niacinamide). Participants complete baseline bloodwork, a 12-week supplement protocol with randomized allocation, and a follow-up panel. All bloodwork kits shipped to your door.',
    category: 'Longevity',
    status: 'recruiting' as const,
    bounty_per_participant: 150, total_bounty_pool: 30000,
    slots_total: 200, slots_filled: 180, duration_weeks: 12,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://discord.gg/vitadao',
  },
  {
    id: 'a1b2c3d4-0002-0002-0002-000000000002',
    experimenter_id: 'did:privy:seed-cerebrum',
    title: 'BDNF Upregulation via Cold Exposure',
    description: 'Investigating the dose-response relationship between cold water immersion frequency and serum BDNF levels. Participants self-report sessions and submit saliva-based BDNF assay kits at weeks 0, 4, and 8.',
    category: 'Neuroscience',
    status: 'recruiting' as const,
    bounty_per_participant: 75, total_bounty_pool: 7500,
    slots_total: 100, slots_filled: 67, duration_weeks: 8,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://discord.gg/cerebrumdao',
  },
  {
    id: 'a1b2c3d4-0003-0003-0003-000000000003',
    experimenter_id: 'did:privy:seed-biohackers',
    title: 'Sleep Architecture Optimization Study',
    description: 'Exploring correlations between sleep onset latency, REM duration, and self-reported cognitive performance using consumer sleep trackers over 30 days.',
    category: 'Sleep',
    status: 'recruiting' as const,
    bounty_per_participant: 25, total_bounty_pool: 12500,
    slots_total: 500, slots_filled: 145, duration_weeks: 4,
    region: 'Remote', is_remote: true, is_verified: false, verification_level: 'none' as const,
    external_comms_url: 'https://t.me/biohackersdao',
  },
  {
    id: 'a1b2c3d4-0004-0004-0004-000000000004',
    experimenter_id: 'did:privy:seed-stanford',
    title: 'Gut Microbiome Diversity Profiling',
    description: '16S rRNA sequencing of gut microbiota in adults over 60. Two stool samples + dietary logs. Stanford IRB approved. Full sequencing report provided.',
    category: 'Microbiome',
    status: 'active' as const,
    bounty_per_participant: 200, total_bounty_pool: 8000,
    slots_total: 40, slots_filled: 40, duration_weeks: 13,
    region: 'United States', is_remote: false, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://longevity.stanford.edu',
  },
  {
    id: 'a1b2c3d4-0005-0005-0005-000000000005',
    experimenter_id: 'did:privy:seed-biohackers',
    title: 'Circadian Rhythm Disruption Biomarkers',
    description: 'Tracking cortisol rhythm, melatonin timing, and glucose variability in shift workers vs. standard-schedule individuals using CGM + daily cortisol saliva kits.',
    category: 'Metabolic',
    status: 'recruiting' as const,
    bounty_per_participant: 30, total_bounty_pool: 9000,
    slots_total: 300, slots_filled: 89, duration_weeks: 6,
    region: 'US / EU', is_remote: false, is_verified: false, verification_level: 'none' as const,
    external_comms_url: 'https://t.me/biohackersdao',
  },
  {
    id: 'a1b2c3d4-0006-0006-0006-000000000006',
    experimenter_id: 'did:privy:seed-cerebrum',
    title: 'Nootropic Stack Cognitive Benchmarking',
    description: 'Blind comparison of four nootropic stacks (Lion\'s Mane, Bacopa, Alpha-GPC, placebo) on n-back, Stroop, and reaction time benchmarks. Fully remote browser-based assessments.',
    category: 'Cognitive',
    status: 'recruiting' as const,
    bounty_per_participant: 50, total_bounty_pool: 7500,
    slots_total: 150, slots_filled: 43, duration_weeks: 16,
    region: 'Remote', is_remote: true, is_verified: false, verification_level: 'none' as const,
    external_comms_url: 'https://discord.gg/cerebrumdao',
  },
  {
    id: 'a1b2c3d4-0007-0007-0007-000000000007',
    experimenter_id: 'did:privy:seed-vitadao',
    title: 'HRV-Guided Stress Adaptation Protocol',
    description: 'Testing whether HRV-paced breathwork measurably reduces salivary cortisol over 10 weeks. Requires any HRV-capable wearable. Daily 10-minute breathwork + morning cortisol strip.',
    category: 'Longevity',
    status: 'active' as const,
    bounty_per_participant: 80, total_bounty_pool: 6400,
    slots_total: 80, slots_filled: 80, duration_weeks: 10,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://discord.gg/vitadao',
  },
  {
    id: 'a1b2c3d4-0008-0008-0008-000000000008',
    experimenter_id: 'did:privy:seed-stanford',
    title: '3-Day Fasting Metabolomics Panel',
    description: 'Full plasma metabolomics (800+ metabolites) before, during, and after a 72-hour supervised water fast. In-person bloodwork at Stanford-affiliate clinic on days 0, 1, 3, and 5.',
    category: 'Metabolic',
    status: 'completed' as const,
    bounty_per_participant: 300, total_bounty_pool: 7500,
    slots_total: 25, slots_filled: 25, duration_weeks: 2,
    region: 'US / EU', is_remote: false, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://longevity.stanford.edu',
  },
];

export async function POST(request: NextRequest) {
  // Guard: check secret header
  const secret = request.headers.get('x-seed-secret');
  if (!SEED_SECRET || secret !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Upsert profiles
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(PROFILES, { onConflict: 'id' });

  if (profileErr) {
    return NextResponse.json({ error: `profiles: ${profileErr.message}` }, { status: 500 });
  }

  // Upsert experiments
  const { error: expErr } = await supabase
    .from('experiments')
    .upsert(EXPERIMENTS, { onConflict: 'id' });

  if (expErr) {
    return NextResponse.json({ error: `experiments: ${expErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profiles: PROFILES.length, experiments: EXPERIMENTS.length });
}

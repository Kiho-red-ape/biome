import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const SEED_SECRET = process.env.SEED_SECRET;

const PROFILES = [
  { id: 'did:privy:seed-vitadao',    auth_type: 'wallet' as const, display_name: 'VitaDAO',                role: 'experimenter' as const, bio: 'Longevity-focused DAO funding early-stage health research.',   region: 'Global'        },
  { id: 'did:privy:seed-cerebrum',   auth_type: 'wallet' as const, display_name: 'Cerebrum DAO',           role: 'experimenter' as const, bio: 'Community-funded mental health and brain research collective.', region: 'Global'        },
  { id: 'did:privy:seed-biohackers', auth_type: 'wallet' as const, display_name: 'Biohackers DAO',         role: 'experimenter' as const, bio: 'Open-science experiments anyone can participate in.',           region: 'Global'        },
  { id: 'did:privy:seed-stanford',   auth_type: 'email'  as const, display_name: 'Stanford Longevity Lab', role: 'experimenter' as const, bio: 'Academic research lab studying healthy aging at Stanford.',     region: 'United States' },
];

const EXPERIMENTS = [
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000001',
    experimenter_id: 'did:privy:seed-vitadao',
    title: 'Does Magnesium Help You Sleep Better?',
    description: 'We\'re testing whether a nightly magnesium glycinate supplement (300mg) helps people fall asleep faster and wake up feeling more rested. You\'ll take one capsule 30 minutes before bed for 8 weeks and fill out a short weekly sleep survey. Capsule packs shipped free to your door anywhere in the world. No bloodwork, no clinic visits.',
    category: 'Sleep',
    status: 'recruiting' as const,
    bounty_per_participant: 40, total_bounty_pool: 12000,
    slots_total: 300, slots_filled: 186, duration_weeks: 8,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://discord.gg/vitadao',
  },
  {
    id: 'a1b2c3d4-0002-0002-0002-000000000002',
    experimenter_id: 'did:privy:seed-biohackers',
    title: 'What Happens When You Cut Off Coffee After 12pm?',
    description: 'We want to know if stopping caffeine after noon for 4 weeks improves your sleep quality and reduces afternoon energy crashes. You\'ll keep a simple coffee log and fill in a 2-minute daily energy check-in. No wearables, no bloodwork, no supplements. Just a habit change and a daily note.',
    category: 'Energy',
    status: 'recruiting' as const,
    bounty_per_participant: 25, total_bounty_pool: 12500,
    slots_total: 500, slots_filled: 210, duration_weeks: 4,
    region: 'Remote', is_remote: true, is_verified: false, verification_level: 'none' as const,
    external_comms_url: 'https://t.me/biohackersdao',
  },
  {
    id: 'a1b2c3d4-0003-0003-0003-000000000003',
    experimenter_id: 'did:privy:seed-stanford',
    title: 'Does a 10-Minute Walk After Lunch Improve Your Mood?',
    description: 'A simple habit trial. We\'re testing whether adding a 10-minute outdoor walk after lunch — 5 days a week for 6 weeks — measurably improves mood and reduces the afternoon mental slump. You log how you feel each day using a short form on your phone. No equipment, no supplements, no clinic visits required.',
    category: 'Mood',
    status: 'recruiting' as const,
    bounty_per_participant: 30, total_bounty_pool: 9000,
    slots_total: 300, slots_filled: 178, duration_weeks: 6,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://longevity.stanford.edu',
  },
  {
    id: 'a1b2c3d4-0004-0004-0004-000000000004',
    experimenter_id: 'did:privy:seed-vitadao',
    title: 'Can Fish Oil Reduce Soreness After Exercise?',
    description: 'We\'re studying whether 2g of omega-3 fish oil daily reduces muscle soreness in the 24–48 hours after strength training. You\'ll take capsules for 12 weeks and log your soreness after each workout using a simple 1–10 scale. Supplements shipped to you. You need to exercise at least twice a week to qualify.',
    category: 'Nutrition',
    status: 'active' as const,
    bounty_per_participant: 50, total_bounty_pool: 10000,
    slots_total: 200, slots_filled: 200, duration_weeks: 12,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://discord.gg/vitadao',
  },
  {
    id: 'a1b2c3d4-0005-0005-0005-000000000005',
    experimenter_id: 'did:privy:seed-biohackers',
    title: 'Do Blue Light Glasses Before Bed Actually Work?',
    description: 'Blue light glasses are everywhere — but do they actually improve sleep? We\'re running a 30-day trial: half of participants wear blue light glasses for 2 hours before bed, the other half follow their normal routine. You log your sleep time and how rested you feel each morning. No wearable needed, just a 60-second nightly check-in.',
    category: 'Sleep',
    status: 'recruiting' as const,
    bounty_per_participant: 35, total_bounty_pool: 8750,
    slots_total: 250, slots_filled: 88, duration_weeks: 4,
    region: 'Remote', is_remote: true, is_verified: false, verification_level: 'none' as const,
    external_comms_url: 'https://t.me/biohackersdao',
  },
  {
    id: 'a1b2c3d4-0006-0006-0006-000000000006',
    experimenter_id: 'did:privy:seed-biohackers',
    title: '30-Day Cold Shower Challenge: Does It Change Your Energy?',
    description: 'One cold shower per morning (minimum 60 seconds) for 30 days. We track whether participants report changes in morning energy, alertness, and overall mood. You fill in a 1-minute daily log. No equipment needed. Open to healthy adults 18+. If you already take cold showers regularly, you\'re not eligible.',
    category: 'Energy',
    status: 'recruiting' as const,
    bounty_per_participant: 20, total_bounty_pool: 12000,
    slots_total: 600, slots_filled: 143, duration_weeks: 4,
    region: 'Remote', is_remote: true, is_verified: false, verification_level: 'none' as const,
    external_comms_url: 'https://t.me/biohackersdao',
  },
  {
    id: 'a1b2c3d4-0007-0007-0007-000000000007',
    experimenter_id: 'did:privy:seed-stanford',
    title: 'Eating in an 8-Hour Window: Does It Help With Energy and Weight?',
    description: 'We\'re studying what happens when people eat all their meals within an 8-hour window (e.g. 10am–6pm) for 10 weeks. You track meal timing, energy levels, and weekly weight on your phone. No calorie counting, no food restrictions — just the timing. A registered dietitian checks in with you at weeks 4 and 8.',
    category: 'Nutrition',
    status: 'active' as const,
    bounty_per_participant: 60, total_bounty_pool: 9000,
    slots_total: 150, slots_filled: 112, duration_weeks: 10,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://longevity.stanford.edu',
  },
  {
    id: 'a1b2c3d4-0008-0008-0008-000000000008',
    experimenter_id: 'did:privy:seed-cerebrum',
    title: 'Meditation App vs. Daily Journaling: Which Reduces Stress More?',
    description: 'For 8 weeks, half of participants used a guided meditation app for 10 minutes daily; the other half kept a written journal. We measured self-reported stress, focus, and sleep quality at weeks 0, 4, and 8. This study is now closed. Results will be published publicly. Participants have been paid.',
    category: 'Focus',
    status: 'completed' as const,
    bounty_per_participant: 45, total_bounty_pool: 9000,
    slots_total: 200, slots_filled: 200, duration_weeks: 8,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://discord.gg/cerebrumdao',
  },
];

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-seed-secret');
  if (!SEED_SECRET || secret !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert(PROFILES, { onConflict: 'id' });

  if (profileErr) {
    return NextResponse.json({ error: `profiles: ${profileErr.message}` }, { status: 500 });
  }

  const { error: expErr } = await supabase
    .from('experiments')
    .upsert(EXPERIMENTS, { onConflict: 'id' });

  if (expErr) {
    return NextResponse.json({ error: `experiments: ${expErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profiles: PROFILES.length, experiments: EXPERIMENTS.length });
}

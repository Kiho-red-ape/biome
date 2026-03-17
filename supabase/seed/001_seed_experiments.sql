-- ============================================================
-- BIOME — Seed Data (user-friendly experiments)
-- Run AFTER 001_initial_schema.sql
-- Uses upsert — safe to run multiple times
-- ============================================================

insert into profiles (id, auth_type, display_name, role, bio, region) values
  ('did:privy:seed-vitadao',    'wallet', 'VitaDAO',                'experimenter', 'Longevity-focused DAO funding early-stage health research.',   'Global'),
  ('did:privy:seed-cerebrum',   'wallet', 'Cerebrum DAO',           'experimenter', 'Community-funded mental health and brain research collective.', 'Global'),
  ('did:privy:seed-biohackers', 'wallet', 'Biohackers DAO',         'experimenter', 'Open-science experiments anyone can participate in.',           'Global'),
  ('did:privy:seed-stanford',   'email',  'Stanford Longevity Lab', 'experimenter', 'Academic research lab studying healthy aging at Stanford.',     'United States')
on conflict (id) do update set
  display_name = excluded.display_name,
  bio          = excluded.bio;

insert into experiments (
  id, experimenter_id, title, description, category,
  status, bounty_per_participant, total_bounty_pool,
  slots_total, slots_filled, duration_weeks,
  region, is_remote, is_verified, verification_level, external_comms_url
) values

(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'did:privy:seed-vitadao',
  'Does Magnesium Help You Sleep Better?',
  'We''re testing whether a nightly magnesium glycinate supplement (300mg) helps people fall asleep faster and wake up feeling more rested. You''ll take one capsule 30 minutes before bed for 8 weeks and fill out a short weekly sleep survey. Capsule packs shipped free to your door. No bloodwork, no clinic visits.',
  'Sleep',
  'recruiting', 40.00, 12000.00, 300, 186, 8,
  'Remote', true, true, 'biome', 'https://discord.gg/vitadao'
),

(
  'a1b2c3d4-0002-0002-0002-000000000002',
  'did:privy:seed-biohackers',
  'What Happens When You Cut Off Coffee After 12pm?',
  'We want to know if stopping caffeine after noon for 4 weeks improves your sleep and reduces afternoon energy crashes. You''ll keep a simple coffee log and fill in a 2-minute daily energy check-in. No wearables, no bloodwork, no supplements — just a habit change and a daily note.',
  'Energy',
  'recruiting', 25.00, 12500.00, 500, 210, 4,
  'Remote', true, false, 'none', 'https://t.me/biohackersdao'
),

(
  'a1b2c3d4-0003-0003-0003-000000000003',
  'did:privy:seed-stanford',
  'Does a 10-Minute Walk After Lunch Improve Your Mood?',
  'A simple habit trial. We''re testing whether adding a 10-minute outdoor walk after lunch — 5 days a week for 6 weeks — measurably improves mood and reduces the afternoon mental slump. You log how you feel each day using a short form on your phone. No equipment or supplements required.',
  'Mood',
  'recruiting', 30.00, 9000.00, 300, 178, 6,
  'Remote', true, true, 'biome', 'https://longevity.stanford.edu'
),

(
  'a1b2c3d4-0004-0004-0004-000000000004',
  'did:privy:seed-vitadao',
  'Can Fish Oil Reduce Soreness After Exercise?',
  'We''re studying whether 2g of omega-3 fish oil daily reduces muscle soreness in the 24–48 hours after strength training. You''ll take capsules for 12 weeks and log your soreness after each workout on a 1–10 scale. Supplements shipped to you. You need to exercise at least twice a week to qualify.',
  'Nutrition',
  'active', 50.00, 10000.00, 200, 200, 12,
  'Remote', true, true, 'biome', 'https://discord.gg/vitadao'
),

(
  'a1b2c3d4-0005-0005-0005-000000000005',
  'did:privy:seed-biohackers',
  'Do Blue Light Glasses Before Bed Actually Work?',
  'Blue light glasses are everywhere — but do they actually improve sleep? We''re running a 30-day trial: half of participants wear blue light glasses for 2 hours before bed, the other half follow their normal routine. You log your sleep time and how rested you feel each morning. No wearable needed.',
  'Sleep',
  'recruiting', 35.00, 8750.00, 250, 88, 4,
  'Remote', true, false, 'none', 'https://t.me/biohackersdao'
),

(
  'a1b2c3d4-0006-0006-0006-000000000006',
  'did:privy:seed-biohackers',
  '30-Day Cold Shower Challenge: Does It Change Your Energy?',
  'One cold shower per morning (minimum 60 seconds) for 30 days. We track whether participants report changes in morning energy, alertness, and overall mood via a 1-minute daily log. No equipment needed. Open to healthy adults 18+. If you already take cold showers regularly, you are not eligible.',
  'Energy',
  'recruiting', 20.00, 12000.00, 600, 143, 4,
  'Remote', true, false, 'none', 'https://t.me/biohackersdao'
),

(
  'a1b2c3d4-0007-0007-0007-000000000007',
  'did:privy:seed-stanford',
  'Eating in an 8-Hour Window: Does It Help With Energy and Weight?',
  'We''re studying what happens when people eat all their meals within an 8-hour window (e.g. 10am–6pm) for 10 weeks. You track meal timing, energy levels, and weekly weight on your phone. No calorie counting, no food restrictions — just the timing. A registered dietitian checks in at weeks 4 and 8.',
  'Nutrition',
  'active', 60.00, 9000.00, 150, 112, 10,
  'Remote', true, true, 'biome', 'https://longevity.stanford.edu'
),

(
  'a1b2c3d4-0008-0008-0008-000000000008',
  'did:privy:seed-cerebrum',
  'Meditation App vs. Daily Journaling: Which Reduces Stress More?',
  'For 8 weeks, half of participants used a guided meditation app for 10 minutes daily; the other half kept a written journal. We measured self-reported stress, focus, and sleep quality at weeks 0, 4, and 8. This study is now closed. Results will be published publicly. All participants have been paid.',
  'Focus',
  'completed', 45.00, 9000.00, 200, 200, 8,
  'Remote', true, true, 'biome', 'https://discord.gg/cerebrumdao'
)

on conflict (id) do update set
  title                  = excluded.title,
  description            = excluded.description,
  category               = excluded.category,
  status                 = excluded.status,
  bounty_per_participant = excluded.bounty_per_participant,
  total_bounty_pool      = excluded.total_bounty_pool,
  slots_total            = excluded.slots_total,
  slots_filled           = excluded.slots_filled,
  is_verified            = excluded.is_verified,
  verification_level     = excluded.verification_level;

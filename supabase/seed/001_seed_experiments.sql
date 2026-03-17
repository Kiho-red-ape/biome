-- ============================================================
-- BIOME — Seed Data
-- Run AFTER 001_initial_schema.sql
-- Paste into: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Seed experimenter profiles ──────────────────────────────

insert into profiles (id, auth_type, display_name, role, bio, region) values
  ('did:privy:seed-vitadao',    'wallet', 'VitaDAO',                'experimenter', 'Longevity-focused DAO funding early-stage research and drug development.', 'Global'),
  ('did:privy:seed-cerebrum',   'wallet', 'Cerebrum DAO',           'experimenter', 'Decentralized neuroscience research collective.',                         'Global'),
  ('did:privy:seed-biohackers', 'wallet', 'Biohackers DAO',         'experimenter', 'Community-driven open-science biohacking experiments.',                   'Global'),
  ('did:privy:seed-stanford',   'email',  'Stanford Longevity Lab', 'experimenter', 'Academic research lab at Stanford University.',                           'United States')
on conflict (id) do nothing;

-- ─── Seed experiments ─────────────────────────────────────────

insert into experiments (
  id, experimenter_id, title, description, category,
  status, bounty_per_participant, total_bounty_pool,
  slots_total, slots_filled, duration_weeks,
  region, is_remote, is_verified, verification_level,
  external_comms_url
) values

-- 1. NAD+ Study — VitaDAO — Longevity — VERIFIED — RECRUITING
(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'did:privy:seed-vitadao',
  'NAD+ Precursor Titration Response',
  'Measuring cellular NAD+ response curves across three oral precursor compounds (NMN, NR, Niacinamide). Participants complete baseline bloodwork, a 12-week supplement protocol with randomized allocation, and a follow-up panel. All bloodwork kits shipped to your door. Remote-eligible worldwide.',
  'Longevity',
  'recruiting', 150.00, 30000.00,
  200, 180, 12,
  'Remote', true, true, 'biome',
  'https://discord.gg/vitadao'
),

-- 2. BDNF Cold Exposure — Cerebrum DAO — Neuroscience — VERIFIED — RECRUITING
(
  'a1b2c3d4-0002-0002-0002-000000000002',
  'did:privy:seed-cerebrum',
  'BDNF Upregulation via Cold Exposure',
  'Investigating the dose-response relationship between cold water immersion frequency and serum BDNF levels in healthy adults. Participants self-report 3x/week cold shower or plunge sessions and submit saliva-based BDNF assay kits at weeks 0, 4, and 8. No equipment required beyond a shower.',
  'Neuroscience',
  'recruiting', 75.00, 7500.00,
  100, 67, 8,
  'Remote', true, true, 'biome',
  'https://discord.gg/cerebrumdao'
),

-- 3. Sleep Architecture — Biohackers DAO — Sleep — NOT VERIFIED — RECRUITING
(
  'a1b2c3d4-0003-0003-0003-000000000003',
  'did:privy:seed-biohackers',
  'Sleep Architecture Optimization Study',
  'Exploring correlations between sleep onset latency, REM duration, and self-reported cognitive performance. Participants use any consumer sleep tracker (Oura, Whoop, Apple Watch) and complete a 10-minute daily log for 30 days. No bloodwork required.',
  'Sleep',
  'recruiting', 25.00, 12500.00,
  500, 145, 4,
  'Remote', true, false, 'none',
  'https://t.me/biohackersdao'
),

-- 4. Gut Microbiome — Stanford — Microbiome — VERIFIED — ACTIVE
(
  'a1b2c3d4-0004-0004-0004-000000000004',
  'did:privy:seed-stanford',
  'Gut Microbiome Diversity Profiling',
  'Comprehensive 16S rRNA sequencing of gut microbiota in adults over 60. Participants submit two stool samples (baseline + 90 days) alongside dietary logs. Ships only within the United States. Stanford IRB approved. Full sequencing report provided to each participant.',
  'Microbiome',
  'active', 200.00, 8000.00,
  40, 40, 13,
  'United States', false, true, 'biome',
  'https://longevity.stanford.edu'
),

-- 5. Circadian Disruption — Biohackers DAO — Metabolic — NOT VERIFIED — RECRUITING
(
  'a1b2c3d4-0005-0005-0005-000000000005',
  'did:privy:seed-biohackers',
  'Circadian Rhythm Disruption Biomarkers',
  'Tracking cortisol rhythm, melatonin timing, and glucose variability in shift workers vs. standard-schedule individuals. Participants wear a CGM for 14 days and complete a daily cortisol saliva kit. Kit shipped to participants in US and EU only.',
  'Metabolic',
  'recruiting', 30.00, 9000.00,
  300, 89, 6,
  'US / EU', false, false, 'none',
  'https://t.me/biohackersdao'
),

-- 6. Nootropic Stack — Cerebrum DAO — Cognitive — NOT VERIFIED — RECRUITING
(
  'a1b2c3d4-0006-0006-0006-000000000006',
  'did:privy:seed-cerebrum',
  'Nootropic Stack Cognitive Benchmarking',
  'Blind comparison of four nootropic stacks (Lion''s Mane, Bacopa, Alpha-GPC, and a placebo) on validated cognitive benchmarks including n-back, Stroop, and reaction time. Fully remote. Participants access the benchmark suite via browser. Stack shipped monthly.',
  'Cognitive',
  'recruiting', 50.00, 7500.00,
  150, 43, 16,
  'Remote', true, false, 'none',
  'https://discord.gg/cerebrumdao'
),

-- 7. HRV Stress Protocol — VitaDAO — Longevity — VERIFIED — ACTIVE
(
  'a1b2c3d4-0007-0007-0007-000000000007',
  'did:privy:seed-vitadao',
  'HRV-Guided Stress Adaptation Protocol',
  'Testing whether HRV-paced breathwork (guided by a wearable) measurably reduces salivary cortisol over 10 weeks. Participants need any HRV-capable wearable (Garmin, Polar, Whoop). Daily 10-minute breathwork session + morning cortisol strip. BIOME-verified protocol.',
  'Longevity',
  'active', 80.00, 6400.00,
  80, 80, 10,
  'Remote', true, true, 'biome',
  'https://discord.gg/vitadao'
),

-- 8. Fasting Metabolomics — Stanford — Metabolic — VERIFIED — COMPLETED
(
  'a1b2c3d4-0008-0008-0008-000000000008',
  'did:privy:seed-stanford',
  '3-Day Fasting Metabolomics Panel',
  'Full plasma metabolomics (800+ metabolites) before, during, and after a 72-hour supervised water fast. Participants travel to a Stanford-affiliate clinic for bloodwork on days 0, 1, 3, and 5. Participants receive their complete metabolomics report. US and EU participants only.',
  'Metabolic',
  'completed', 300.00, 7500.00,
  25, 25, 2,
  'US / EU', false, true, 'biome',
  'https://longevity.stanford.edu'
)

on conflict (id) do nothing;

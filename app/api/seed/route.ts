import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

const SEED_SECRET = process.env.SEED_SECRET;

// ─── Experimenter profiles ────────────────────────────────────────────────────

const EXPERIMENTER_PROFILES = [
  {
    id: 'did:privy:seed-pure-enc',
    auth_type: 'wallet' as const,
    display_name: 'Pure Encapsulations × VitaDAO',
    role: 'experimenter' as const,
    bio: 'Pure Encapsulations produces hypoallergenic, research-grade supplements. This sleep study runs in partnership with the VitaDAO longevity research network.',
    region: 'Global',
  },
  {
    id: 'did:privy:seed-biohackers',
    auth_type: 'wallet' as const,
    display_name: 'Biohackers DAO',
    role: 'experimenter' as const,
    bio: 'Open-science community running low-cost, self-tracked habit experiments that anyone can join. No clinic visits, no equipment.',
    region: 'Global',
  },
  {
    id: 'did:privy:seed-stanford',
    auth_type: 'email' as const,
    display_name: 'Stanford Longevity Lab',
    role: 'experimenter' as const,
    bio: 'Academic research group at Stanford University studying healthy aging, metabolic health, and lifestyle interventions.',
    region: 'United States',
  },
  {
    id: 'did:privy:seed-thorne',
    auth_type: 'wallet' as const,
    display_name: 'Thorne Research × VitaDAO',
    role: 'experimenter' as const,
    bio: 'Thorne Research manufactures clinical-grade supplements used by professional sports teams and academic labs. Fish oil trial conducted in partnership with VitaDAO.',
    region: 'Global',
  },
  {
    id: 'did:privy:seed-cerebrum',
    auth_type: 'wallet' as const,
    display_name: 'Cerebrum DAO',
    role: 'experimenter' as const,
    bio: 'Decentralised neuroscience collective. Partners include Double Wood Supplements and licensed clinical psychologists who review all mental health protocols.',
    region: 'Global',
  },
];

// ─── Participant profiles (for seeded forum comments) ─────────────────────────

const PARTICIPANT_PROFILES = [
  { id: 'did:privy:seed-user1', auth_type: 'email'  as const, display_name: 'BioNomad_88',  role: 'participant' as const, region: 'United States', bio: null },
  { id: 'did:privy:seed-user2', auth_type: 'email'  as const, display_name: 'kelp.forest',  role: 'participant' as const, region: 'United Kingdom', bio: null },
  { id: 'did:privy:seed-user3', auth_type: 'wallet' as const, display_name: 'Hiroshi_M',    role: 'participant' as const, region: 'Japan',          bio: null },
  { id: 'did:privy:seed-user4', auth_type: 'email'  as const, display_name: 'SaraVHL',      role: 'participant' as const, region: 'Germany',        bio: null },
  { id: 'did:privy:seed-user5', auth_type: 'wallet' as const, display_name: 'txnull',        role: 'participant' as const, region: 'Remote',         bio: null },
];

// ─── Experiments ──────────────────────────────────────────────────────────────

const EXPERIMENTS = [
  {
    id: 'a1b2c3d4-0001-0001-0001-000000000001',
    experimenter_id: 'did:privy:seed-pure-enc',
    title: 'Magnesium & Sleep Quality',
    short_description: 'Take one magnesium glycinate capsule 30 min before bed for 8 weeks. Log sleep quality weekly. Kit shipped free. No clinic visits.',
    description: 'We\'re testing whether a nightly magnesium glycinate supplement (300mg) helps people fall asleep faster and wake up feeling more rested. Pure Encapsulations produces the capsules to hypoallergenic standards — no fillers, no additives. You\'ll take one capsule 30 minutes before bed for 8 weeks and fill in a short weekly sleep survey. A pre-paid supplement kit is shipped free to your door anywhere in the world. No bloodwork, no clinic visits, no wearables required.',
    category: 'Sleep',
    status: 'recruiting' as const,
    bounty_per_participant: 40, total_bounty_pool: 12000,
    slots_total: 300, slots_filled: 186, duration_weeks: 8,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://discord.gg/vitadao',
    tests_needed: 'Weekly sleep diary (app link provided upon enrolment). Short 5-question survey each Monday morning.',
    inclusion_criteria: 'Aged 18 or over\nRegular sleep schedule (consistent wake time ±1 hour)\nNo current sleep medication or sleep disorder diagnosis\nWilling to take a daily supplement for 8 weeks\nWorldwide — remote eligible',
    exclusion_criteria: 'Diagnosed insomnia, sleep apnoea, or RLS\nCurrently taking any magnesium supplement\nPregnant or breastfeeding\nKidney disease or impaired renal function',
    iec_approval: 'VitaDAO Ethics Review Board — Protocol VD-2025-MGX-001. Low-risk non-interventional supplement study. IRB-equivalent oversight provided by the DeSci Foundation Ethics Panel.',
  },
  {
    id: 'a1b2c3d4-0002-0002-0002-000000000002',
    experimenter_id: 'did:privy:seed-biohackers',
    title: 'No Coffee After Noon',
    short_description: 'Stop all caffeine after 12pm for 4 weeks. Log your afternoon energy daily. No equipment, no supplements, no clinic visits.',
    description: 'We want to know if stopping caffeine after noon for 4 weeks measurably improves sleep quality and reduces the 3pm energy crash. This is a self-tracked observational study — no supplements, no equipment, no clinic visits. You just track what you currently drink and when, and rate your energy each afternoon. The daily log takes under 2 minutes. Results across all participants will be published openly.',
    category: 'Energy',
    status: 'recruiting' as const,
    bounty_per_participant: 25, total_bounty_pool: 12500,
    slots_total: 500, slots_filled: 210, duration_weeks: 4,
    region: 'Remote', is_remote: true, is_verified: false, verification_level: 'none' as const,
    external_comms_url: 'https://t.me/biohackersdao',
    tests_needed: 'Daily caffeine log (Google Form, ~90 seconds). Daily afternoon energy rating (1–10 scale, filled by 4pm).',
    inclusion_criteria: 'Aged 18 or over\nCurrently drinks at least 1 cup of coffee or caffeinated tea per day\nWilling to stop caffeine after noon for 4 weeks\nNo serious health conditions affecting energy (e.g. thyroid disorders)\nWorldwide — remote eligible',
    exclusion_criteria: 'Non-caffeine consumers\nHeart conditions or arrhythmia\nOn stimulant or ADHD medication\nPregnant or breastfeeding',
    iec_approval: 'Self-reported observational study. No IEC required under current ethical guidelines. All data collected anonymously and processed under GDPR.',
  },
  {
    id: 'a1b2c3d4-0003-0003-0003-000000000003',
    experimenter_id: 'did:privy:seed-stanford',
    title: 'Post-Lunch Walk & Mood',
    short_description: '10-minute outdoor walk after lunch, 5 days/week for 6 weeks. Daily mood check-in on your phone. No equipment or supplements.',
    description: 'We\'re testing whether adding a 10-minute outdoor walk immediately after lunch — 5 days per week for 6 weeks — measurably improves mood and reduces the afternoon mental slump. Participants log how they feel each day using a short form on their phone. No equipment, no supplements, no clinic visits required. Stanford IRB approved. The final dataset will be published openly and participants receive a personal results summary.',
    category: 'Mood',
    status: 'recruiting' as const,
    bounty_per_participant: 30, total_bounty_pool: 9000,
    slots_total: 300, slots_filled: 178, duration_weeks: 6,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://longevity.stanford.edu',
    tests_needed: 'Daily mood log via phone form (~1 minute). Weekly wellbeing check-in (PHQ-2 + GAD-2, ~2 minutes). Walk compliance log (yes/no).',
    inclusion_criteria: 'Aged 18 or over\nOffice or desk-based work (any industry)\nAble to walk outdoors for 10 minutes at lunchtime\nOwns a smartphone\nWorldwide — remote eligible',
    exclusion_criteria: 'Mobility impairments preventing a 10-minute walk\nAlready doing structured exercise at lunch\nClinical depression or anxiety currently under treatment (to avoid interference with outcome measures)',
    iec_approval: 'Stanford IRB Approved — Protocol #STF-2025-WALK-042. Full ethics review on file. Open to international participants.',
  },
  {
    id: 'a1b2c3d4-0004-0004-0004-000000000004',
    experimenter_id: 'did:privy:seed-thorne',
    title: 'Fish Oil & Post-Workout Soreness',
    short_description: '2g Thorne omega-3 daily for 12 weeks. Log soreness after each workout (1–10 scale). Supplements shipped to you. Exercise 2x/week minimum.',
    description: 'We\'re studying whether 2g of Thorne Research omega-3 fish oil daily reduces delayed onset muscle soreness (DOMS) in the 24–48 hours after strength training. Thorne\'s fish oil uses a triglyceride form for better absorption, with no fishy aftertaste. You\'ll take 2 capsules per day for 12 weeks and log your soreness after each workout using a simple 1–10 scale. Supplement packs are shipped to you. You need to exercise at least twice per week to qualify.',
    category: 'Nutrition',
    status: 'active' as const,
    bounty_per_participant: 50, total_bounty_pool: 10000,
    slots_total: 200, slots_filled: 200, duration_weeks: 12,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://discord.gg/vitadao',
    tests_needed: 'Post-workout soreness log (1–10, within 48hrs of each session). Weekly compliance check-in. Supplement photos at weeks 4, 8, 12 (to verify usage).',
    inclusion_criteria: 'Aged 18 or over\nStrength trains at least 2x per week\nNo current omega-3 or fish oil supplement\nNo seafood or fish allergy\nWorldwide — remote eligible',
    exclusion_criteria: 'Fish or shellfish allergy\nOn blood thinners or anticoagulant medication\nInflammatory bowel disease (Crohn\'s, UC)\nPregnant or breastfeeding',
    iec_approval: 'VitaDAO Ethics Review Board — Protocol VD-2025-OM3-002. Non-interventional supplement study. DeSci Foundation Ethics Panel oversight.',
  },
  {
    id: 'a1b2c3d4-0005-0005-0005-000000000005',
    experimenter_id: 'did:privy:seed-biohackers',
    title: 'Blue Light Glasses & Sleep',
    short_description: 'Wear blue light glasses for 2hr before bed for 30 days. Morning rest quality log. No wearable needed. Half of participants are in a control group.',
    description: 'Blue light glasses are everywhere — but do they actually improve sleep? We\'re running a 30-day randomised trial: half of participants wear blue light glasses for 2 hours before bed each night, the other half follow their normal routine. You log your sleep time and how rested you feel each morning in under 60 seconds. No wearable, no bloodwork, no supplement needed. Glasses are provided free if you\'re in the glasses group — you just pay postage.',
    category: 'Sleep',
    status: 'recruiting' as const,
    bounty_per_participant: 35, total_bounty_pool: 8750,
    slots_total: 250, slots_filled: 88, duration_weeks: 4,
    region: 'Remote', is_remote: true, is_verified: false, verification_level: 'none' as const,
    external_comms_url: 'https://t.me/biohackersdao',
    tests_needed: 'Nightly log: bedtime + screen time before bed (~30 seconds). Morning log: rest quality rating 1–10 and estimated sleep duration.',
    inclusion_criteria: 'Aged 18 or over\nUses a phone or screen in the 2 hours before bed most nights\nNo current diagnosed sleep disorder\nWilling to wear glasses for 2 hours if assigned to that group\nWorldwide — remote eligible',
    exclusion_criteria: 'Diagnosed sleep apnoea or insomnia requiring treatment\nAlready using blue light glasses consistently\nWorks night shift (outcomes would be confounded)',
    iec_approval: 'Self-reported observational study. No IEC required. Data anonymised and handled under GDPR. Control vs glasses group assignment is randomised at sign-up.',
  },
  {
    id: 'a1b2c3d4-0006-0006-0006-000000000006',
    experimenter_id: 'did:privy:seed-biohackers',
    title: '30-Day Cold Shower Challenge',
    short_description: '60-second cold shower every morning for 30 days. Fill in a 1-minute energy and mood log each day. No equipment needed.',
    description: 'One cold shower per morning (minimum 60 seconds) for 30 consecutive days. We track whether participants report changes in morning energy, alertness, and overall mood via a daily 1-minute log. No equipment, no supplements, no wearables needed. Open to healthy adults 18+. If you already take cold showers regularly, you\'re not eligible — we want to measure the change for people who don\'t currently do this.',
    category: 'Energy',
    status: 'recruiting' as const,
    bounty_per_participant: 20, total_bounty_pool: 12000,
    slots_total: 600, slots_filled: 143, duration_weeks: 4,
    region: 'Remote', is_remote: true, is_verified: false, verification_level: 'none' as const,
    external_comms_url: 'https://t.me/biohackersdao',
    tests_needed: 'Daily log after each shower: energy (1–5), mood (1–5), alertness (1–5), duration in seconds. Takes ~40 seconds. Missed days must be noted.',
    inclusion_criteria: 'Aged 18 or over\nHealthy adult with no cold water contraindications\nHas a shower at home that can run cold\nDoes NOT currently take cold showers regularly (less than 1x/week)',
    exclusion_criteria: 'Raynaud\'s disease or poor circulation\nHeart conditions or recent cardiac events\nPregnant\nRecent surgery or open wounds',
    iec_approval: 'Self-reported observational study. No IEC required. Open to healthy adults 18+. Participants self-certify health eligibility at sign-up.',
  },
  {
    id: 'a1b2c3d4-0007-0007-0007-000000000007',
    experimenter_id: 'did:privy:seed-stanford',
    title: '8-Hour Eating Window Trial',
    short_description: 'Eat all meals within an 8-hour window (e.g. 10am–6pm) for 10 weeks. Log meal timing, energy, weekly weight. No calorie counting.',
    description: 'We\'re studying what happens when people restrict eating to an 8-hour window (e.g. 10am–6pm) for 10 weeks. There are no calorie restrictions, no food rules — you eat whatever you like, just within the window. You track meal timing, energy levels, and weekly weight using your phone. A registered Stanford dietitian checks in with you at weeks 4 and 8. The study is Stanford IRB approved and the full dataset will be published openly.',
    category: 'Nutrition',
    status: 'active' as const,
    bounty_per_participant: 60, total_bounty_pool: 9000,
    slots_total: 150, slots_filled: 112, duration_weeks: 10,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://longevity.stanford.edu',
    tests_needed: 'Daily meal timing log (first bite and last bite times). Daily energy rating. Weekly weight (your own scale). Dietitian video check-in at weeks 4 and 8.',
    inclusion_criteria: 'Aged 18 or over\nCurrently eating across more than 10 hours per day on most days\nOwns a scale at home\nAble to attend 2 short video check-ins with a dietitian\nWorldwide — remote eligible',
    exclusion_criteria: 'Pregnant or breastfeeding\nDiagnosed eating disorder (now or in the past)\nType 1 diabetes or insulin-dependent Type 2 diabetes\nBMI under 18.5\nCurrently following any structured diet programme',
    iec_approval: 'Stanford IRB Approved — Protocol #STF-2025-TRF-018. Full ethics review on file. Dietitian-supervised. Open to international participants.',
  },
  {
    id: 'a1b2c3d4-0008-0008-0008-000000000008',
    experimenter_id: 'did:privy:seed-cerebrum',
    title: 'Meditation App vs. Journaling',
    short_description: '10 min daily of either guided meditation or written journaling for 8 weeks. Weekly stress and focus check-in. Study now closed — results published.',
    description: 'For 8 weeks, half of participants used the Waking Up meditation app for 10 minutes each morning; the other half kept a free-form written journal. We measured self-reported stress (PSS-4 scale), focus, and sleep quality at weeks 0, 4, and 8. Cerebrum DAO partnered with licensed psychologists to design the protocol. This study is now closed and results are published at cerebrumdao.xyz/studies/mind-001. All participants received their $45 reward within 72 hours of completion.',
    category: 'Focus',
    status: 'completed' as const,
    bounty_per_participant: 45, total_bounty_pool: 9000,
    slots_total: 200, slots_filled: 200, duration_weeks: 8,
    region: 'Remote', is_remote: true, is_verified: true, verification_level: 'biome' as const,
    external_comms_url: 'https://discord.gg/cerebrumdao',
    tests_needed: 'Weekly PSS-4 stress survey (4 questions, ~2 min). Weekly focus + sleep log. Compliance log: did you complete your 10-min session today (yes/no).',
    inclusion_criteria: 'Aged 18 or over\nSelf-reports moderate or high daily stress\nDoes NOT currently have a regular meditation practice (less than 1x/week)\nWilling to commit 10 minutes per day for 8 weeks',
    exclusion_criteria: 'Active therapy or treatment for anxiety or depression (to avoid interference)\nCurrent regular meditators (10+ min/day)\nSevere mental health conditions requiring clinical supervision',
    iec_approval: 'Cerebrum DAO Community Review Board — Protocol CD-2025-MIND-007. Mental health study reviewed and approved by two licensed clinical psychologists prior to launch.',
  },
];

// ─── Seeded comments ──────────────────────────────────────────────────────────

const COMMENTS = [
  // Experiment 1 — Magnesium & Sleep
  { id: 'c1000001-0000-0000-0000-000000000001', experiment_id: 'a1b2c3d4-0001-0001-0001-000000000001', author_id: 'did:privy:seed-user1', parent_id: null,                                    upvotes: 18, content: 'Started week 3. Definitely falling asleep faster — was taking 40–45 minutes before, now closer to 15. Not 100% sure if it\'s placebo but the log numbers are consistent.', created_at: '2026-03-10T21:00:00Z' },
  { id: 'c1000002-0000-0000-0000-000000000001', experiment_id: 'a1b2c3d4-0001-0001-0001-000000000001', author_id: 'did:privy:seed-user2', parent_id: null,                                    upvotes: 11, content: 'Any guidance on capsule timing? I\'ve been taking it 45 min before bed instead of 30 and it seems to help. Worth logging the actual time I take it?', created_at: '2026-03-11T20:30:00Z' },
  { id: 'c1000003-0000-0000-0000-000000000001', experiment_id: 'a1b2c3d4-0001-0001-0001-000000000001', author_id: 'did:privy:seed-user3', parent_id: 'c1000002-0000-0000-0000-000000000001', upvotes:  7, content: '@kelp.forest The kit instructions say 30 min is the target but the FAQ says ±15 min is fine. Log your actual time — the team asked us to be precise about it.',               created_at: '2026-03-12T08:15:00Z' },
  { id: 'c1000004-0000-0000-0000-000000000001', experiment_id: 'a1b2c3d4-0001-0001-0001-000000000001', author_id: 'did:privy:seed-user4', parent_id: null,                                    upvotes: 14, content: 'Week 6 done. Sleep quality scores are up on the survey. Still waking once at night but feel more rested in the morning overall. Curious to see the group results.',             created_at: '2026-03-13T07:45:00Z' },

  // Experiment 2 — No Coffee After Noon
  { id: 'c2000001-0000-0000-0000-000000000002', experiment_id: 'a1b2c3d4-0002-0002-0002-000000000002', author_id: 'did:privy:seed-user5', parent_id: null,                                    upvotes: 22, content: 'Day 3 headache was brutal. Day 5 was the worst. Day 8 I felt fine. If you\'re in week 1 just push through — it does get easier.',                                          created_at: '2026-03-09T16:00:00Z' },
  { id: 'c2000002-0000-0000-0000-000000000002', experiment_id: 'a1b2c3d4-0002-0002-0002-000000000002', author_id: 'did:privy:seed-user1', parent_id: null,                                    upvotes:  8, content: 'Switching to green tea only before noon instead of coffee — does that count as caffeine after noon if I have one cup at 11am? The form asks about "all caffeinated drinks".',   created_at: '2026-03-10T11:30:00Z' },
  { id: 'c2000003-0000-0000-0000-000000000002', experiment_id: 'a1b2c3d4-0002-0002-0002-000000000002', author_id: 'did:privy:seed-user2', parent_id: null,                                    upvotes: 19, content: 'Three weeks in and I\'m sleeping better than I have in years. Waking up without an alarm most days now. Can\'t tell if it\'s the caffeine cutoff or something else.',           created_at: '2026-03-12T08:00:00Z' },
  { id: 'c2000004-0000-0000-0000-000000000002', experiment_id: 'a1b2c3d4-0002-0002-0002-000000000002', author_id: 'did:privy:seed-user3', parent_id: null,                                    upvotes:  6, content: 'Quick question — does decaf count as cutting off caffeine? The form says "coffee" but decaf still has a small amount. Emailing the team but curious if others got guidance.', created_at: '2026-03-14T14:00:00Z' },

  // Experiment 3 — Post-Lunch Walk
  { id: 'c3000001-0000-0000-0000-000000000003', experiment_id: 'a1b2c3d4-0003-0003-0003-000000000003', author_id: 'did:privy:seed-user4', parent_id: null,                                    upvotes: 25, content: 'Week 2 done. The walk genuinely helps. I used to crash hard at 3pm every day — now it\'s much milder or just doesn\'t happen. Hard to believe such a tiny change works.',       created_at: '2026-03-08T14:30:00Z' },
  { id: 'c3000002-0000-0000-0000-000000000003', experiment_id: 'a1b2c3d4-0003-0003-0003-000000000003', author_id: 'did:privy:seed-user5', parent_id: null,                                    upvotes:  9, content: 'Does a covered outdoor carpark count as "outdoor"? I work in a building with no nearby green space, the closest outdoor area is a rooftop car park.',                          created_at: '2026-03-10T13:00:00Z' },
  { id: 'c3000003-0000-0000-0000-000000000003', experiment_id: 'a1b2c3d4-0003-0003-0003-000000000003', author_id: 'did:privy:seed-user1', parent_id: 'c3000002-0000-0000-0000-000000000003', upvotes:  5, content: '@txnull Emailed the team — they confirmed any outdoor space with daylight exposure counts. Rooftop carpark is fine.',                                                          created_at: '2026-03-11T09:20:00Z' },
  { id: 'c3000004-0000-0000-0000-000000000003', experiment_id: 'a1b2c3d4-0003-0003-0003-000000000003', author_id: 'did:privy:seed-user2', parent_id: null,                                    upvotes: 20, content: 'Favourite experiment I\'ve done on this platform. So simple, costs nothing, and it actually works. Week 4 and I\'m protective of my lunch walk time now.',                    created_at: '2026-03-13T12:45:00Z' },

  // Experiment 4 — Fish Oil & Soreness
  { id: 'c4000001-0000-0000-0000-000000000004', experiment_id: 'a1b2c3d4-0004-0004-0004-000000000004', author_id: 'did:privy:seed-user3', parent_id: null,                                    upvotes: 16, content: 'Week 4 done. Soreness after leg day is noticeably less — or at least it clears up faster. Hard to isolate from other variables but the trend is consistent.',               created_at: '2026-03-07T19:00:00Z' },
  { id: 'c4000002-0000-0000-0000-000000000004', experiment_id: 'a1b2c3d4-0004-0004-0004-000000000004', author_id: 'did:privy:seed-user4', parent_id: null,                                    upvotes: 13, content: 'The Thorne capsules are good quality — no fishy burps which I was worried about. Triglyceride form definitely makes a difference vs the cheaper stuff I\'ve tried before.', created_at: '2026-03-09T08:30:00Z' },
  { id: 'c4000003-0000-0000-0000-000000000004', experiment_id: 'a1b2c3d4-0004-0004-0004-000000000004', author_id: 'did:privy:seed-user5', parent_id: null,                                    upvotes:  8, content: 'FYI — the 2g dose is just 2 capsules from the kit. I was confused at first looking for a separate "2g" label. Each capsule is 1g omega-3.',                                   created_at: '2026-03-11T17:45:00Z' },
  { id: 'c4000004-0000-0000-0000-000000000004', experiment_id: 'a1b2c3d4-0004-0004-0004-000000000004', author_id: 'did:privy:seed-user1', parent_id: null,                                    upvotes: 11, content: 'Really hoping they share the full results report. Curious whether the effect is stronger in people who train 4x+ per week vs 2x.',                                          created_at: '2026-03-14T20:00:00Z' },

  // Experiment 5 — Blue Light Glasses
  { id: 'c5000001-0000-0000-0000-000000000005', experiment_id: 'a1b2c3d4-0005-0005-0005-000000000005', author_id: 'did:privy:seed-user2', parent_id: null,                                    upvotes: 10, content: 'I\'m in the glasses group. Week 2 and I genuinely can\'t tell if it\'s working or just placebo. The glasses look kind of cool though, I\'ll give them that.',               created_at: '2026-03-11T22:30:00Z' },
  { id: 'c5000002-0000-0000-0000-000000000005', experiment_id: 'a1b2c3d4-0005-0005-0005-000000000005', author_id: 'did:privy:seed-user3', parent_id: null,                                    upvotes:  7, content: 'Control group here. No change yet at week 2 but I wasn\'t expecting much this early. Curious to see if there\'s a meaningful difference at week 4.',                        created_at: '2026-03-12T21:00:00Z' },
  { id: 'c5000003-0000-0000-0000-000000000005', experiment_id: 'a1b2c3d4-0005-0005-0005-000000000005', author_id: 'did:privy:seed-user4', parent_id: null,                                    upvotes:  5, content: 'Do amber/orange-tinted glasses count or does it have to be the clear anti-reflective type?',                                                                              created_at: '2026-03-13T20:15:00Z' },
  { id: 'c5000004-0000-0000-0000-000000000005', experiment_id: 'a1b2c3d4-0005-0005-0005-000000000005', author_id: 'did:privy:seed-user5', parent_id: 'c5000003-0000-0000-0000-000000000005', upvotes:  4, content: '@SaraVHL The FAQ says any lens claiming blue light filtering is fine — including amber/orange tinted ones. Both are valid for the glasses group.',                          created_at: '2026-03-14T09:00:00Z' },

  // Experiment 6 — Cold Shower
  { id: 'c6000001-0000-0000-0000-000000000006', experiment_id: 'a1b2c3d4-0006-0006-0006-000000000006', author_id: 'did:privy:seed-user1', parent_id: null,                                    upvotes: 29, content: 'Day 3 was genuinely awful. Day 10 I actually looked forward to it. Day 20 I feel weird if I skip it. Just push through the first week.',                               created_at: '2026-03-06T07:30:00Z' },
  { id: 'c6000002-0000-0000-0000-000000000006', experiment_id: 'a1b2c3d4-0006-0006-0006-000000000006', author_id: 'did:privy:seed-user2', parent_id: null,                                    upvotes: 24, content: 'Doing this in winter in Scotland. The hot water runs out before I can switch cold. Send help.',                                                                            created_at: '2026-03-08T08:00:00Z' },
  { id: 'c6000003-0000-0000-0000-000000000006', experiment_id: 'a1b2c3d4-0006-0006-0006-000000000006', author_id: 'did:privy:seed-user3', parent_id: null,                                    upvotes: 12, content: 'The daily log is super quick — 40 seconds max. Lowest friction check-in I\'ve done in any experiment on this platform.',                                                  created_at: '2026-03-10T07:45:00Z' },
  { id: 'c6000004-0000-0000-0000-000000000006', experiment_id: 'a1b2c3d4-0006-0006-0006-000000000006', author_id: 'did:privy:seed-user4', parent_id: null,                                    upvotes: 17, content: 'Week 3 done. Morning energy is noticeably better — I used to need 2 cups of coffee before I felt functional. Now just 1 is enough.',                                      created_at: '2026-03-13T08:30:00Z' },
  { id: 'c6000005-0000-0000-0000-000000000006', experiment_id: 'a1b2c3d4-0006-0006-0006-000000000006', author_id: 'did:privy:seed-user5', parent_id: 'c6000002-0000-0000-0000-000000000006', upvotes: 15, content: '@kelp.forest respect.',                                                                                                                                              created_at: '2026-03-09T06:00:00Z' },

  // Experiment 7 — 8-Hour Eating Window
  { id: 'c7000001-0000-0000-0000-000000000007', experiment_id: 'a1b2c3d4-0007-0007-0007-000000000007', author_id: 'did:privy:seed-user4', parent_id: null,                                    upvotes: 21, content: 'Week 5. Weight hasn\'t shifted much but my energy is way more stable. No more hard crash at 4pm. That alone feels worth it.',                                            created_at: '2026-03-08T12:00:00Z' },
  { id: 'c7000002-0000-0000-0000-000000000007', experiment_id: 'a1b2c3d4-0007-0007-0007-000000000007', author_id: 'did:privy:seed-user1', parent_id: null,                                    upvotes: 16, content: 'The dietitian check-in at week 4 was actually really valuable. She flagged I wasn\'t eating enough at breakfast which explained why I felt terrible around noon.',          created_at: '2026-03-10T13:00:00Z' },
  { id: 'c7000003-0000-0000-0000-000000000007', experiment_id: 'a1b2c3d4-0007-0007-0007-000000000007', author_id: 'did:privy:seed-user2', parent_id: null,                                    upvotes:  9, content: 'Hardest part is social eating — family dinners often go past my 7pm window. I log it honestly. The team said occasional slippage is fine as long as it\'s logged.',          created_at: '2026-03-12T20:30:00Z' },
  { id: 'c7000004-0000-0000-0000-000000000007', experiment_id: 'a1b2c3d4-0007-0007-0007-000000000007', author_id: 'did:privy:seed-user5', parent_id: null,                                    upvotes:  8, content: 'Can plain black coffee and water be consumed outside the eating window? The protocol says "meals" but I want to check before I start.',                                    created_at: '2026-03-13T09:00:00Z' },
  { id: 'c7000005-0000-0000-0000-000000000007', experiment_id: 'a1b2c3d4-0007-0007-0007-000000000007', author_id: 'did:privy:seed-user3', parent_id: 'c7000004-0000-0000-0000-000000000007', upvotes:  6, content: '@txnull Yes — plain black coffee, tea, and water are fine outside the window. Only caloric intake counts. Confirmed this in the protocol doc (page 2).',                 created_at: '2026-03-13T11:45:00Z' },

  // Experiment 8 — Meditation vs Journaling (completed)
  { id: 'c8000001-0000-0000-0000-000000000008', experiment_id: 'a1b2c3d4-0008-0008-0008-000000000008', author_id: 'did:privy:seed-user1', parent_id: null,                                    upvotes: 33, content: 'Was in the journaling group. Honestly life-changing. I\'m still doing it 3 months after the study ended. Didn\'t expect a 10-minute habit to have that much impact.',    created_at: '2026-02-20T10:00:00Z' },
  { id: 'c8000002-0000-0000-0000-000000000008', experiment_id: 'a1b2c3d4-0008-0008-0008-000000000008', author_id: 'did:privy:seed-user2', parent_id: null,                                    upvotes: 28, content: 'Meditation group here. Stress down, sleep up, anxiety noticeably better. Waking Up is a great app — still have the subscription. Would join another Cerebrum DAO study.',  created_at: '2026-02-21T09:30:00Z' },
  { id: 'c8000003-0000-0000-0000-000000000008', experiment_id: 'a1b2c3d4-0008-0008-0008-000000000008', author_id: 'did:privy:seed-user3', parent_id: null,                                    upvotes: 15, content: 'Really hoping the published results show a breakdown by group. Curious whether meditation or journaling came out ahead, or if they were equivalent.',                        created_at: '2026-02-22T14:00:00Z' },
  { id: 'c8000004-0000-0000-0000-000000000008', experiment_id: 'a1b2c3d4-0008-0008-0008-000000000008', author_id: 'did:privy:seed-user4', parent_id: null,                                    upvotes: 22, content: 'Got my $45 payout within 72 hours of submitting the final survey. Smoothest payout process I\'ve had on any research platform.',                                          created_at: '2026-02-23T11:00:00Z' },
  { id: 'c8000005-0000-0000-0000-000000000008', experiment_id: 'a1b2c3d4-0008-0008-0008-000000000008', author_id: 'did:privy:seed-user5', parent_id: null,                                    upvotes: 12, content: 'The PSS-4 questionnaire at week 8 was eye-opening — I hadn\'t realised how much my stress had come down since week 0. The numbers were quite different.',                  created_at: '2026-02-24T16:30:00Z' },
];

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-seed-secret');
  if (!SEED_SECRET || secret !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { error: expErr } = await supabase
    .from('profiles')
    .upsert([...EXPERIMENTER_PROFILES, ...PARTICIPANT_PROFILES], { onConflict: 'id' });
  if (expErr) return NextResponse.json({ error: `profiles: ${expErr.message}` }, { status: 500 });

  const { error: expErrExp } = await supabase
    .from('experiments')
    .upsert(EXPERIMENTS, { onConflict: 'id' });
  if (expErrExp) return NextResponse.json({ error: `experiments: ${expErrExp.message}` }, { status: 500 });

  const { error: commentErr } = await supabase
    .from('comments')
    .upsert(COMMENTS, { onConflict: 'id' });
  if (commentErr) return NextResponse.json({ error: `comments: ${commentErr.message}` }, { status: 500 });

  return NextResponse.json({
    ok: true,
    profiles: EXPERIMENTER_PROFILES.length + PARTICIPANT_PROFILES.length,
    experiments: EXPERIMENTS.length,
    comments: COMMENTS.length,
  });
}

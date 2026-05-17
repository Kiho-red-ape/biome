-- Migration 021: Blog post content structure + demo accounts

-- ── Blog: add hook, artifact fields ─────────────────────────────────────────
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS hook          text,
  ADD COLUMN IF NOT EXISTS artifact_url  text,
  ADD COLUMN IF NOT EXISTS artifact_label text DEFAULT 'Download worksheet';

-- ── Demo seed accounts ────────────────────────────────────────────────────────
-- These use placeholder Privy-style IDs. When a real user logs in with the
-- corresponding email, run /api/ops/seed-demo to relink the profile to their
-- actual Privy DID.

-- Researcher demo profile (researcher@biome.to)
INSERT INTO profiles (id, auth_type, email, role, region, created_at)
VALUES (
  'demo:researcher',
  'email',
  'researcher@biome.to',
  'experimenter',
  'Global / Remote',
  now()
) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO experimenter_profiles (user_id, org_name, org_description, role_title, expertise_areas, review_status)
VALUES (
  'demo:researcher',
  'Biome Demo Lab',
  'A demonstration research organization running decentralised microbiome studies.',
  'Principal Investigator',
  ARRAY['Microbiome', 'Nutrition', 'Longevity'],
  'active'
) ON CONFLICT (user_id) DO UPDATE
  SET org_name = EXCLUDED.org_name, review_status = EXCLUDED.review_status;

-- Participant demo profile (participant@biome.to)
INSERT INTO profiles (id, auth_type, email, role, region, created_at)
VALUES (
  'demo:participant',
  'email',
  'participant@biome.to',
  'participant',
  'United Kingdom',
  now()
) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO participant_profiles (
  user_id, pseudonym, verification_status, onboarding_step,
  previous_study_count, reliability_score
)
VALUES (
  'demo:participant',
  'PART-DEMO',
  'basic_verified',
  4,
  0,
  1.0
) ON CONFLICT (user_id) DO UPDATE
  SET pseudonym = EXCLUDED.pseudonym, verification_status = EXCLUDED.verification_status;

-- Partner/experimenter demo profile (partner@biome.to)
INSERT INTO profiles (id, auth_type, email, role, region, created_at)
VALUES (
  'demo:partner',
  'email',
  'partner@biome.to',
  'experimenter',
  'United States',
  now()
) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

INSERT INTO experimenter_profiles (user_id, org_name, org_description, role_title, expertise_areas, review_status)
VALUES (
  'demo:partner',
  'Wellness Research Partners',
  'A partner organization showcasing the researcher side of Biome.',
  'Head of Research',
  ARRAY['Wearables', 'Cognitive', 'Behavioral'],
  'active'
) ON CONFLICT (user_id) DO UPDATE
  SET org_name = EXCLUDED.org_name, review_status = EXCLUDED.review_status;

-- ── Demo study (owned by researcher@biome.to) ─────────────────────────────────
INSERT INTO experiments (
  id, experimenter_id, title, description, category, study_type,
  status, bounty_per_participant, total_bounty_pool, slots_total, slots_filled,
  duration_weeks, region, is_remote, is_verified, verification_level,
  task_summary, approval_status,
  compliance_threshold, created_at, updated_at
)
VALUES (
  'demo-exp-0001-0000-0000-000000000001',
  'demo:researcher',
  'Gut Microbiome & Diet Correlation Study',
  E'This 8-week observational study investigates the relationship between daily diet patterns and gut microbiome diversity in healthy adults.\n\nParticipants complete weekly food journals and submit stool samples at weeks 2, 4, and 8. All sample collection kits are shipped directly to participants.\n\nYou will receive:\n— A stool collection kit (OmniGene-Gut) shipped to your door\n— Detailed instructions for each milestone\n— Your personalised microbiome diversity report at study end\n— Compensation of $120 on verified completion',
  'Microbiome',
  'Observational',
  'active',
  120,
  6000,
  50,
  1,
  8,
  'Remote / Global',
  true,
  true,
  'biome',
  'Weekly food journal + stool sample × 3',
  'Ethics approved',
  80,
  now() - interval '14 days',
  now()
) ON CONFLICT (id) DO UPDATE
  SET status = 'active', slots_filled = 1;

-- Study milestones for demo experiment
INSERT INTO study_milestones (experiment_id, week_number, title, description, milestone_type)
SELECT
  'demo-exp-0001-0000-0000-000000000001',
  w.week_number,
  w.title,
  w.description,
  w.milestone_type::text
FROM (VALUES
  (1, 'Baseline food journal',      'Record everything you eat and drink for 7 days using the provided template.', 'self_report'),
  (2, 'Week 2 stool sample',        'Collect your first stool sample using the OmniGene-Gut kit and return via prepaid shipping.', 'self_report'),
  (3, 'Mid-study food journal',     'Continue recording your diet for 7 days. Note any changes from baseline.', 'self_report'),
  (4, 'Week 4 stool sample',        'Collect your second stool sample and return it via prepaid shipping.', 'self_report'),
  (6, 'Dietary habits survey',      'Complete the 15-minute dietary habits and lifestyle questionnaire.', 'self_report'),
  (8, 'Final stool sample',         'Collect your final stool sample and return it via prepaid shipping.', 'self_report'),
  (8, 'Completion survey',          'Complete the 10-minute end-of-study feedback survey.', 'self_report')
) AS w(week_number, title, description, milestone_type)
WHERE NOT EXISTS (
  SELECT 1 FROM study_milestones
  WHERE experiment_id = 'demo-exp-0001-0000-0000-000000000001'
);

-- Demo application (participant@biome.to enrolled in the demo study)
INSERT INTO applications (
  experiment_id, participant_id, status, applied_at, approved_at
)
VALUES (
  'demo-exp-0001-0000-0000-000000000001',
  'demo:participant',
  'approved',
  now() - interval '12 days',
  now() - interval '11 days'
) ON CONFLICT DO NOTHING;

-- Participant milestones for the demo application
INSERT INTO participant_milestones (
  experiment_id, participant_id, week_number, title, description,
  milestone_type, status, due_date
)
SELECT
  sm.experiment_id,
  'demo:participant',
  sm.week_number,
  sm.title,
  sm.description,
  sm.milestone_type,
  CASE
    WHEN sm.week_number <= 2 THEN 'verified'
    WHEN sm.week_number = 3 THEN 'submitted'
    ELSE 'pending'
  END,
  now() - interval '14 days' + (sm.week_number * interval '7 days')
FROM study_milestones sm
WHERE sm.experiment_id = 'demo-exp-0001-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- Migration 022: Fix demo seed data (corrects bugs in 021)
-- Fully defensive: adds missing columns and creates missing tables before seeding.

-- ── 1. Schema repairs ─────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE experimenter_profiles
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'active'
    CHECK (review_status IN ('pending_review', 'active', 'rejected'));

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS task_summary         text,
  ADD COLUMN IF NOT EXISTS commenced            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS compliance_threshold integer NOT NULL DEFAULT 80;

CREATE TABLE IF NOT EXISTS study_milestones (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id  uuid        NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  week_number    integer     NOT NULL CHECK (week_number >= 1),
  title          text        NOT NULL,
  description    text,
  milestone_type text        NOT NULL DEFAULT 'self_report'
                             CHECK (milestone_type IN ('self_report','experimenter_confirm')),
  sort_order     integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE participant_milestones
  ADD COLUMN IF NOT EXISTS application_id uuid;

CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL,
  type       text        NOT NULL,
  payload    jsonb       NOT NULL DEFAULT '{}',
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Clean up broken seed data ─────────────────────────────────────────────

DELETE FROM applications
  WHERE experiment_id IN (
    SELECT id FROM experiments WHERE experimenter_id = 'demo:researcher'
  );
DELETE FROM experiments WHERE experimenter_id = 'demo:researcher';
DELETE FROM experimenter_profiles WHERE user_id IN ('demo:researcher', 'demo:partner');
DELETE FROM participant_profiles WHERE user_id = 'demo:participant';
DELETE FROM profiles WHERE id IN ('demo:researcher', 'demo:participant', 'demo:partner');

-- ── 3. Profiles ───────────────────────────────────────────────────────────────

INSERT INTO profiles (id, auth_type, email, role, region, created_at) VALUES
  ('demo:researcher', 'email', 'researcher@biome.to', 'experimenter', 'Global / Remote', now() - interval '30 days'),
  ('demo:participant', 'email', 'participant@biome.to', 'participant',  'United Kingdom',  now() - interval '25 days'),
  ('demo:partner',    'email', 'partner@biome.to',    'experimenter', 'United States',   now() - interval '20 days')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role;

-- ── 4. Experimenter profiles ──────────────────────────────────────────────────

INSERT INTO experimenter_profiles (user_id, org_name, org_description, role_title, expertise_areas, review_status)
VALUES
  ('demo:researcher', 'Biome Demo Lab',
   'A demonstration research organization running decentralised microbiome and nutrition studies.',
   'Principal Investigator', ARRAY['Microbiome','Nutrition','Longevity'], 'active'),
  ('demo:partner', 'Wellness Research Partners',
   'A specialist CRO offering participant recruitment and compliance tracking for wellness studies.',
   'Head of Research', ARRAY['Wearables','Cognitive','Behavioral'], 'active')
ON CONFLICT (user_id) DO UPDATE
  SET org_name        = EXCLUDED.org_name,
      org_description = EXCLUDED.org_description,
      review_status   = EXCLUDED.review_status;

-- ── 5. Participant profile ────────────────────────────────────────────────────

INSERT INTO participant_profiles (
  user_id, country, email_verified, phone_verified,
  verification_status, onboarding_step, previous_study_count, reliability_score
) VALUES (
  'demo:participant', 'United Kingdom', true, false,
  'email_verified', 4, 2, 0.92
) ON CONFLICT (user_id) DO UPDATE
  SET country              = EXCLUDED.country,
      email_verified       = EXCLUDED.email_verified,
      verification_status  = EXCLUDED.verification_status,
      previous_study_count = EXCLUDED.previous_study_count,
      reliability_score    = EXCLUDED.reliability_score;

-- ── 6. Demo experiment ────────────────────────────────────────────────────────

INSERT INTO experiments (
  id, experimenter_id, title, description, category,
  status, bounty_per_participant, total_bounty_pool, slots_total, slots_filled,
  duration_weeks, region, is_remote, is_verified, verification_level,
  task_summary, commenced, compliance_threshold, created_at, updated_at
) VALUES (
  '00000000-0001-0000-0000-000000000001',
  'demo:researcher',
  'Gut Microbiome & Diet Correlation Study',
  E'This 8-week observational study investigates the relationship between daily diet patterns and gut microbiome diversity in healthy adults.\n\nParticipants complete weekly food journals and submit stool samples at weeks 2, 4, and 8. All sample collection kits are shipped directly to participants.\n\nYou will receive:\n— A stool collection kit (OmniGene-Gut) shipped to your door\n— Detailed instructions for each milestone\n— Your personalised microbiome diversity report at study end\n— Compensation of $120 on verified completion',
  'Microbiome',
  'active', 120, 6000, 50, 1, 8,
  'Remote / Global', true, true, 'biome',
  'Weekly food journal + stool sample × 3',
  true, 80,
  now() - interval '14 days', now()
) ON CONFLICT (id) DO UPDATE
  SET status       = 'active',
      slots_filled = 1,
      commenced    = true;

-- ── 7. Study milestones ───────────────────────────────────────────────────────

INSERT INTO study_milestones (experiment_id, week_number, title, description, milestone_type, sort_order)
VALUES
  ('00000000-0001-0000-0000-000000000001', 1, 'Baseline food journal',   'Record everything you eat and drink for 7 days using the provided template.', 'self_report', 1),
  ('00000000-0001-0000-0000-000000000001', 2, 'Week 2 stool sample',    'Collect your first stool sample using the OmniGene-Gut kit and return via prepaid shipping.', 'self_report', 2),
  ('00000000-0001-0000-0000-000000000001', 3, 'Mid-study food journal',  'Continue recording your diet for 7 days. Note any changes from baseline.', 'self_report', 3),
  ('00000000-0001-0000-0000-000000000001', 4, 'Week 4 stool sample',    'Collect your second stool sample and return it via prepaid shipping.', 'self_report', 4),
  ('00000000-0001-0000-0000-000000000001', 6, 'Dietary habits survey',   'Complete the 15-minute dietary habits and lifestyle questionnaire.', 'self_report', 5),
  ('00000000-0001-0000-0000-000000000001', 8, 'Final stool sample',      'Collect your final stool sample and return it via prepaid shipping.', 'self_report', 6),
  ('00000000-0001-0000-0000-000000000001', 8, 'Completion survey',       'Complete the 10-minute end-of-study feedback survey.', 'self_report', 7)
ON CONFLICT DO NOTHING;

-- ── 8. Demo application ───────────────────────────────────────────────────────

INSERT INTO applications (experiment_id, participant_id, status, applied_at, approved_at)
VALUES (
  '00000000-0001-0000-0000-000000000001',
  'demo:participant',
  'approved',
  now() - interval '12 days',
  now() - interval '11 days'
) ON CONFLICT (experiment_id, participant_id) DO NOTHING;

-- ── 9. Participant milestones ─────────────────────────────────────────────────
-- Columns confirmed from live DB error rows: application_id, study_milestone_id, status, due_date

INSERT INTO participant_milestones (application_id, study_milestone_id, status, due_date)
SELECT
  a.id,
  sm.id,
  CASE
    WHEN sm.week_number <= 2 THEN 'verified'
    WHEN sm.week_number = 3 THEN 'submitted'
    ELSE 'pending'
  END,
  -- due_date = study start (14 days ago) + milestone week
  (now() - interval '14 days' + (sm.week_number * interval '7 days'))::date
FROM study_milestones sm
JOIN applications a
  ON a.experiment_id = sm.experiment_id
 AND a.participant_id = 'demo:participant'
WHERE sm.experiment_id = '00000000-0001-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- ── 10. Welcome notifications ─────────────────────────────────────────────────
-- Skipped: live notifications table has a different schema from migration 008.
-- Notifications can be sent manually from /ops/notifications once seed is applied.

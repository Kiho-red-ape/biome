-- Migration 020: Schema hygiene re-confirmation + full seed data cleanup
-- All schema changes are idempotent (IF NOT EXISTS / IF EXISTS).

-- ── Re-confirm migration 018 schema changes (idempotent) ─────────────────────

ALTER TABLE experimenter_profiles
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'active'
    CHECK (review_status IN ('pending_review', 'active', 'rejected'));

CREATE TABLE IF NOT EXISTS notification_preferences (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      text        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email        text        NOT NULL,
  study_alerts boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notification_preferences: public read"  ON notification_preferences;
DROP POLICY IF EXISTS "notification_preferences: service role write" ON notification_preferences;

CREATE POLICY "notification_preferences: public read"
  ON notification_preferences FOR SELECT USING (true);

CREATE POLICY "notification_preferences: service role write"
  ON notification_preferences FOR ALL USING (true);

ALTER TABLE participant_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id          text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false;

ALTER TABLE participant_profiles
  DROP COLUMN IF EXISTS trolley_recipient_id,
  DROP COLUMN IF EXISTS payout_method_type,
  DROP COLUMN IF EXISTS payout_method_configured;

DROP INDEX IF EXISTS idx_participant_trolley;

-- ── Full seed data cleanup — delete all experiments and child records ──────────

DELETE FROM dispute_messages
  WHERE dispute_id IN (
    SELECT id FROM disputes
      WHERE experiment_id IN (SELECT id FROM experiments)
  );

DELETE FROM disputes
  WHERE experiment_id IN (SELECT id FROM experiments);

DELETE FROM notifications
  WHERE experiment_id IN (SELECT id FROM experiments);

DELETE FROM eligibility_responses
  WHERE question_id IN (
    SELECT id FROM eligibility_questions
      WHERE experiment_id IN (SELECT id FROM experiments)
  );

DELETE FROM eligibility_questions
  WHERE experiment_id IN (SELECT id FROM experiments);

DELETE FROM comments
  WHERE experiment_id IN (SELECT id FROM experiments);

DELETE FROM experiment_updates
  WHERE experiment_id IN (SELECT id FROM experiments);

DELETE FROM participant_milestones
  WHERE experiment_id IN (SELECT id FROM experiments);

DELETE FROM study_milestones
  WHERE experiment_id IN (SELECT id FROM experiments);

DELETE FROM sample_kits
  WHERE experiment_id IN (SELECT id FROM experiments);

DELETE FROM applications
  WHERE experiment_id IN (SELECT id FROM experiments);

DELETE FROM experiments;

-- ── Clean up orphaned profiles ─────────────────────────────────────────────────

DELETE FROM participant_profiles
  WHERE user_id NOT IN (SELECT id FROM profiles);

DELETE FROM experimenter_profiles
  WHERE user_id NOT IN (SELECT id FROM profiles);

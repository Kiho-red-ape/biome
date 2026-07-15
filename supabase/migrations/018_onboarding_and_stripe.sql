-- Migration 018: Onboarding split + Trolley → Stripe column migration

-- ── SECTION 1: Experimenter account review flow ──────────────────────────────
ALTER TABLE experimenter_profiles
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'active'
    CHECK (review_status IN ('pending_review', 'active', 'rejected'));

-- ── SECTION 1: Participant study-alert subscriptions ─────────────────────────
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

-- ── SECTION 2: Replace Trolley columns with Stripe on participant_profiles ────
ALTER TABLE participant_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id          text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false;

ALTER TABLE participant_profiles
  DROP COLUMN IF EXISTS trolley_recipient_id,
  DROP COLUMN IF EXISTS payout_method_type,
  DROP COLUMN IF EXISTS payout_method_configured;

DROP INDEX IF EXISTS idx_participant_trolley;

-- ============================================================
-- BIOME — Migration 008: Milestones, Notifications, Commencement
-- Adds study milestone infrastructure and commencement fields.
--
-- New tables:
--   study_milestones       — milestone definitions per experiment week
--   participant_milestones — per-participant milestone tracking
--   notifications          — in-app notification feed
--
-- New experiment columns:
--   commenced              — boolean flag set by experimenter to start study
--   commenced_at           — auto-set timestamp when commenced = true
--   compliance_threshold   — minimum % to be payout-eligible (default 80)
--   enrollment_url         — external onboarding link (Typeform etc.)
--
-- DB trigger: when commenced flips to true, sets commenced_at = now()
--   and experiment status = 'active'
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Experiment commencement fields ───────────────────────────────────────────

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS commenced           boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS commenced_at        timestamptz,
  ADD COLUMN IF NOT EXISTS compliance_threshold integer   NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS enrollment_url      text;

-- ── study_milestones ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_milestones (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id  uuid         NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  week_number    integer      NOT NULL CHECK (week_number >= 1),
  title          text         NOT NULL,
  description    text,
  milestone_type text         NOT NULL DEFAULT 'self_report'
                              CHECK (milestone_type IN ('self_report', 'experimenter_confirm')),
  sort_order     integer      NOT NULL DEFAULT 0,
  created_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_milestones_experiment
  ON study_milestones(experiment_id);

-- ── participant_milestones ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS participant_milestones (
  id                 uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id      uuid         NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  participant_id     text         NOT NULL,  -- privy DID
  study_milestone_id uuid         NOT NULL REFERENCES study_milestones(id) ON DELETE CASCADE,
  status             text         NOT NULL DEFAULT 'pending'
                                  CHECK (status IN (
                                    'pending', 'submitted', 'completed',
                                    'verified', 'rejected', 'missed', 'excused'
                                  )),
  completed_at       timestamptz,
  submitted_at       timestamptz,
  created_at         timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (study_milestone_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_participant_milestones_participant
  ON participant_milestones(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_milestones_experiment
  ON participant_milestones(experiment_id);

-- ── notifications ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text         NOT NULL,  -- privy DID
  type        text         NOT NULL,
  payload     jsonb        NOT NULL DEFAULT '{}'::jsonb,
  read        boolean      NOT NULL DEFAULT false,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, read, created_at DESC);

-- ── Trigger: auto-set commenced_at when commenced flips to true ───────────────

CREATE OR REPLACE FUNCTION handle_experiment_commence()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.commenced = true AND (OLD.commenced = false OR OLD.commenced IS NULL) THEN
    NEW.commenced_at = now();
    NEW.status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_experiment_commence ON experiments;
CREATE TRIGGER on_experiment_commence
  BEFORE UPDATE ON experiments
  FOR EACH ROW EXECUTE FUNCTION handle_experiment_commence();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE study_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- study_milestones: public read, experimenter write
CREATE POLICY IF NOT EXISTS "study_milestones_public_read"
  ON study_milestones FOR SELECT USING (true);

-- participant_milestones: participant sees own, experimenter sees all for their experiment
CREATE POLICY IF NOT EXISTS "pm_own_read"
  ON participant_milestones FOR SELECT USING (true);

-- notifications: user sees own
CREATE POLICY IF NOT EXISTS "notif_own_read"
  ON notifications FOR SELECT USING (true);

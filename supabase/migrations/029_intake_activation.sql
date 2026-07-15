-- ================================================================
-- MIGRATION 029 — Intake Activation
-- Bridges the client-intake pipeline to real studies.
-- When an operator "activates" a qualified lead, a draft experiment
-- and a client experimenter profile are created, and the intake is
-- linked to both. Idempotent: safe to re-run.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

BEGIN;

ALTER TABLE client_intakes
  ADD COLUMN IF NOT EXISTS converted_experiment_id uuid
    REFERENCES experiments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted_profile_id    text
    REFERENCES profiles(id)    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS activated_at            timestamptz,
  ADD COLUMN IF NOT EXISTS activated_by            text;

CREATE INDEX IF NOT EXISTS idx_intakes_converted_exp
  ON client_intakes(converted_experiment_id);

COMMIT;

-- ================================================================
-- END MIGRATION 029 — Intake Activation
-- ================================================================

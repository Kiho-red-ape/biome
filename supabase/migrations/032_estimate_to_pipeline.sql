-- ================================================================
-- MIGRATION 032 — Estimate lead → pipeline link
-- Lets an operator promote an estimate lead into a client_intake
-- (the pipeline), tracked so it isn't duplicated.
-- ================================================================

BEGIN;

ALTER TABLE estimate_leads
  ADD COLUMN IF NOT EXISTS converted_intake_id uuid
    REFERENCES client_intakes(id) ON DELETE SET NULL;

COMMIT;

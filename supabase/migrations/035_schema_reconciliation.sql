-- ================================================================
-- MIGRATION 035 — Schema reconciliation (fixes "ops is cosmetic")
-- The live DB drifted from the canonical schema:
--   1. notifications lacked payload (created pre-008; IF NOT EXISTS
--      skipped it) → every notification insert failed
--   2. estimate_leads.converted_intake_id may be missing (032)
--   3. Three FKs to experiments had no ON DELETE action → org/study
--      removal was blocked by RESTRICT
-- Idempotent + atomic. Run in Supabase SQL editor.
-- ================================================================

BEGIN;

-- ── 1. notifications: guarantee the columns the app writes ──────
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS payload    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS type       text        NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS read       boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, read, created_at DESC);

-- ── 2. estimate_leads → pipeline link (032, re-applied safely) ───
ALTER TABLE estimate_leads
  ADD COLUMN IF NOT EXISTS converted_intake_id uuid
    REFERENCES client_intakes(id) ON DELETE SET NULL;

-- ── 3. Deletion-blocking FKs → proper ON DELETE actions ─────────
-- Helper pattern: find the FK constraint on (table, column) → drop →
-- recreate with the right action. Wrapped so re-runs are safe.

DO $$
DECLARE cname text;
BEGIN
  -- sample_kits.experiment_id → CASCADE (kits die with their study)
  SELECT tc.constraint_name INTO cname
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
  WHERE tc.table_name = 'sample_kits' AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'experiment_id' LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE sample_kits DROP CONSTRAINT %I', cname);
  END IF;
  ALTER TABLE sample_kits
    ADD CONSTRAINT sample_kits_experiment_id_fkey
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE;

  -- sample_kits.application_id → CASCADE
  SELECT tc.constraint_name INTO cname
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
  WHERE tc.table_name = 'sample_kits' AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'application_id' LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE sample_kits DROP CONSTRAINT %I', cname);
  END IF;
  ALTER TABLE sample_kits
    ADD CONSTRAINT sample_kits_application_id_fkey
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

  -- consent_records.experiment_id → CASCADE (ops refuses to delete
  -- live/completed studies at the API layer, so only test data cascades)
  SELECT tc.constraint_name INTO cname
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
  WHERE tc.table_name = 'consent_records' AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'experiment_id' LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE consent_records DROP CONSTRAINT %I', cname);
  END IF;
  ALTER TABLE consent_records
    ADD CONSTRAINT consent_records_experiment_id_fkey
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE;

  -- agent_conversations.experiment_id → SET NULL (keep the conversation)
  SELECT tc.constraint_name INTO cname
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
  WHERE tc.table_name = 'agent_conversations' AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'experiment_id' LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE agent_conversations DROP CONSTRAINT %I', cname);
  END IF;
  ALTER TABLE agent_conversations
    ADD CONSTRAINT agent_conversations_experiment_id_fkey
    FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE SET NULL;
END;
$$;

COMMIT;

-- Refresh PostgREST's schema cache so the API sees the new columns
-- immediately (otherwise it can lag until the next reload).
NOTIFY pgrst, 'reload schema';

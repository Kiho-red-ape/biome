-- ================================================================
-- MIGRATION 036 — experimenter_profiles reconciliation
-- Same drift class as 035: if the live experimenter_profiles table
-- is missing later-added columns (free_study_used from 012,
-- review_status from 018, …), every org read 500s → the org seems
-- to "not exist" even though the row is there.
-- Idempotent. Run in Supabase SQL editor.
-- ================================================================

BEGIN;

ALTER TABLE experimenter_profiles
  ADD COLUMN IF NOT EXISTS org_website          text,
  ADD COLUMN IF NOT EXISTS org_description      text,
  ADD COLUMN IF NOT EXISTS role_title           text,
  ADD COLUMN IF NOT EXISTS expertise_areas      text[],
  ADD COLUMN IF NOT EXISTS screening_status     text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS screened_at          timestamptz,
  ADD COLUMN IF NOT EXISTS screened_by          text,
  ADD COLUMN IF NOT EXISTS experiments_posted   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_experiments integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_study_used      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_status        text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS created_at           timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at           timestamptz NOT NULL DEFAULT now();

-- Base account email (015/022) — used for invites and approval notices.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text;

COMMIT;

-- Make PostgREST see the columns immediately.
NOTIFY pgrst, 'reload schema';

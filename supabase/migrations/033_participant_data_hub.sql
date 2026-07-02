-- ================================================================
-- MIGRATION 033 — Participant Data Hub + Engagement
-- Ongoing data contribution (longitudinal metadata sync + health
-- report uploads) with a granular, withdrawable consent ledger —
-- purpose-limited and pseudonymised (GDPR / DPDPA aligned) — plus
-- a nudge throttle for sign-in engagement.
-- Idempotent + atomic. Run in Supabase SQL editor.
--
-- BEFORE/AFTER RUNNING: create the private Storage bucket
--   Name: health-reports   · Public: NO (signed URLs only)
--   Allowed types: application/pdf, image/jpeg, image/png
-- ================================================================

BEGIN;

-- ── 1. Granular consent ledger (the legal backbone) ─────────────
-- One row per participant per scope per version. Withdrawal is a
-- timestamp, never a delete — full audit trail.

CREATE TABLE IF NOT EXISTS data_consents (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id    text        NOT NULL,
  scope             text        NOT NULL CHECK (scope IN (
    'metadata_sync',          -- device/lifestyle metrics into the longitudinal record
    'health_reports',         -- uploaded medical documents
    'digital_twin_research'   -- pseudonymised use for research matching/insights
  )),
  granted           boolean     NOT NULL DEFAULT true,
  consent_version   text        NOT NULL DEFAULT 'v1',
  consent_text_hash text,
  granted_at        timestamptz DEFAULT now(),
  withdrawn_at      timestamptz,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (participant_id, scope, consent_version)
);

CREATE INDEX IF NOT EXISTS idx_consents_participant ON data_consents(participant_id);

-- ── 2. Longitudinal metadata snapshots (digital-twin timeline) ───
-- Every sync appends a snapshot; never overwritten.

CREATE TABLE IF NOT EXISTS health_data_snapshots (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id text        NOT NULL,
  source         text        NOT NULL DEFAULT 'manual' CHECK (source IN (
    'manual','apple_health','google_fit','fitbit','garmin','whoop','oura','other'
  )),
  captured_at    timestamptz NOT NULL DEFAULT now(),
  metrics        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  -- e.g. { sleep_hours, steps_daily_avg, resting_hr, hrv_ms, weight_kg,
  --        height_cm, blood_pressure, glucose_mgdl, notes }
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_participant
  ON health_data_snapshots(participant_id, captured_at DESC);

-- ── 3. Uploaded health reports (private bucket, soft delete) ─────

CREATE TABLE IF NOT EXISTS health_reports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id  text        NOT NULL,
  title           text        NOT NULL,
  report_type     text        NOT NULL DEFAULT 'other' CHECK (report_type IN (
    'lab_panel','imaging','genetic','prescription','discharge_summary','vaccination','other'
  )),
  report_date     date,
  file_path       text,     -- health-reports/{participant_id}/{uuid}.{ext}
  file_name       text,
  mime_type       text,
  file_size_bytes integer,
  notes           text,
  deleted_at      timestamptz,   -- right-to-delete: soft delete + storage removal
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_participant
  ON health_reports(participant_id) WHERE deleted_at IS NULL;

-- ── 4. Engagement nudge throttle ─────────────────────────────────

ALTER TABLE participant_profiles
  ADD COLUMN IF NOT EXISTS last_nudged_at timestamptz;

-- ── 5. RLS — service-role only (all access via server APIs) ──────

ALTER TABLE data_consents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_data_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "data_consents_deny"    ON data_consents;
DROP POLICY IF EXISTS "health_snapshots_deny" ON health_data_snapshots;
DROP POLICY IF EXISTS "health_reports_deny"   ON health_reports;

CREATE POLICY "data_consents_deny"    ON data_consents         USING (false);
CREATE POLICY "health_snapshots_deny" ON health_data_snapshots USING (false);
CREATE POLICY "health_reports_deny"   ON health_reports        USING (false);

COMMIT;

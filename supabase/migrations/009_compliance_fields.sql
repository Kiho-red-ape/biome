-- ============================================================
-- BIOME — Migration 009: Compliance Tracking Fields
-- Adds experimenter-side compliance management columns.
--
-- participant_milestones:
--   verified_at       — when experimenter verified the milestone
--   verified_by       — privy DID of the verifying experimenter
--   rejection_reason  — reason if milestone was rejected
--
-- applications:
--   violation_flagged  — experimenter flagged a compliance violation
--   violation_reason   — reason for flag
--   override_requested — experimenter manually overrides compliance gate
--   override_reason    — reason for override
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TABLE participant_milestones
  ADD COLUMN IF NOT EXISTS verified_at      timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by      text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS violation_flagged  boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS violation_reason   text,
  ADD COLUMN IF NOT EXISTS override_requested boolean  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS override_reason    text;

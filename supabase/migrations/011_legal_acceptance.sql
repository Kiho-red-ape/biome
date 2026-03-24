-- Migration 011: Legal acceptance tracking columns
-- Tracks when users accepted each legal document

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tos_accepted_at               timestamptz,
  ADD COLUMN IF NOT EXISTS study_agreement_accepted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS experimenter_agreement_accepted_at timestamptz;

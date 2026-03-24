-- Migration 012: Business model — activation fees + legal versioning

-- ── Experimenter profiles ──────────────────────────────────────────────────
ALTER TABLE experimenter_profiles
  ADD COLUMN IF NOT EXISTS studies_activated  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_study_used    boolean NOT NULL DEFAULT false;

-- ── Experiments ────────────────────────────────────────────────────────────
ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS activation_fee_status text NOT NULL DEFAULT 'not_required'
    CHECK (activation_fee_status IN ('not_required','free_tier','pending_payment','paid')),
  ADD COLUMN IF NOT EXISTS experimenter_agreement_accepted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS experimenter_agreement_version      text;

-- ── Profiles (ToS versioning) ──────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tos_version text;

-- ── Applications (participant agreement versioning) ────────────────────────
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS study_agreement_accepted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS study_agreement_version      text;

-- ── Disputes: add raised_by_role + category for new schema ────────────────
ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS raised_by_role text DEFAULT 'participant'
    CHECK (raised_by_role IN ('participant','experimenter')),
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'other'
    CHECK (category IN (
      'compliance_disagreement','payout_dispute','milestone_rejection_unfair',
      'violation_flag_unfair','study_conditions_changed','safety_concern','other'
    ));

-- Re-sync dispute_credits → profiles: add to profiles if separate table not preferred
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS disputes_raised          integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_disputes_remaining  integer NOT NULL DEFAULT 3;

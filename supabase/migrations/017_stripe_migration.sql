-- Migration 017: Replace Trolley with Stripe
-- Run in Supabase SQL editor after reviewing carefully.

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: participant_profiles — remove Trolley, add Stripe
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_participant_trolley;

ALTER TABLE participant_profiles
  DROP COLUMN IF EXISTS trolley_recipient_id,
  DROP COLUMN IF EXISTS payout_method_type;

ALTER TABLE participant_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id          text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_participant_stripe
  ON participant_profiles (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: experiments — remove Trolley escrow, add Stripe payment tracking
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE experiments
  DROP COLUMN IF EXISTS escrow_total,
  DROP COLUMN IF EXISTS escrow_status,
  DROP COLUMN IF EXISTS escrow_deposited_at;

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id       text,
  ADD COLUMN IF NOT EXISTS launch_fee_paid                boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS launch_fee_paid_at             timestamptz,
  ADD COLUMN IF NOT EXISTS bounty_pool_payment_intent_id  text,
  ADD COLUMN IF NOT EXISTS bounty_pool_deposited          boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bounty_pool_deposited_at       timestamptz;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: experiments — rename + update activation/publish fee columns
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE experiments
  DROP COLUMN IF EXISTS activation_fee_status;

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS launch_fee_status text NOT NULL DEFAULT 'pending_payment'
    CHECK (launch_fee_status IN ('pending_payment', 'paid'));

ALTER TABLE experiments
  DROP COLUMN IF EXISTS publish_fee_status;

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS publish_fee_status text NOT NULL DEFAULT 'pending_payment'
    CHECK (publish_fee_status IN ('pending_payment', 'paid'));

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: applications — remove Trolley, add Stripe transfer tracking
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE applications
  DROP COLUMN IF EXISTS trolley_payment_id,
  DROP COLUMN IF EXISTS trolley_batch_id;

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS stripe_transfer_id  text,
  ADD COLUMN IF NOT EXISTS stripe_payout_id    text;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5: experimenter_profiles — remove free-tier tracking
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE experimenter_profiles
  DROP COLUMN IF EXISTS free_study_used,
  DROP COLUMN IF EXISTS studies_activated;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6: increment_total_earned RPC — unchanged, still valid for Stripe
-- ─────────────────────────────────────────────────────────────────────────────
-- No changes needed. Function continues to work for Stripe payouts.

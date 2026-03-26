-- Migration 016: Trolley payout integration
-- Adds payout tracking fields to participant_profiles, experiments, and applications

-- participant_profiles: Trolley recipient tracking
ALTER TABLE participant_profiles
  ADD COLUMN IF NOT EXISTS trolley_recipient_id     text,
  ADD COLUMN IF NOT EXISTS payout_method_configured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_method_type       text;

-- experiments: escrow tracking
ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS escrow_total        numeric(12,2),
  ADD COLUMN IF NOT EXISTS escrow_status       text NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS escrow_deposited_at timestamptz;

-- applications: Trolley payment tracking
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS trolley_payment_id  text,
  ADD COLUMN IF NOT EXISTS trolley_batch_id    text,
  ADD COLUMN IF NOT EXISTS payout_initiated_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_fee_amount   numeric(10,2),
  ADD COLUMN IF NOT EXISTS payout_net_amount   numeric(10,2);

-- Indexes for payout lookups
CREATE INDEX IF NOT EXISTS idx_applications_payout
  ON applications (experiment_id, payout_status);

CREATE INDEX IF NOT EXISTS idx_participant_trolley
  ON participant_profiles (trolley_recipient_id)
  WHERE trolley_recipient_id IS NOT NULL;

-- RPC: increment participant total_earned on successful payout
CREATE OR REPLACE FUNCTION increment_total_earned(p_user_id text, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE participant_profiles
  SET total_earned = COALESCE(total_earned, 0) + p_amount
  WHERE user_id = p_user_id;
END;
$$;

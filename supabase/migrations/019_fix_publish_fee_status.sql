-- Migration 019: Fix publish_fee_status constraint
-- The publish_fee_status column is legacy — it's no longer written to by any API.
-- Payment tracking is handled by launch_fee_paid (boolean) and launch_fee_status.
-- This migration drops the broken constraint to unblock any existing rows.

-- Option A (recommended): just drop the problematic column entirely
-- since launch_fee_paid + launch_fee_status cover the same ground.
ALTER TABLE experiments DROP COLUMN IF EXISTS publish_fee_status;

-- Option B (if you want to keep it): drop the old constraint and add a clean one
-- ALTER TABLE experiments DROP CONSTRAINT IF EXISTS experiments_publish_fee_status_check;
-- ALTER TABLE experiments ADD CONSTRAINT experiments_publish_fee_status_check
--   CHECK (publish_fee_status IN ('pending_payment', 'paid'));

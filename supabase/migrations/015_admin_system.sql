-- Migration 015: Admin system + email on profiles
-- Run in: Supabase Dashboard → SQL Editor → New Query

-- Add email + is_admin to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email     text,
  ADD COLUMN IF NOT EXISTS is_admin  boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS profiles_email_idx
  ON profiles(email);

CREATE INDEX IF NOT EXISTS profiles_is_admin_idx
  ON profiles(is_admin) WHERE is_admin = true;

-- ─── STEP 2 (run AFTER you log back in once so your email is stored) ──────────
-- After re-logging in, run this to grant yourself admin access:
--
--   UPDATE profiles SET is_admin = true WHERE email = 'kisorsamurai@gmail.com';
--
-- ─── IMMEDIATE FIX: approve all stuck experimenter profiles ───────────────────
-- Run this right now to unblock your existing profiles:

UPDATE experimenter_profiles
SET
  screening_status = 'approved',
  screened_at      = now(),
  screened_by      = 'admin_override'
WHERE screening_status = 'pending'
   OR screening_status IS NULL;

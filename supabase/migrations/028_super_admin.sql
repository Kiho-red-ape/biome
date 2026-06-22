-- ── 028_super_admin.sql ──────────────────────────────────────────────────────
-- Adds is_super_admin flag. Super admins can grant/revoke admin for @biome.to
-- email addresses. Regular admins have all ops access but cannot manage admins.
-- Only super admins can promote or demote other users.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

-- Seed kishore@biome.to as super admin (and ensure is_admin = true too).
-- Safe to run repeatedly — UPDATE is idempotent.
UPDATE profiles
SET    is_admin = true, is_super_admin = true
WHERE  lower(email) = 'kishore@biome.to';

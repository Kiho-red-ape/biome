-- Migration 018: Email notification preferences for participants

ALTER TABLE participant_profiles
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;

-- Notification type preferences (granular opt-in/out)
ALTER TABLE participant_profiles
  ADD COLUMN IF NOT EXISTS notify_study_updates    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_milestone_alerts boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_payout_events    boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_studies      boolean NOT NULL DEFAULT false;

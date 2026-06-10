-- ================================================================
-- MIGRATION 023 — Master Spec Rebuild
-- Idempotent: safe to run on top of migrations 001–022.
-- Atomic: wrapped in BEGIN/COMMIT — if any statement fails the
-- whole migration rolls back, so it is always safe to re-run.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. STRIPE / REVIEW FIXES  (defensive — already in 018)
-- ────────────────────────────────────────────────────────────────

ALTER TABLE participant_profiles
  DROP COLUMN IF EXISTS trolley_recipient_id,
  DROP COLUMN IF EXISTS payout_method_type,
  DROP COLUMN IF EXISTS payout_method_configured;

ALTER TABLE participant_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id          text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

ALTER TABLE experimenter_profiles
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'active';

-- ────────────────────────────────────────────────────────────────
-- 2. EXPERIMENT PAYMENT & PROTOCOL FIELDS
-- ────────────────────────────────────────────────────────────────

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS study_short_code          text,
  ADD COLUMN IF NOT EXISTS payment_milestones        jsonb    DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bounty_pool_locked        boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS bounty_pool_lock_amount   numeric(12,2),
  ADD COLUMN IF NOT EXISTS bounty_pool_stripe_id     text,
  ADD COLUMN IF NOT EXISTS total_ops_fee             numeric(12,2),
  ADD COLUMN IF NOT EXISTS pricing_breakdown         jsonb,
  ADD COLUMN IF NOT EXISTS protocol_text             text;

-- ────────────────────────────────────────────────────────────────
-- 3. RENAME OLD study_messages → experimenter_broadcasts
--    The 014 table (subject/body/handoff_url) holds experimenter
--    broadcast records.  The spec repurposes the name for
--    pseudonymised chat, so the old table is renamed.  Only fires
--    when the old schema (has 'subject') is still present.
-- ────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_messages' AND column_name = 'subject'
  ) THEN
    ALTER TABLE study_messages RENAME TO experimenter_broadcasts;
    RAISE NOTICE 'Renamed study_messages → experimenter_broadcasts';
  ELSE
    RAISE NOTICE 'study_messages already migrated — skip rename';
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 4. NEW TABLE: study_participant_map  (encrypted identity mapping)
--    Decryption key is NEVER stored — held only by the client.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_participant_map (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id           uuid        NOT NULL REFERENCES experiments(id)  ON DELETE CASCADE,
  application_id          uuid        NOT NULL REFERENCES applications(id)  ON DELETE CASCADE,
  study_participant_id    text        NOT NULL,
  study_pseudonym         text        NOT NULL,
  platform_participant_id text        NOT NULL,
  encrypted_identity_blob text        NOT NULL,
  key_delivered_to_client boolean     DEFAULT false,
  key_delivered_at        timestamptz,
  created_at              timestamptz DEFAULT now(),
  UNIQUE (experiment_id, study_participant_id),
  UNIQUE (experiment_id, application_id)
);

CREATE INDEX IF NOT EXISTS idx_spm_experiment  ON study_participant_map(experiment_id);
CREATE INDEX IF NOT EXISTS idx_spm_platform_id ON study_participant_map(platform_participant_id);

-- ────────────────────────────────────────────────────────────────
-- 5. NEW TABLE: study_messages  (pseudonymised bidirectional chat)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS study_messages (
  id                              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id                   uuid        NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  sender_type                     text        NOT NULL
    CHECK (sender_type IN ('participant','researcher','system')),
  sender_study_participant_id     text,
  sender_user_id                  text,
  recipient_type                  text        NOT NULL
    CHECK (recipient_type IN ('participant','researcher','all_participants')),
  recipient_study_participant_id  text,
  message_text                    text        NOT NULL,
  message_type                    text        DEFAULT 'text'
    CHECK (message_type IN ('text','milestone_update','system_notice')),
  read_at                         timestamptz,
  reply_to_id                     uuid        REFERENCES study_messages(id),
  created_at                      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_msgs_experiment ON study_messages(experiment_id);
CREATE INDEX IF NOT EXISTS idx_msgs_sender     ON study_messages(experiment_id, sender_study_participant_id);
CREATE INDEX IF NOT EXISTS idx_msgs_recipient  ON study_messages(experiment_id, recipient_study_participant_id);

-- ────────────────────────────────────────────────────────────────
-- 6. VERIFY ALL OTHER SPEC TABLES (idempotent)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_intakes (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  organization        text        NOT NULL,
  email               text        NOT NULL,
  website             text,
  study_title         text        NOT NULL,
  study_type          text,
  description         text,
  target_participants integer,
  duration            text,
  geography           text[],
  sample_types        text[],
  irb_status          text,
  budget_range        text,
  referral_source     text,
  additional_notes    text,
  triage_score        integer,
  triage_notes        text,
  triage_status       text DEFAULT 'new'
    CHECK (triage_status IN ('new','reviewing','qualified','nurture','declined','converted')),
  triaged_at          timestamptz,
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estimate_leads (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text        NOT NULL,
  organization        text,
  study_type          text,
  sponsor_type        text,
  participants        integer,
  duration            text,
  geography           text[],
  samples             text[],
  irb_status          text,
  estimated_total     integer,
  estimated_ops_fee   integer,
  estimate_breakdown  jsonb,
  contacted           boolean     DEFAULT false,
  contacted_at        timestamptz,
  notes               text,
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_applications (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text        NOT NULL,
  email                text        NOT NULL,
  website              text,
  category             text        NOT NULL,
  services             text,
  region               text,
  description          text,
  logo_url             text,
  status               text        DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  approved_at          timestamptz,
  display_on_homepage  boolean     DEFAULT false,
  created_at           timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sample_kits (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id               uuid        REFERENCES experiments(id),
  application_id              uuid        REFERENCES applications(id),
  participant_id              text        NOT NULL,
  kit_type                    text        NOT NULL
    CHECK (kit_type IN ('stool','saliva','dried_blood_spot','urine','blood_draw','multi')),
  kit_contents                text,
  ship_status                 text        DEFAULT 'pending'
    CHECK (ship_status IN ('pending','shipped','delivered','returned_undeliverable')),
  tracking_number_outbound    text,
  shipped_at                  timestamptz,
  delivered_at                timestamptz,
  collection_status           text        DEFAULT 'awaiting'
    CHECK (collection_status IN ('awaiting','collected','missed_window')),
  collection_due_date         date,
  collected_at                timestamptz,
  return_status               text        DEFAULT 'not_started'
    CHECK (return_status IN ('not_started','in_transit','received_at_lab','processing','results_ready','failed')),
  tracking_number_return      text,
  return_shipped_at           timestamptz,
  received_at_lab_at          timestamptz,
  lab_partner_name            text,
  lab_reference_number        text,
  results_ready_at            timestamptz,
  phlebotomy_partner          text,
  phlebotomy_appointment_date date,
  phlebotomy_status           text
    CHECK (phlebotomy_status IN ('not_applicable','scheduled','completed','missed','rescheduled')),
  chain_of_custody_log        jsonb       DEFAULT '[]'::jsonb,
  notes                       text,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kits_experiment ON sample_kits(experiment_id);
CREATE INDEX IF NOT EXISTS idx_kits_status     ON sample_kits(ship_status, return_status);

CREATE TABLE IF NOT EXISTS blog_posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text        UNIQUE NOT NULL,
  title            text        NOT NULL,
  excerpt          text,
  content          text        NOT NULL,
  cover_image_url  text,
  author           text        DEFAULT 'Biome',
  tags             text[],
  status           text        DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  published_at     timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS hook           text,
  ADD COLUMN IF NOT EXISTS artifact_url   text,
  ADD COLUMN IF NOT EXISTS artifact_label text;

-- ────────────────────────────────────────────────────────────────
-- 7. ROW-LEVEL SECURITY ON SENSITIVE NEW TABLES
--    Identity map + messages: service role only (deny direct client).
-- ────────────────────────────────────────────────────────────────

ALTER TABLE study_participant_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_messages        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spm_deny_direct_access" ON study_participant_map;
CREATE POLICY "spm_deny_direct_access" ON study_participant_map USING (false);

DROP POLICY IF EXISTS "msgs_deny_direct_access" ON study_messages;
CREATE POLICY "msgs_deny_direct_access" ON study_messages USING (false);

-- ────────────────────────────────────────────────────────────────
-- 8. STRIP ALL SEED / DEMO DATA  (keep ONLY kishore@biome.to)
--    Almost every child table cascades from experiments/applications.
--    sample_kits is the only non-cascading FK, so it is cleared first.
-- ────────────────────────────────────────────────────────────────

DO $$
DECLARE
  demo_uids    text[];
  demo_exp_ids uuid[];
BEGIN
  -- All @biome.to accounts except kishore, plus synthetic seed IDs
  SELECT array_agg(id) INTO demo_uids
  FROM profiles
  WHERE (email LIKE '%@biome.to' AND email IS DISTINCT FROM 'kishore@biome.to')
     OR id LIKE 'did:privy:org-%'
     OR id LIKE 'did:privy:participant-%'
     OR id LIKE 'demo:%';

  IF demo_uids IS NULL THEN
    RAISE NOTICE 'No demo accounts found — seed already clean';
  ELSE
    RAISE NOTICE 'Removing % demo user(s)', array_length(demo_uids, 1);

    SELECT array_agg(id) INTO demo_exp_ids
    FROM experiments WHERE experimenter_id = ANY(demo_uids);

    -- sample_kits has no ON DELETE CASCADE → clear manually first
    IF demo_exp_ids IS NOT NULL THEN
      DELETE FROM sample_kits WHERE experiment_id = ANY(demo_exp_ids);
    END IF;
    DELETE FROM sample_kits
      WHERE application_id IN (SELECT id FROM applications WHERE participant_id = ANY(demo_uids));

    -- Delete demo-owned experiments → cascades applications, comments,
    -- updates, milestones, disputes, eligibility, study_messages,
    -- broadcasts, participant maps
    IF demo_exp_ids IS NOT NULL THEN
      DELETE FROM experiments WHERE id = ANY(demo_exp_ids);
    END IF;

    -- Demo participants who applied to surviving (non-demo) experiments
    DELETE FROM participant_milestones WHERE participant_id = ANY(demo_uids);
    DELETE FROM applications           WHERE participant_id = ANY(demo_uids);

    -- Standalone per-user rows
    DELETE FROM dispute_credits          WHERE participant_id = ANY(demo_uids);
    DELETE FROM notifications            WHERE user_id        = ANY(demo_uids);
    DELETE FROM notification_preferences WHERE user_id        = ANY(demo_uids);
    DELETE FROM participant_profiles     WHERE user_id        = ANY(demo_uids);
    DELETE FROM experimenter_profiles    WHERE user_id        = ANY(demo_uids);

    DELETE FROM profiles WHERE id = ANY(demo_uids);
  END IF;

  -- Sweep any experiments whose experimenter no longer exists
  DELETE FROM sample_kits
    WHERE experiment_id IN (
      SELECT e.id FROM experiments e
      WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = e.experimenter_id)
    );
  DELETE FROM experiments e
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = e.experimenter_id);
END;
$$;

-- Wipe placeholder pipeline + content tables
DELETE FROM estimate_leads;
DELETE FROM client_intakes;
DELETE FROM partner_applications;
DELETE FROM blog_posts;

-- Clean orphaned notifications
DELETE FROM notifications            WHERE user_id NOT IN (SELECT id FROM profiles);
DELETE FROM notification_preferences WHERE user_id NOT IN (SELECT id FROM profiles);

COMMIT;

-- ================================================================
-- END MIGRATION 023
-- ================================================================

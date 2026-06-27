-- ================================================================
-- MIGRATION 030 — Participant Agent System: Data Spine
-- The backbone every agent role (onboard / screen / consent / support)
-- reads and writes. One evolving participant record + conversation
-- memory + awareness progress + consent audit + referral graph.
-- Idempotent: safe to re-run. Atomic: wrapped in BEGIN/COMMIT.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. EVOLVING PARTICIPANT RECORD (extends participant_profiles)
--    NOTE: distinct from the existing `verification_status` column —
--    `verification_level` is the agent-system literacy/trust ladder.
-- ────────────────────────────────────────────────────────────────

ALTER TABLE participant_profiles
  ADD COLUMN IF NOT EXISTS verification_level text DEFAULT 'unverified'
    CHECK (verification_level IN ('unverified','aware','verified','community_builder')),
  ADD COLUMN IF NOT EXISTS awareness_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS priority_match_score   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reusable_eligibility   jsonb   DEFAULT '{}'::jsonb,
  -- captured once, reused for every study match:
  -- { age_range, location, general_health_context, samples_comfortable_with,
  --   conditions_disclosed, interests, languages, devices_owned }
  ADD COLUMN IF NOT EXISTS referral_code          text,
  ADD COLUMN IF NOT EXISTS successful_referrals   integer       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS community_credit       numeric(8,2)  DEFAULT 0,
  -- separate ledger from study reimbursement — NEVER blended
  ADD COLUMN IF NOT EXISTS source_channel         text          DEFAULT 'organic';
  -- 'organic' | 'referral' | 'find_agent:<community_id>' (Stage 0, later)

-- UNIQUE on referral_code (nullable; multiple NULLs allowed in Postgres).
CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_referral_code
  ON participant_profiles(referral_code)
  WHERE referral_code IS NOT NULL;

-- ────────────────────────────────────────────────────────────────
-- 2. AWARENESS LEARNING PROGRESS (the research-literacy ladder)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS awareness_progress (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id text        NOT NULL,
  module_id      text        NOT NULL,
  completed      boolean     DEFAULT false,
  quiz_passed    boolean     DEFAULT false,
  quiz_score     integer,
  attempts       integer     DEFAULT 0,
  completed_at   timestamptz,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (participant_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_awareness_participant
  ON awareness_progress(participant_id);

-- ────────────────────────────────────────────────────────────────
-- 3. CONVERSATION MEMORY (persistent across sessions — continuity spine)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_conversations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id       text        NOT NULL,
  stage                text        NOT NULL
    CHECK (stage IN ('onboard','screen','consent','support')),
  experiment_id        uuid        REFERENCES experiments(id),  -- null for onboarding
  messages             jsonb       DEFAULT '[]'::jsonb,         -- full conversation history
  extracted_data       jsonb       DEFAULT '{}'::jsonb,         -- structured fields captured
  status               text        DEFAULT 'active'
    CHECK (status IN ('active','complete','flagged_operator','abandoned')),
  operator_flag_reason text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_participant ON agent_conversations(participant_id);
CREATE INDEX IF NOT EXISTS idx_conv_flagged     ON agent_conversations(status)
  WHERE status = 'flagged_operator';

-- ────────────────────────────────────────────────────────────────
-- 4. CONSENT RECORDS (comprehension-gated, IRB-grade audit trail)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consent_records (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id           text        NOT NULL,
  experiment_id            uuid        NOT NULL REFERENCES experiments(id),
  icf_version              text        NOT NULL,    -- sponsor's IRB-approved ICF version
  icf_document_hash        text,                    -- hash of the exact document read
  comprehension_quiz_score integer     NOT NULL,
  comprehension_quiz_passed boolean    NOT NULL,
  quiz_responses           jsonb,                   -- what they answered, for audit
  consent_given            boolean     DEFAULT false,
  consent_timestamp        timestamptz,
  consent_ip               text,
  withdrawn                boolean     DEFAULT false,
  withdrawn_at             timestamptz,
  created_at               timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consent_participant ON consent_records(participant_id);
CREATE INDEX IF NOT EXISTS idx_consent_experiment  ON consent_records(experiment_id);

-- ────────────────────────────────────────────────────────────────
-- 5. REFERRAL GRAPH (decoupled from study compensation)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS referrals (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id    text        NOT NULL,
  referred_id    text,                    -- null until referee signs up
  referral_code  text        NOT NULL,
  referred_email text,
  status         text        DEFAULT 'sent'
    CHECK (status IN ('sent','signed_up','awareness_complete')),
  signed_up_at   timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code     ON referrals(referral_code);

-- ────────────────────────────────────────────────────────────────
-- 6. ROW-LEVEL SECURITY — service-role only (deny direct client).
--    All agent reads/writes go through the server (createServiceClient),
--    mirroring study_messages / study_participant_map.
-- ────────────────────────────────────────────────────────────────

ALTER TABLE awareness_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "awareness_progress_deny"  ON awareness_progress;
DROP POLICY IF EXISTS "agent_conversations_deny" ON agent_conversations;
DROP POLICY IF EXISTS "consent_records_deny"     ON consent_records;
DROP POLICY IF EXISTS "referrals_deny"           ON referrals;

CREATE POLICY "awareness_progress_deny"  ON awareness_progress  USING (false);
CREATE POLICY "agent_conversations_deny" ON agent_conversations USING (false);
CREATE POLICY "consent_records_deny"     ON consent_records     USING (false);
CREATE POLICY "referrals_deny"           ON referrals           USING (false);

COMMIT;

-- ================================================================
-- END MIGRATION 030 — Participant Agent System: Data Spine
-- ================================================================

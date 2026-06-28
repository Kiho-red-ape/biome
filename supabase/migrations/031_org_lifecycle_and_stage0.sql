-- ================================================================
-- MIGRATION 031 — Org lifecycle, invites, payment gate, Stage 0
-- Builds out the researcher/sponsor lifecycle:
--   intake → ops invite → org onboarding → org team → study draft →
--   docs + payment → recruiting → Stage 0 find agent.
-- Idempotent + atomic (BEGIN/COMMIT). Run in Supabase SQL editor.
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. ORG MEMBERSHIP + ROLES
--    experimenter_profiles is the ORG record (its user_id = founding admin).
--    org_members maps users (and pending invitees) to an org with a role.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_members (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid        NOT NULL REFERENCES experimenter_profiles(id) ON DELETE CASCADE,
  user_id      text        REFERENCES profiles(id) ON DELETE CASCADE,   -- null until accepted
  email        text        NOT NULL,
  role         text        NOT NULL DEFAULT 'researcher'
    CHECK (role IN ('admin','clinical_operator','researcher','sponsor')),
  status       text        NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited','active','removed')),
  invite_token text        UNIQUE,
  invited_by   text,                                   -- privyDid of inviter
  invited_at   timestamptz DEFAULT now(),
  accepted_at  timestamptz,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (org_id, email)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org   ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user  ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_token ON org_members(invite_token) WHERE invite_token IS NOT NULL;

-- ────────────────────────────────────────────────────────────────
-- 2. OPS → RESEARCHER ORG INVITES (from the intake pipeline)
--    Replaces the old auto-create "Activate". Ops invites the real
--    researcher to self-onboard; accepting creates their org profile.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_invites (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id      uuid        REFERENCES client_intakes(id) ON DELETE SET NULL,
  email          text        NOT NULL,
  org_name       text,
  contact_name   text,
  invite_token   text        UNIQUE NOT NULL,
  status         text        NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','accepted','expired','revoked')),
  invited_by     text,                                 -- operator privyDid
  created_org_id uuid        REFERENCES experimenter_profiles(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now(),
  accepted_at    timestamptz,
  expires_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_org_invites_token  ON org_invites(invite_token);
CREATE INDEX IF NOT EXISTS idx_org_invites_status ON org_invites(status);

-- Link an intake to the invite that was sent for it.
ALTER TABLE client_intakes
  ADD COLUMN IF NOT EXISTS org_invite_id uuid REFERENCES org_invites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at    timestamptz;

-- ────────────────────────────────────────────────────────────────
-- 3. STUDY LIFECYCLE — placeholder payment gate + launch request
--    draft → (attach docs) → request launch → ops confirms paid → recruiting
-- ────────────────────────────────────────────────────────────────

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','launch_requested','paid')),
  ADD COLUMN IF NOT EXISTS launch_requested_at  timestamptz,
  ADD COLUMN IF NOT EXISTS launch_requested_by  text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_by text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;

-- ────────────────────────────────────────────────────────────────
-- 4. STAGE 0 — FIND & CONVERT: recruitment runs + targets
--    The find agent maps where eligible cohorts gather (healthy +
--    patient), plus hospitals/clinics/advocacy/operators, per study.
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recruitment_runs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid        NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','complete','failed')),
  trigger       text        DEFAULT 'recruiting',
  summary       text,
  targets_found integer     DEFAULT 0,
  model_used    text,
  error         text,
  created_at    timestamptz DEFAULT now(),
  completed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_recruit_runs_exp ON recruitment_runs(experiment_id);

CREATE TABLE IF NOT EXISTS recruitment_targets (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid        NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  run_id        uuid        REFERENCES recruitment_runs(id) ON DELETE CASCADE,
  cohort        text        DEFAULT 'unspecified'
    CHECK (cohort IN ('healthy','patient','both','unspecified')),
  kind          text        NOT NULL DEFAULT 'other'
    CHECK (kind IN ('online_community','forum','advocacy','creator','hospital',
                    'clinic','old_age_home','patient_group','doctor',
                    'clinical_operator','registry','regional','other')),
  name          text        NOT NULL,
  region        text,
  url           text,
  fit_score     numeric(4,2),
  size_estimate text,
  accessibility text        CHECK (accessibility IN ('open','gated','restricted','unknown')),
  trust         text        CHECK (trust IN ('high','medium','low','unknown')),
  rationale     text,
  contact_hint  text,
  status        text        NOT NULL DEFAULT 'suggested'
    CHECK (status IN ('suggested','contacted','engaged','declined')),
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruit_targets_exp ON recruitment_targets(experiment_id);
CREATE INDEX IF NOT EXISTS idx_recruit_targets_run ON recruitment_targets(run_id);

-- ────────────────────────────────────────────────────────────────
-- 5. ROW-LEVEL SECURITY — service-role only (all access via server)
-- ────────────────────────────────────────────────────────────────

ALTER TABLE org_members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_runs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_deny"        ON org_members;
DROP POLICY IF EXISTS "org_invites_deny"        ON org_invites;
DROP POLICY IF EXISTS "recruitment_runs_deny"   ON recruitment_runs;
DROP POLICY IF EXISTS "recruitment_targets_deny" ON recruitment_targets;

CREATE POLICY "org_members_deny"        ON org_members         USING (false);
CREATE POLICY "org_invites_deny"        ON org_invites         USING (false);
CREATE POLICY "recruitment_runs_deny"   ON recruitment_runs    USING (false);
CREATE POLICY "recruitment_targets_deny" ON recruitment_targets USING (false);

COMMIT;

-- ================================================================
-- END MIGRATION 031
-- ================================================================

-- 017_platform_reset.sql
-- Adds: sample_kits, client_intakes, partner_applications
-- Existing tables untouched — safe to run on any environment

-- ─────────────────────────────────────────────
-- SAMPLE KITS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sample_kits (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id               uuid REFERENCES experiments(id) ON DELETE SET NULL,
  application_id              uuid REFERENCES applications(id) ON DELETE SET NULL,
  participant_id              text NOT NULL,

  kit_type                    text NOT NULL
    CHECK (kit_type IN ('stool','saliva','dried_blood_spot','urine','blood_draw','multi')),
  kit_contents                text,

  ship_status                 text NOT NULL DEFAULT 'pending'
    CHECK (ship_status IN ('pending','shipped','delivered','returned_undeliverable')),
  tracking_number_outbound    text,
  shipped_at                  timestamptz,
  delivered_at                timestamptz,

  collection_status           text NOT NULL DEFAULT 'awaiting'
    CHECK (collection_status IN ('awaiting','collected','missed_window')),
  collection_due_date         date,
  collected_at                timestamptz,

  return_status               text NOT NULL DEFAULT 'not_started'
    CHECK (return_status IN ('not_started','in_transit','received_at_lab','processing','results_ready','failed')),
  tracking_number_return      text,
  return_shipped_at           timestamptz,
  received_at_lab_at          timestamptz,

  lab_partner_name            text,
  lab_partner_id              text,
  lab_reference_number        text,
  results_ready_at            timestamptz,

  phlebotomy_partner          text,
  phlebotomy_appointment_date date,
  phlebotomy_status           text
    CHECK (phlebotomy_status IN ('not_applicable','scheduled','completed','missed','rescheduled')),

  chain_of_custody_log        jsonb NOT NULL DEFAULT '[]'::jsonb,

  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kits_experiment    ON sample_kits(experiment_id);
CREATE INDEX IF NOT EXISTS idx_kits_participant   ON sample_kits(participant_id);
CREATE INDEX IF NOT EXISTS idx_kits_ship_status   ON sample_kits(ship_status);
CREATE INDEX IF NOT EXISTS idx_kits_return_status ON sample_kits(return_status);

CREATE OR REPLACE FUNCTION update_sample_kits_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sample_kits_updated_at
  BEFORE UPDATE ON sample_kits
  FOR EACH ROW EXECUTE FUNCTION update_sample_kits_updated_at();

ALTER TABLE sample_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participant_view_own_kits"
  ON sample_kits FOR SELECT
  USING (participant_id = auth.uid()::text);


-- ─────────────────────────────────────────────
-- CLIENT INTAKES
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS client_intakes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name                text NOT NULL,
  organization        text NOT NULL,
  email               text NOT NULL,
  website             text,
  study_title         text NOT NULL,
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
  triage_status       text NOT NULL DEFAULT 'new'
    CHECK (triage_status IN ('new','reviewing','qualified','nurture','declined','converted')),
  triaged_at          timestamptz,

  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intakes_status ON client_intakes(triage_status);
CREATE INDEX IF NOT EXISTS idx_intakes_email  ON client_intakes(email);

ALTER TABLE client_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_submit_intake"
  ON client_intakes FOR INSERT
  WITH CHECK (true);


-- ─────────────────────────────────────────────
-- PARTNER APPLICATIONS
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS partner_applications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name                 text NOT NULL,
  email                text NOT NULL,
  website              text,
  category             text NOT NULL,
  services             text[],
  region               text,
  description          text,
  logo_url             text,

  status               text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  approved_at          timestamptz,
  display_on_homepage  boolean NOT NULL DEFAULT false,

  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_status   ON partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partners_homepage ON partner_applications(display_on_homepage)
  WHERE status = 'approved';

ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_submit_partner_application"
  ON partner_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "approved_homepage_partners_public"
  ON partner_applications FOR SELECT
  USING (status = 'approved' AND display_on_homepage = true);

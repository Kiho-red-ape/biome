-- ================================================================
-- MIGRATION 027 — OME Agent
-- Tables for OME: Biome's on-platform AI recruitment intelligence agent.
-- OME helps locate hospitals, clinics, and treatment centres in India
-- to target the right patients through legal, compliant channels.
-- ================================================================

BEGIN;

-- ── ome_sessions ─────────────────────────────────────────────────
-- One session per researcher conversation with OME.

CREATE TABLE IF NOT EXISTS ome_sessions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text        NOT NULL,                -- Privy DID of researcher
  experiment_id   uuid        REFERENCES experiments(id) ON DELETE SET NULL,
  title           text,                                -- auto-generated from first message
  model_used      text        DEFAULT 'claude-haiku-4-5-20251001',
  total_tokens    integer     DEFAULT 0,
  total_cost_usd  numeric(10,6) DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ome_sessions_user ON ome_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ome_sessions_exp  ON ome_sessions(experiment_id);

-- ── ome_messages ─────────────────────────────────────────────────
-- Chat history for each session.

CREATE TABLE IF NOT EXISTS ome_messages (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid        NOT NULL REFERENCES ome_sessions(id) ON DELETE CASCADE,
  role          text        NOT NULL CHECK (role IN ('user','assistant','system')),
  content       text        NOT NULL,
  input_tokens  integer     DEFAULT 0,
  output_tokens integer     DEFAULT 0,
  cost_usd      numeric(10,6) DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ome_messages_session ON ome_messages(session_id);

-- ── india_health_facilities ──────────────────────────────────────
-- Curated, publicly-sourced directory of hospitals, diagnostic labs,
-- and treatment centres in India — enriched over time by OME routines.

CREATE TABLE IF NOT EXISTS india_health_facilities (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  facility_type       text        NOT NULL
    CHECK (facility_type IN (
      'hospital',           -- full-service hospital
      'diagnostic_lab',     -- Metropolis, SRL, Tata 1mg etc.
      'specialty_clinic',   -- e.g. oncology clinic
      'research_centre',    -- academic / ICMR centre
      'imaging_centre',     -- MRI, CT, PET
      'phlebotomy_centre',  -- blood draw points
      'wellness_clinic'
    )),

  -- Location
  address_line1   text,
  address_line2   text,
  city            text        NOT NULL,
  district        text,
  state           text        NOT NULL,
  pincode         text,
  region_tier     text        CHECK (region_tier IN ('tier1','tier2','tier3','rural')),
  latitude        numeric(9,6),
  longitude       numeric(9,6),

  -- Accreditations & registries
  nabh_accredited      boolean DEFAULT false,
  nabl_accredited      boolean DEFAULT false,
  icmr_registered      boolean DEFAULT false,
  ctri_site            boolean DEFAULT false,   -- registered CTRI trial site
  abdm_registered      boolean DEFAULT false,   -- Health Information Provider (HIP) on ABDM
  abha_enabled         boolean DEFAULT false,   -- accepts ABHA-linked patients

  -- Capabilities (what test types they can provide for studies)
  capabilities        text[]  DEFAULT '{}',
  -- e.g. ['blood_tests','stool_tests','biopsy','mri','ecg','eeg',
  --        'biomarker_panel','microbiome','genomics','pathology']

  -- Contact
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  website             text,

  -- Metadata
  patient_volume_per_day  integer,    -- rough daily footfall
  research_active         boolean DEFAULT false,  -- actively doing research
  notes                   text,
  data_source             text,       -- 'manual','ctri_scrape','nabh_list','abdm_hip'
  verified_at             timestamptz,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ihf_state      ON india_health_facilities(state);
CREATE INDEX IF NOT EXISTS idx_ihf_city       ON india_health_facilities(city);
CREATE INDEX IF NOT EXISTS idx_ihf_type       ON india_health_facilities(facility_type);
CREATE INDEX IF NOT EXISTS idx_ihf_caps       ON india_health_facilities USING GIN(capabilities);
CREATE INDEX IF NOT EXISTS idx_ihf_ctri       ON india_health_facilities(ctri_site) WHERE ctri_site = true;

-- ── ome_facility_matches ─────────────────────────────────────────
-- OME's recommendations: which facilities suit which study.

CREATE TABLE IF NOT EXISTS ome_facility_matches (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      uuid        REFERENCES ome_sessions(id) ON DELETE CASCADE,
  experiment_id   uuid        REFERENCES experiments(id)  ON DELETE CASCADE,
  facility_id     uuid        NOT NULL REFERENCES india_health_facilities(id),
  match_score     numeric(4,2),     -- 0.00–1.00
  match_rationale text,             -- OME's explanation
  status          text DEFAULT 'suggested'
    CHECK (status IN ('suggested','contacted','declined','partnership_active')),
  contacted_at    timestamptz,
  researcher_notes text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ome_matches_exp      ON ome_facility_matches(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ome_matches_facility ON ome_facility_matches(facility_id);

-- ── ome_knowledge_entries ────────────────────────────────────────
-- Curated knowledge OME can retrieve: India health registry docs,
-- ABDM specs, ICMR guidelines, CTRI procedures, etc.

CREATE TABLE IF NOT EXISTS ome_knowledge_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    text        NOT NULL
    CHECK (category IN (
      'abdm_spec',        -- ABDM/FHIR integration guides
      'icmr_guideline',   -- ICMR research ethics guidelines
      'ctri_procedure',   -- CTRI trial registration procedures
      'dpdpa_compliance', -- India Digital Personal Data Protection Act
      'irb_template',     -- IEC submission templates
      'facility_profile', -- enriched facility notes
      'recruitment_tip',  -- curated recruitment strategies
      'test_reference'    -- normal ranges, test procedures for supported biomarkers
    )),
  title       text        NOT NULL,
  content     text        NOT NULL,   -- markdown
  tags        text[]      DEFAULT '{}',
  source_url  text,
  valid_from  date,
  valid_until date,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ome_kb_category ON ome_knowledge_entries(category);
CREATE INDEX IF NOT EXISTS idx_ome_kb_tags     ON ome_knowledge_entries USING GIN(tags);

-- ── RLS: service-role only ────────────────────────────────────────

ALTER TABLE ome_sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ome_messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE india_health_facilities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ome_facility_matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ome_knowledge_entries    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ome_sessions_deny"    ON ome_sessions;
DROP POLICY IF EXISTS "ome_messages_deny"    ON ome_messages;
DROP POLICY IF EXISTS "ihf_deny"             ON india_health_facilities;
DROP POLICY IF EXISTS "ome_matches_deny"     ON ome_facility_matches;
DROP POLICY IF EXISTS "ome_kb_deny"          ON ome_knowledge_entries;

CREATE POLICY "ome_sessions_deny"   ON ome_sessions            USING (false);
CREATE POLICY "ome_messages_deny"   ON ome_messages            USING (false);
CREATE POLICY "ihf_deny"            ON india_health_facilities  USING (false);
CREATE POLICY "ome_matches_deny"    ON ome_facility_matches     USING (false);
CREATE POLICY "ome_kb_deny"         ON ome_knowledge_entries    USING (false);

-- ── RPC: increment session totals ────────────────────────────────

CREATE OR REPLACE FUNCTION increment_ome_session_totals(
  p_session_id  uuid,
  p_tokens      integer,
  p_cost        numeric
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE ome_sessions
  SET total_tokens   = total_tokens   + p_tokens,
      total_cost_usd = total_cost_usd + p_cost,
      updated_at     = now()
  WHERE id = p_session_id;
END;
$$;

-- ── Seed: initial knowledge base entries ────────────────────────

INSERT INTO ome_knowledge_entries (category, title, content, tags, source_url) VALUES

('abdm_spec', 'ABDM HIU Registration Overview',
'To access patient data through ABDM as a Health Information User (HIU):
1. Register at abdm.gov.in/sandbox to get sandbox credentials.
2. Implement FHIR R4 data ingestion pipelines.
3. Build the consent request flow: your platform calls the ABDM Consent Manager, the patient approves via their ABHA app, data is pushed to your registered callback endpoint as structured FHIR JSON.
4. Apply for production HIU status via NHA.
Key FHIR profiles used in India: DiagnosticReport, Observation, ImagingStudy, DocumentReference.',
ARRAY['abdm','fhir','consent','hiu'], 'https://abdm.gov.in/abdm'),

('icmr_guideline', 'ICMR Ethics Framework for Biomedical Research',
'The ICMR National Ethical Guidelines for Biomedical and Health Research Involving Human Participants (2017) governs all health research in India.
Key obligations:
- Independent review by a registered IEC (Institutional Ethics Committee) is mandatory for all studies involving human subjects.
- Informed consent must be obtained in the participant''s language. Consent forms must be approved by the IEC.
- Special protections apply to vulnerable populations (children, pregnant women, prisoners, tribal communities).
- All trials must be registered on CTRI before first patient enrollment.
- Data must be stored securely with access controls; participant confidentiality must be maintained.
For de-identification: remove name, address, exact date of birth, Aadhaar number, phone number. Convert DoB to 5-year age brackets.',
ARRAY['icmr','ethics','iec','consent','deidentification'], 'https://icmr.nic.in/guidelines'),

('ctri_procedure', 'CTRI Trial Registration',
'The Clinical Trials Registry of India (CTRI) at ctri.nic.in is mandatory for all interventional trials and for observational studies if data will be used for regulatory submission.
Registration steps:
1. Create an account at ctri.nic.in.
2. Complete the WHO ICTRP 24-item registration form.
3. Upload IEC approval letter.
4. Submit 30 days before first enrollment.
Registered CTRI sites are hospitals and institutions that have appeared as trial sites on at least one registered trial. These are your highest-priority recruitment partners — they have infrastructure, IRB relationships, and coordinators.',
ARRAY['ctri','registration','trial_site'], 'https://ctri.nic.in'),

('dpdpa_compliance', 'India DPDPA 2023 — Research Data Obligations',
'The Digital Personal Data Protection Act 2023 applies to processing personal data of Indian residents.
For research contexts:
- "Research, archiving, or statistical purposes" are recognised as legitimate purposes under certain conditions.
- Consent must be specific, informed, and freely given. Bundled consent is not valid.
- De-identified data (where re-identification is not reasonably possible) falls outside the Act''s scope.
- Data fiduciaries must have a published privacy notice. Contact the Data Protection Board for guidance on research exemptions.
Practical action: ensure all patient data leaving a hospital is de-identified by an on-premise pipeline before transfer. Use pseudonymous IDs only in your platform.',
ARRAY['dpdpa','compliance','privacy','deidentification'], NULL),

('recruitment_tip', 'Tier-wise India Recruitment Strategy',
'Tier 1 cities (Mumbai, Delhi, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad):
- Highest ABDM penetration. Target NABH-accredited multi-specialty hospitals and large diagnostic chains (Metropolis, SRL, Tata 1mg, Dr Lal PathLabs).
- Use CTRI site lists to find hospitals already running similar trials.
- Average IEC turnaround: 4–8 weeks.

Tier 2 cities (Jaipur, Lucknow, Nagpur, Indore, Bhopal, Patna, Coimbatore, Kochi):
- Strong medical college presence (NMC-affiliated). Direct outreach to HODs yields faster results than formal DSA route.
- ABDM rollout ongoing — ABHA adoption lower but growing.

Tier 3 / Rural:
- Primary Health Centres (PHCs) and Community Health Centres (CHCs) under NHM have large patient footfall.
- Ayushman Bharat PM-JAY facilities are ABDM-registered. Best for high-volume, lower-income population studies.
- Partner with NGOs (SEWA, ASHA workers) for community recruitment.

For microbiome and stool studies: target gastroenterology OPDs in NABH hospitals — highest consent rates for non-invasive samples.',
ARRAY['recruitment','tier1','tier2','strategy','india'])

ON CONFLICT DO NOTHING;

-- ── Seed: major diagnostic networks ──────────────────────────────

INSERT INTO india_health_facilities (
  name, facility_type, city, state, region_tier,
  nabh_accredited, nabl_accredited, abdm_registered, ctri_site,
  capabilities, data_source, research_active
) VALUES

('Dr Lal PathLabs — National Network', 'diagnostic_lab', 'Delhi', 'Delhi', 'tier1',
 false, true, true, false,
 ARRAY['blood_tests','stool_tests','biomarker_panel','genomics','pathology','urine_tests'],
 'manual', true),

('Metropolis Healthcare — National Network', 'diagnostic_lab', 'Mumbai', 'Maharashtra', 'tier1',
 false, true, true, false,
 ARRAY['blood_tests','stool_tests','biomarker_panel','microbiome','biopsy','genomics','pathology'],
 'manual', true),

('SRL Diagnostics — National Network', 'diagnostic_lab', 'Gurgaon', 'Haryana', 'tier1',
 false, true, false, false,
 ARRAY['blood_tests','stool_tests','biomarker_panel','pathology','genomics'],
 'manual', false),

('Tata Memorial Hospital', 'hospital', 'Mumbai', 'Maharashtra', 'tier1',
 true, true, true, true,
 ARRAY['blood_tests','biopsy','biomarker_panel','mri','ct','pathology','genomics'],
 'manual', true),

('AIIMS New Delhi', 'research_centre', 'New Delhi', 'Delhi', 'tier1',
 true, true, true, true,
 ARRAY['blood_tests','stool_tests','biopsy','biomarker_panel','mri','ecg','eeg','genomics','pathology'],
 'manual', true),

('NIMHANS Bengaluru', 'research_centre', 'Bengaluru', 'Karnataka', 'tier1',
 true, false, true, true,
 ARRAY['blood_tests','mri','ecg','eeg','biomarker_panel'],
 'manual', true),

('Narayana Health — Bengaluru', 'hospital', 'Bengaluru', 'Karnataka', 'tier1',
 true, true, true, true,
 ARRAY['blood_tests','ecg','mri','ct','biomarker_panel','biopsy','pathology'],
 'manual', true),

('Apollo Hospitals — Chennai', 'hospital', 'Chennai', 'Tamil Nadu', 'tier1',
 true, true, true, true,
 ARRAY['blood_tests','stool_tests','biopsy','biomarker_panel','mri','ecg','eeg','pathology','genomics'],
 'manual', true),

('Manipal Hospital — Bengaluru', 'hospital', 'Bengaluru', 'Karnataka', 'tier1',
 true, true, true, true,
 ARRAY['blood_tests','biopsy','biomarker_panel','mri','ct','ecg','pathology'],
 'manual', true),

('SGPGI Lucknow', 'research_centre', 'Lucknow', 'Uttar Pradesh', 'tier2',
 true, true, false, true,
 ARRAY['blood_tests','biopsy','biomarker_panel','mri','ecg','eeg','pathology'],
 'manual', true)

ON CONFLICT DO NOTHING;

COMMIT;

-- ================================================================
-- END MIGRATION 027 — OME Agent
-- ================================================================

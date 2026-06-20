-- ============================================================================
-- BIOME STAGING SETUP — run this whole file in the Supabase SQL editor.
-- Order matters. This bundles migrations 026 -> 025 -> 027.
-- Safe to re-run (idempotent inserts use ON CONFLICT / IF NOT EXISTS).
-- Prereq: migrations 001-024 already applied.
-- ============================================================================

-- ============================================================================
-- STEP 1 of 3 — migration 026: patch study_documents.document_type CHECK
-- (must run BEFORE 025 so the demo seed's document_type values are allowed)
-- ============================================================================
-- ================================================================
-- MIGRATION 026 — Patch document_type check constraint
-- Adds data_processing_agreement as an alias alongside
-- data_sharing_agreement (both refer to GDPR DPA documents).
-- Safe to run if 024 is already applied.
-- ================================================================

BEGIN;

ALTER TABLE study_documents
  DROP CONSTRAINT IF EXISTS study_documents_document_type_check;

ALTER TABLE study_documents
  ADD CONSTRAINT study_documents_document_type_check
  CHECK (document_type IN (
    'irb_approval',
    'study_protocol',
    'amendment',
    'participant_info_sheet',
    'consent_form',
    'service_contract',
    'researcher_agreement',
    'sponsor_authorization',
    'data_sharing_agreement',
    'data_processing_agreement',
    'insurance_certificate',
    'regulatory_filing',
    'lab_agreement',
    'pi_credentials',
    'screening_survey',
    'other'
  ));

COMMIT;

-- ============================================================================
-- STEP 2 of 3 — migration 025: demo seed v2 (studies, partners, docs, msgs)
-- ============================================================================
-- ================================================================
-- MIGRATION 025 — Demo seed v2
-- Enriches the existing demo study (00000000-0001-0000-0000-000000000001)
-- with data for all tables added in migrations 023 and 024:
--   • experiment new columns (study_short_code, protocol_text, etc.)
--   • study_participant_map
--   • study_messages  (new schema from 023)
--   • study_documents + document_signatures + document_send_log
--   • sample_kits  (3 kits for demo participant)
--
-- SAFE to re-run: all inserts use ON CONFLICT DO NOTHING or DO UPDATE.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. ENRICH DEMO EXPERIMENT with new columns from 023
-- ────────────────────────────────────────────────────────────────

UPDATE experiments
SET
  study_short_code      = 'GBM-2024-01',
  protocol_text         = E'PROTOCOL SUMMARY — Gut-Brain Microbiome Intervention Study\n\n'
                          '1. OBJECTIVE\nInvestigate the causal relationship between dietary patterns, gut microbiome diversity (16S rRNA sequencing), and self-reported cognitive performance in healthy adults aged 25–55.\n\n'
                          '2. DESIGN\nProspective 8-week observational cohort. N=50 participants. Fully remote; sample kits shipped direct-to-participant.\n\n'
                          '3. PRIMARY ENDPOINTS\n• Gut microbiome alpha diversity (Shannon index) at baseline vs. week 8\n• Correlation coefficient between dietary fibre intake and Bacteroidetes:Firmicutes ratio\n\n'
                          '4. SECONDARY ENDPOINTS\n• Self-reported cognitive clarity score (validated 10-item scale, weekly)\n• Sleep quality index (Pittsburgh Sleep Quality Index, weeks 1 and 8)\n\n'
                          '5. SAMPLE COLLECTION\nStool samples collected at weeks 0 (baseline), 4, and 8 using OmniGene-Gut kits. Return via prepaid FedEx. Lab analysis by BioRender Lab, Manchester UK (UKAS accredited).\n\n'
                          '6. DATA HANDLING\nAll participant data pseudonymised at enrolment. PI receives coded dataset only. Decryption keys held by Biome and deleted post-study. GDPR-compliant data processing agreement in place.\n\n'
                          '7. COMPENSATION\n$240 per participant paid on verified completion of all three sample returns and weekly journals. Milestone-based: $60 at week 2, $80 at week 4, $100 at week 8.',
  bounty_pool_locked      = true,
  bounty_pool_lock_amount = 12000.00,
  total_ops_fee           = 1440.00,
  pricing_breakdown       = '{"platform_fee_pct": 2.5, "ops_fee_flat": 1200, "compliance_fee": 240, "kit_logistics": 0, "note": "Launch pricing — platform fee waived"}'::jsonb
WHERE id = '00000000-0001-0000-0000-000000000001';

-- ────────────────────────────────────────────────────────────────
-- 2. STUDY_PARTICIPANT_MAP
-- ────────────────────────────────────────────────────────────────

INSERT INTO study_participant_map (
  id,
  experiment_id,
  application_id,
  study_participant_id,
  study_pseudonym,
  platform_participant_id,
  encrypted_identity_blob,
  key_delivered_to_client,
  key_delivered_at,
  created_at
)
SELECT
  '00000000-0001-0000-0000-000000000101',
  '00000000-0001-0000-0000-000000000001',
  a.id,
  'GBM-P001',
  'P001-Teal-Falcon',
  'demo:participant',
  'enc:DEMO_BLOB_NOT_REAL_DATA_v1::AES256GCM::nonce=demoXXXXXXXXX',
  true,
  now() - interval '11 days',
  now() - interval '11 days'
FROM applications a
WHERE a.experiment_id = '00000000-0001-0000-0000-000000000001'
  AND a.participant_id = 'demo:participant'
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 3. STUDY_DOCUMENTS (requires 024 migration to have run first)
-- ────────────────────────────────────────────────────────────────

-- IRB Approval (uploaded by researcher, approved by operator)
INSERT INTO study_documents (
  id, experiment_id, document_type, title, description,
  status, clearance_level, uploaded_by, approved_by, approved_at,
  file_path, requires_signature, created_at, updated_at
) VALUES (
  '00000000-0001-0000-0000-d00000000001',
  '00000000-0001-0000-0000-000000000001',
  'irb_approval',
  'IRB Approval Certificate — GBM-2024-01',
  'Full IRB approval from the Stanford University Institutional Review Board for the Gut-Brain Microbiome Intervention Study. Protocol GBM-2024-01 approved for remote observational cohort of up to 50 participants.',
  'approved',
  'researcher',
  'demo:researcher',
  'demo:researcher',
  now() - interval '20 days',
  NULL,
  false,
  now() - interval '22 days',
  now() - interval '20 days'
) ON CONFLICT (id) DO NOTHING;

-- Study Protocol
INSERT INTO study_documents (
  id, experiment_id, document_type, title, description,
  status, clearance_level, uploaded_by, approved_by, approved_at,
  file_path, requires_signature, created_at, updated_at
) VALUES (
  '00000000-0001-0000-0000-d00000000002',
  '00000000-0001-0000-0000-000000000001',
  'study_protocol',
  'Technical Study Protocol v1.2',
  'Full technical protocol including inclusion/exclusion criteria, sample collection procedures, data handling specifications, and statistical analysis plan.',
  'approved',
  'researcher',
  'demo:researcher',
  'demo:researcher',
  now() - interval '18 days',
  NULL,
  false,
  now() - interval '21 days',
  now() - interval '18 days'
) ON CONFLICT (id) DO NOTHING;

-- Informed Consent Form (public-facing, requires signature)
INSERT INTO study_documents (
  id, experiment_id, document_type, title, description,
  status, clearance_level, uploaded_by, approved_by, approved_at,
  file_path, requires_signature, signature_due_date,
  content_html, created_at, updated_at
) VALUES (
  '00000000-0001-0000-0000-d00000000003',
  '00000000-0001-0000-0000-000000000001',
  'consent_form',
  'Informed Consent Form — Participant Copy',
  'Participant-facing informed consent document covering study procedures, risks/benefits, data use, and right to withdraw. Signature required before study commencement.',
  'signed',
  'participant',
  'demo:researcher',
  'demo:researcher',
  now() - interval '15 days',
  NULL,
  true,
  (now() - interval '11 days')::date,
  E'<h2>INFORMED CONSENT TO PARTICIPATE IN RESEARCH</h2>'
  '<p><strong>Study Title:</strong> Gut-Brain Microbiome Intervention Study (GBM-2024-01)</p>'
  '<p><strong>Principal Investigator:</strong> Dr. S. Chen, Stanford Medicine</p>'
  '<p><strong>Sponsor:</strong> Biome Inc.</p>'
  '<h3>Purpose</h3>'
  '<p>You are being asked to take part in a research study. The purpose of this study is to understand how dietary patterns affect gut microbiome diversity and cognitive performance.</p>'
  '<h3>Procedures</h3>'
  '<p>If you agree to participate, you will be asked to: (1) Complete weekly food journals for 8 weeks; (2) Collect and return three stool samples using the provided kit; (3) Complete cognitive self-assessment surveys at weeks 1 and 8.</p>'
  '<h3>Risks</h3>'
  '<p>This study involves minimal risk. Sample collection is non-invasive and self-administered.</p>'
  '<h3>Compensation</h3>'
  '<p>You will receive compensation of up to $240 for completing all study milestones.</p>'
  '<h3>Confidentiality</h3>'
  '<p>Your identity will be pseudonymised. The research team will not have access to your identifying information.</p>'
  '<h3>Voluntary Participation</h3>'
  '<p>Your participation is entirely voluntary. You may withdraw at any time without penalty.</p>',
  now() - interval '16 days',
  now() - interval '11 days'
) ON CONFLICT (id) DO NOTHING;

-- Service Contract (operator-level, signed)
INSERT INTO study_documents (
  id, experiment_id, document_type, title, description,
  status, clearance_level, uploaded_by, approved_by, approved_at,
  file_path, requires_signature, created_at, updated_at
) VALUES (
  '00000000-0001-0000-0000-d00000000004',
  '00000000-0001-0000-0000-000000000001',
  'service_contract',
  'Biome Platform Service Agreement — GBM-2024-01',
  'Master service agreement between Biome Inc. and Biome Demo Lab covering platform use, data processing, logistics, and fee schedule for the GBM-2024-01 study.',
  'signed',
  'operator',
  'demo:researcher',
  'demo:researcher',
  now() - interval '25 days',
  NULL,
  true,
  now() - interval '26 days',
  now() - interval '25 days'
) ON CONFLICT (id) DO NOTHING;

-- HIPAA / Data Processing Agreement
INSERT INTO study_documents (
  id, experiment_id, document_type, title, description,
  status, clearance_level, uploaded_by, approved_by, approved_at,
  file_path, requires_signature, created_at, updated_at
) VALUES (
  '00000000-0001-0000-0000-d00000000005',
  '00000000-0001-0000-0000-000000000001',
  'data_sharing_agreement',
  'GDPR Data Processing Agreement (DPA)',
  'Data Processing Agreement under GDPR Article 28. Covers pseudonymisation procedures, data retention policy (2 years post-study), sub-processor list, and data subject rights process.',
  'approved',
  'operator',
  'demo:researcher',
  'demo:researcher',
  now() - interval '24 days',
  NULL,
  false,
  now() - interval '25 days',
  now() - interval '24 days'
) ON CONFLICT (id) DO NOTHING;

-- Screening questionnaire (participant-clearance)
INSERT INTO study_documents (
  id, experiment_id, document_type, title, description,
  status, clearance_level, uploaded_by, approved_by, approved_at,
  file_path, requires_signature, created_at, updated_at
) VALUES (
  '00000000-0001-0000-0000-d00000000006',
  '00000000-0001-0000-0000-000000000001',
  'screening_survey',
  'Pre-Screening Eligibility Survey',
  'Self-administered eligibility questionnaire covering dietary habits, medical history exclusions, and willingness to provide biological samples.',
  'approved',
  'participant',
  'demo:researcher',
  'demo:researcher',
  now() - interval '17 days',
  NULL,
  false,
  now() - interval '18 days',
  now() - interval '17 days'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 4. DOCUMENT SIGNATURES (consent form + service contract)
-- ────────────────────────────────────────────────────────────────

INSERT INTO document_signatures (
  id, document_id, signer_user_id, signer_name, signer_role,
  ip_address, user_agent, document_hash, document_version, signed_at
) VALUES (
  '00000000-0001-0000-0000-s00000000001',
  '00000000-0001-0000-0000-d00000000003',
  'demo:participant',
  'Alex Thornton',
  'participant',
  '82.45.188.214',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15',
  'sha256:demo_hash_consent_form_v1_not_real',
  1,
  now() - interval '11 days'
) ON CONFLICT (document_id, signer_user_id) DO NOTHING;

INSERT INTO document_signatures (
  id, document_id, signer_user_id, signer_name, signer_role,
  ip_address, user_agent, document_hash, document_version, signed_at
) VALUES (
  '00000000-0001-0000-0000-s00000000002',
  '00000000-0001-0000-0000-d00000000004',
  'demo:researcher',
  'Dr. S. Chen',
  'researcher',
  '185.93.2.17',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0',
  'sha256:demo_hash_service_contract_v1_not_real',
  1,
  now() - interval '25 days'
) ON CONFLICT (document_id, signer_user_id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 5. DOCUMENT SEND LOG (consent form sent to participant)
-- ────────────────────────────────────────────────────────────────

INSERT INTO document_send_log (
  id, document_id, sent_to_email, sent_by,
  message, viewed_at, signed_at, created_at
) VALUES (
  '00000000-0001-0000-0000-l00000000001',
  '00000000-0001-0000-0000-d00000000003',
  'participant@biome.to',
  'demo:researcher',
  'Please review and sign the attached informed consent form before your study start date. If you have any questions, reply to this message.',
  now() - interval '12 days',
  now() - interval '11 days',
  now() - interval '13 days'
) ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 6. SAMPLE KITS (3 kits for the 3 collection timepoints)
-- ────────────────────────────────────────────────────────────────

-- Kit 1: Baseline — shipped, collected, returned, results ready
INSERT INTO sample_kits (
  id, experiment_id, application_id, participant_id,
  kit_type, kit_contents, ship_status,
  tracking_number_outbound, shipped_at, delivered_at,
  collection_status, collection_due_date, collected_at,
  return_status, tracking_number_return, return_shipped_at,
  received_at_lab_at, lab_partner_name, lab_reference_number,
  results_ready_at, chain_of_custody_log, notes, created_at, updated_at
)
SELECT
  '00000000-0001-0000-0000-k00000000001',
  '00000000-0001-0000-0000-000000000001',
  a.id,
  'demo:participant',
  'stool',
  'OmniGene-Gut 2.0 collection tube, ice pack, prepaid return label (FedEx), instruction leaflet',
  'delivered',
  'FX794831200GB',
  now() - interval '13 days',
  now() - interval '11 days',
  'collected',
  (now() - interval '10 days')::date,
  now() - interval '9 days',
  'results_ready',
  'FX794831201GB',
  now() - interval '8 days',
  now() - interval '6 days',
  'BioRender Lab UK',
  'BRL-2024-GBM-001-P001',
  now() - interval '1 day',
  '[
    {"event": "kit_dispatched",    "timestamp": "2024-03-01T09:00:00Z", "actor": "ops"},
    {"event": "kit_delivered",     "timestamp": "2024-03-03T14:22:00Z", "actor": "courier"},
    {"event": "sample_collected",  "timestamp": "2024-03-04T07:15:00Z", "actor": "participant"},
    {"event": "return_shipped",    "timestamp": "2024-03-05T11:30:00Z", "actor": "participant"},
    {"event": "received_at_lab",   "timestamp": "2024-03-07T09:00:00Z", "actor": "lab"},
    {"event": "results_ready",     "timestamp": "2024-03-12T16:00:00Z", "actor": "lab"}
  ]'::jsonb,
  'Baseline kit. All returned on time.',
  now() - interval '14 days',
  now() - interval '1 day'
FROM applications a
WHERE a.experiment_id = '00000000-0001-0000-0000-000000000001'
  AND a.participant_id = 'demo:participant'
ON CONFLICT (id) DO NOTHING;

-- Kit 2: Week 4 — shipped, in transit back
INSERT INTO sample_kits (
  id, experiment_id, application_id, participant_id,
  kit_type, kit_contents, ship_status,
  tracking_number_outbound, shipped_at, delivered_at,
  collection_status, collection_due_date, collected_at,
  return_status, tracking_number_return, return_shipped_at,
  chain_of_custody_log, notes, created_at, updated_at
)
SELECT
  '00000000-0001-0000-0000-k00000000002',
  '00000000-0001-0000-0000-000000000001',
  a.id,
  'demo:participant',
  'stool',
  'OmniGene-Gut 2.0 collection tube, ice pack, prepaid return label (FedEx), instruction leaflet',
  'delivered',
  'FX794831202GB',
  now() - interval '5 days',
  now() - interval '3 days',
  'collected',
  (now() - interval '2 days')::date,
  now() - interval '2 days',
  'in_transit',
  'FX794831203GB',
  now() - interval '1 day',
  '[
    {"event": "kit_dispatched",   "timestamp": "2024-03-08T09:00:00Z", "actor": "ops"},
    {"event": "kit_delivered",    "timestamp": "2024-03-10T13:45:00Z", "actor": "courier"},
    {"event": "sample_collected", "timestamp": "2024-03-11T08:00:00Z", "actor": "participant"},
    {"event": "return_shipped",   "timestamp": "2024-03-12T10:00:00Z", "actor": "participant"}
  ]'::jsonb,
  'Week 4 kit. Return in transit — expected at lab tomorrow.',
  now() - interval '6 days',
  now()
FROM applications a
WHERE a.experiment_id = '00000000-0001-0000-0000-000000000001'
  AND a.participant_id = 'demo:participant'
ON CONFLICT (id) DO NOTHING;

-- Kit 3: Week 8 — not yet shipped (upcoming)
INSERT INTO sample_kits (
  id, experiment_id, application_id, participant_id,
  kit_type, kit_contents, ship_status,
  collection_status, collection_due_date,
  return_status, chain_of_custody_log, notes, created_at, updated_at
)
SELECT
  '00000000-0001-0000-0000-k00000000003',
  '00000000-0001-0000-0000-000000000001',
  a.id,
  'demo:participant',
  'stool',
  'OmniGene-Gut 2.0 collection tube, ice pack, prepaid return label (FedEx), instruction leaflet',
  'pending',
  'awaiting',
  (now() + interval '24 days')::date,
  'not_started',
  '[]'::jsonb,
  'Week 8 final kit — scheduled to dispatch next week.',
  now(),
  now()
FROM applications a
WHERE a.experiment_id = '00000000-0001-0000-0000-000000000001'
  AND a.participant_id = 'demo:participant'
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 7. STUDY MESSAGES (new schema from 023 — pseudonymised chat)
-- ────────────────────────────────────────────────────────────────

DO $$
DECLARE demo_exp uuid := '00000000-0001-0000-0000-000000000001';
BEGIN
  -- Only insert if the new study_messages schema exists
  -- (has sender_type column, confirming 023 has run)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'study_messages' AND column_name = 'sender_type'
  ) THEN
    INSERT INTO study_messages (
      id, experiment_id,
      sender_type, sender_study_participant_id,
      recipient_type, recipient_study_participant_id,
      message_text, message_type, read_at, created_at
    ) VALUES
    -- Researcher → Participant: welcome
    ( '00000000-0001-0000-0000-m00000000001', demo_exp,
      'researcher', NULL, 'participant', 'GBM-P001',
      E'Welcome to the Gut-Brain Microbiome Study, P001-Teal-Falcon.\n\nYour baseline sample kit has been dispatched and should arrive within 2 working days (tracking: FX794831200GB).\n\nPlease review the consent form sent to your registered email before starting. Reply here if you have any questions.',
      'text', now() - interval '12 days', now() - interval '13 days' ),

    -- Participant → Researcher: question
    ( '00000000-0001-0000-0000-m00000000002', demo_exp,
      'participant', 'GBM-P001', 'researcher', NULL,
      'Hi, I received the kit today. Quick question — the instructions say to collect in the morning. Is there a specific time window I should aim for?',
      'text', now() - interval '10 days', now() - interval '11 days' ),

    -- Researcher → Participant: answer
    ( '00000000-0001-0000-0000-m00000000003', demo_exp,
      'researcher', NULL, 'participant', 'GBM-P001',
      E'Great question! Aim to collect within the first 4 hours of waking for the most consistent results. Avoid collecting if you''ve had antibiotics, probiotics, or alcohol in the 48h prior.\n\nYou can store the sealed tube in your fridge (not freezer) for up to 24h before posting.',
      'text', now() - interval '9 days', now() - interval '10 days' ),

    -- Participant → Researcher: confirmation
    ( '00000000-0001-0000-0000-m00000000004', demo_exp,
      'participant', 'GBM-P001', 'researcher', NULL,
      'Perfect, thank you. Sample collected this morning and posted via the return label. Also completed the Week 2 food journal — should that be uploaded anywhere or does the system capture it automatically?',
      'text', now() - interval '8 days', now() - interval '8 days' ),

    -- Researcher → Participant: instructions
    ( '00000000-0001-0000-0000-m00000000005', demo_exp,
      'researcher', NULL, 'participant', 'GBM-P001',
      E'Excellent work — your sample is showing as received at the lab.\n\nFor the food journal: log your meals in the Milestone section of the study portal. Click "Week 2 – Food Journal" and use the text field. Don''t worry about exact portions — estimates are fine.\n\nYour first compensation payment of $60 will be processed once the lab confirms your Week 2 sample. Typically 5–7 working days.',
      'text', now() - interval '7 days', now() - interval '7 days' ),

    -- Researcher broadcast: Week 4 reminder
    ( '00000000-0001-0000-0000-m00000000006', demo_exp,
      'researcher', NULL, 'all_participants', NULL,
      E'[STUDY UPDATE — Week 4]\n\nYour Week 4 sample kits have been dispatched today. All research partners should expect delivery within 2 working days.\n\nPlease remember:\n• Collect on a weekday morning if possible\n• Post within 24h of collection\n• Complete the mid-study food journal before Week 5\n\nYou''re doing brilliantly — halfway there!',
      'system_notice', now() - interval '5 days', now() - interval '5 days' )

    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Demo study_messages inserted (new schema)';
  ELSE
    RAISE NOTICE 'study_messages still on old schema — skipping message seed';
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 8. UPDATE SLOTS_FILLED on demo experiment to reflect seed data
-- ────────────────────────────────────────────────────────────────

UPDATE experiments
SET slots_filled = 1
WHERE id = '00000000-0001-0000-0000-000000000001'
  AND slots_filled < 1;

COMMIT;

-- ============================================================================
-- STEP 3 of 3 — migration 027: OME agent (tables, RPC, India facility seed)
-- ============================================================================
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
 'manual', true),

-- ── Tier 2 city facilities ────────────────────────────────────────

('PGI Chandigarh — Gastroenterology OPD', 'specialty_clinic', 'Chandigarh', 'Punjab', 'tier2',
 true, true, true, true,
 ARRAY['blood_tests','stool_tests','biomarker_panel','biopsy','microbiome','pathology'],
 'manual', true),

('Jaipur Golden Hospital', 'hospital', 'Jaipur', 'Rajasthan', 'tier2',
 true, false, true, false,
 ARRAY['blood_tests','ecg','biomarker_panel','mri','ct','pathology'],
 'manual', true),

('AIIMS Nagpur', 'research_centre', 'Nagpur', 'Maharashtra', 'tier2',
 true, true, true, true,
 ARRAY['blood_tests','stool_tests','biopsy','biomarker_panel','mri','ecg','eeg','pathology','genomics'],
 'manual', true),

('Deenanath Mangeshkar Hospital — Neurology', 'specialty_clinic', 'Pune', 'Maharashtra', 'tier2',
 true, false, true, true,
 ARRAY['blood_tests','mri','ecg','eeg','biomarker_panel'],
 'manual', true),

('Amrita Institute of Medical Sciences — Kochi', 'hospital', 'Kochi', 'Kerala', 'tier2',
 true, true, true, true,
 ARRAY['blood_tests','stool_tests','biopsy','biomarker_panel','mri','ecg','eeg','genomics','pathology','microbiome'],
 'manual', true),

('Nizam''s Institute of Medical Sciences', 'research_centre', 'Hyderabad', 'Telangana', 'tier1',
 true, true, true, true,
 ARRAY['blood_tests','biopsy','biomarker_panel','mri','ecg','eeg','pathology','genomics'],
 'manual', true),

('PSG Hospitals — Gastroenterology', 'specialty_clinic', 'Coimbatore', 'Tamil Nadu', 'tier2',
 true, false, true, false,
 ARRAY['blood_tests','stool_tests','biomarker_panel','biopsy','microbiome','pathology'],
 'manual', true),

('New Civil Hospital Surat — Cardiology', 'specialty_clinic', 'Surat', 'Gujarat', 'tier2',
 false, false, true, false,
 ARRAY['blood_tests','ecg','biomarker_panel'],
 'manual', false),

('Baroda Medical College Hospital', 'hospital', 'Vadodara', 'Gujarat', 'tier2',
 false, true, false, true,
 ARRAY['blood_tests','stool_tests','biopsy','biomarker_panel','mri','ecg','pathology'],
 'manual', true),

('AIIMS Bhopal', 'research_centre', 'Bhopal', 'Madhya Pradesh', 'tier2',
 true, true, true, true,
 ARRAY['blood_tests','stool_tests','biopsy','biomarker_panel','mri','ecg','eeg','genomics','pathology','microbiome'],
 'manual', true),

-- ── Specialist & diagnostic facilities ───────────────────────────

('Thyrocare Technologies — National Network', 'diagnostic_lab', 'Navi Mumbai', 'Maharashtra', 'tier1',
 false, true, true, false,
 ARRAY['blood_tests','stool_tests','biomarker_panel','microbiome','genomics','urine_tests'],
 'manual', true),

('Manipal-ACuitas Microbiome Lab', 'diagnostic_lab', 'Bengaluru', 'Karnataka', 'tier1',
 false, true, false, false,
 ARRAY['stool_tests','microbiome','blood_tests','genomics','biomarker_panel'],
 'manual', true),

('Kovai Medical Center and Hospital — Neurology', 'specialty_clinic', 'Coimbatore', 'Tamil Nadu', 'tier2',
 true, false, false, false,
 ARRAY['blood_tests','mri','ecg','eeg','biomarker_panel'],
 'manual', true),

('Suyog Diagnostics Imaging Centre', 'imaging_centre', 'Pune', 'Maharashtra', 'tier2',
 false, true, true, false,
 ARRAY['mri','ct','blood_tests'],
 'manual', false),

('Sterling Hospitals — Cardiology', 'specialty_clinic', 'Ahmedabad', 'Gujarat', 'tier1',
 true, false, true, true,
 ARRAY['blood_tests','ecg','biomarker_panel','mri','ct'],
 'manual', true)

ON CONFLICT DO NOTHING;

COMMIT;

-- ================================================================
-- END MIGRATION 027 — OME Agent
-- ================================================================

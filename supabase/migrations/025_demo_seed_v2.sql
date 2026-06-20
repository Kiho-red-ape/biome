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
  '00000000-0001-0000-0000-c00000000001',
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
  '00000000-0001-0000-0000-c00000000002',
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
  message, viewed_at, signed_at, sent_at
) VALUES (
  '00000000-0001-0000-0000-f00000000001',
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
  '00000000-0001-0000-0000-b00000000001',
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
  '00000000-0001-0000-0000-b00000000002',
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
  '00000000-0001-0000-0000-b00000000003',
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
    ( '00000000-0001-0000-0000-e00000000001', demo_exp,
      'researcher', NULL, 'participant', 'GBM-P001',
      E'Welcome to the Gut-Brain Microbiome Study, P001-Teal-Falcon.\n\nYour baseline sample kit has been dispatched and should arrive within 2 working days (tracking: FX794831200GB).\n\nPlease review the consent form sent to your registered email before starting. Reply here if you have any questions.',
      'text', now() - interval '12 days', now() - interval '13 days' ),

    -- Participant → Researcher: question
    ( '00000000-0001-0000-0000-e00000000002', demo_exp,
      'participant', 'GBM-P001', 'researcher', NULL,
      'Hi, I received the kit today. Quick question — the instructions say to collect in the morning. Is there a specific time window I should aim for?',
      'text', now() - interval '10 days', now() - interval '11 days' ),

    -- Researcher → Participant: answer
    ( '00000000-0001-0000-0000-e00000000003', demo_exp,
      'researcher', NULL, 'participant', 'GBM-P001',
      E'Great question! Aim to collect within the first 4 hours of waking for the most consistent results. Avoid collecting if you''ve had antibiotics, probiotics, or alcohol in the 48h prior.\n\nYou can store the sealed tube in your fridge (not freezer) for up to 24h before posting.',
      'text', now() - interval '9 days', now() - interval '10 days' ),

    -- Participant → Researcher: confirmation
    ( '00000000-0001-0000-0000-e00000000004', demo_exp,
      'participant', 'GBM-P001', 'researcher', NULL,
      'Perfect, thank you. Sample collected this morning and posted via the return label. Also completed the Week 2 food journal — should that be uploaded anywhere or does the system capture it automatically?',
      'text', now() - interval '8 days', now() - interval '8 days' ),

    -- Researcher → Participant: instructions
    ( '00000000-0001-0000-0000-e00000000005', demo_exp,
      'researcher', NULL, 'participant', 'GBM-P001',
      E'Excellent work — your sample is showing as received at the lab.\n\nFor the food journal: log your meals in the Milestone section of the study portal. Click "Week 2 – Food Journal" and use the text field. Don''t worry about exact portions — estimates are fine.\n\nYour first compensation payment of $60 will be processed once the lab confirms your Week 2 sample. Typically 5–7 working days.',
      'text', now() - interval '7 days', now() - interval '7 days' ),

    -- Researcher broadcast: Week 4 reminder
    ( '00000000-0001-0000-0000-e00000000006', demo_exp,
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

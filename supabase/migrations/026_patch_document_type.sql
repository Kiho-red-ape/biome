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

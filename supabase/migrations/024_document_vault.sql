-- ================================================================
-- MIGRATION 024 — Document Vault
-- study_documents, document_signatures, document_send_log
-- ================================================================
--
-- BEFORE RUNNING: Create the Supabase Storage bucket manually:
--   Supabase Dashboard → Storage → New bucket
--   Name: study-documents
--   Public: NO  (all access via signed URLs through API)
--   File size limit: 52428800 (50 MB)
--   Allowed MIME types: application/pdf, application/msword,
--     application/vnd.openxmlformats-officedocument.wordprocessingml.document,
--     image/jpeg, image/png
--
-- ================================================================

BEGIN;

-- ── study_documents ──────────────────────────────────────────────────────────
-- One row per document version. Superseded docs kept for audit trail.

CREATE TABLE IF NOT EXISTS study_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,

  -- Classification
  document_type text NOT NULL CHECK (document_type IN (
    'irb_approval',           -- Ethics/IRB clearance certificate
    'study_protocol',         -- Full technical protocol
    'amendment',              -- Protocol amendment
    'participant_info_sheet', -- Lay-language participant information sheet
    'consent_form',           -- Informed consent template (Biome-generated)
    'service_contract',       -- Biome ↔ Sponsor master service agreement
    'researcher_agreement',   -- Individual PI agreement with Biome
    'sponsor_authorization',  -- Sponsor authorisation letter
    'data_sharing_agreement', -- DPA / data processing agreement
    'insurance_certificate',  -- Study insurance
    'regulatory_filing',      -- Any regulatory submissions
    'lab_agreement',          -- Lab partner agreement
    'pi_credentials',         -- PI qualifications / CV
    'other'
  )),
  title        text NOT NULL,
  description  text,

  -- Access control
  -- operator    = Biome ops only
  -- researcher  = study owner + ops
  -- participant = enrolled participants + researcher + ops
  -- public      = no auth required
  clearance_level text NOT NULL DEFAULT 'researcher'
    CHECK (clearance_level IN ('operator','researcher','participant','public')),

  -- File (stored in Supabase Storage bucket: study-documents)
  file_path        text,   -- e.g. {experiment_id}/{document_type}/{uuid}.pdf
  file_name        text,
  file_size_bytes  integer,
  mime_type        text,

  -- Versioning
  version        integer NOT NULL DEFAULT 1,
  supersedes_id  uuid REFERENCES study_documents(id),

  -- Lifecycle status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',              -- Uploaded, not yet submitted
    'pending_review',     -- Submitted to Biome for review
    'pending_signature',  -- Contract sent, awaiting countersignature
    'signed',             -- All required signatures captured
    'approved',           -- Biome-approved (e.g. consent form)
    'rejected',           -- Biome rejected — needs revision
    'expired'             -- Past expiry date
  )),

  -- Signature requirements
  requires_signature   boolean DEFAULT false,
  signature_due_date   date,

  -- Notes from ops review
  review_notes text,

  -- Who
  uploaded_by  text NOT NULL,  -- privy DID
  reviewed_by  text,           -- privy DID of ops reviewer
  approved_by  text,

  -- Timestamps
  approved_at  timestamptz,
  expires_at   timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),

  -- Inline content (for Biome-generated contracts rendered as HTML, no upload needed)
  content_html text,
  content_hash text  -- SHA-256 of content_html at time of approval
);

CREATE INDEX IF NOT EXISTS idx_docs_experiment ON study_documents(experiment_id);
CREATE INDEX IF NOT EXISTS idx_docs_type       ON study_documents(experiment_id, document_type);
CREATE INDEX IF NOT EXISTS idx_docs_status     ON study_documents(status);

-- ── document_signatures ──────────────────────────────────────────────────────
-- Immutable audit trail. One row per signer per document version.

CREATE TABLE IF NOT EXISTS document_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES study_documents(id) ON DELETE CASCADE,

  signer_user_id text NOT NULL,   -- privy DID
  signer_name    text NOT NULL,   -- Full legal name entered at time of signing
  signer_email   text,
  signer_role    text NOT NULL CHECK (signer_role IN (
    'researcher','sponsor','participant','operator','witness'
  )),

  -- Audit
  ip_address          text,
  user_agent          text,
  signed_at           timestamptz NOT NULL DEFAULT now(),
  document_version    integer     NOT NULL,
  document_hash       text,       -- Hash of content at time of signing

  UNIQUE (document_id, signer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_sigs_document ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_sigs_signer   ON document_signatures(signer_user_id);

-- ── document_send_log ────────────────────────────────────────────────────────
-- Tracks every "send for signature" action for audit.

CREATE TABLE IF NOT EXISTS document_send_log (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id    uuid        NOT NULL REFERENCES study_documents(id) ON DELETE CASCADE,
  sent_to_email  text        NOT NULL,
  sent_to_user_id text,
  sent_by        text        NOT NULL,  -- privy DID
  message        text,
  sent_at        timestamptz DEFAULT now(),
  viewed_at      timestamptz,
  signed_at      timestamptz
);

CREATE INDEX IF NOT EXISTS idx_sendlog_document ON document_send_log(document_id);

-- ── Auto-update updated_at ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_study_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS study_documents_updated_at ON study_documents;
CREATE TRIGGER study_documents_updated_at
  BEFORE UPDATE ON study_documents
  FOR EACH ROW EXECUTE FUNCTION update_study_documents_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- All access via service role (API routes) — direct client access denied.

ALTER TABLE study_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_send_log  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "docs_deny_direct"    ON study_documents;
DROP POLICY IF EXISTS "sigs_deny_direct"    ON document_signatures;
DROP POLICY IF EXISTS "sendlog_deny_direct" ON document_send_log;

CREATE POLICY "docs_deny_direct"    ON study_documents    USING (false);
CREATE POLICY "sigs_deny_direct"    ON document_signatures USING (false);
CREATE POLICY "sendlog_deny_direct" ON document_send_log  USING (false);

COMMIT;

-- ================================================================
-- REQUIRED DOCUMENTS MATRIX (reference — not enforced in DB)
-- Every study:     irb_approval, study_protocol, service_contract,
--                  researcher_agreement, consent_form,
--                  participant_info_sheet
-- + samples:       lab_agreement
-- + external fund: sponsor_authorization, data_sharing_agreement
-- + any study:     insurance_certificate (optional but recommended)
-- ================================================================

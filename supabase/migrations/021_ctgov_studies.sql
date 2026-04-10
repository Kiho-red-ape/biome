-- Migration 021: ClinicalTrials.gov studies table
-- Read-only discovery layer. Studies are synced via scripts/sync-ctgov.ts.

CREATE TABLE IF NOT EXISTS ctgov_studies (
  id                  text PRIMARY KEY,       -- NCT number
  nct_id              text UNIQUE NOT NULL,
  title               text NOT NULL,
  brief_summary       text,
  conditions          text[],
  interventions       text[],
  intervention_types  text[],
  phase               text,
  status              text,
  sponsor_name        text,
  sponsor_class       text,                   -- 'INDUSTRY', 'NIH', 'ACADEMIC', 'OTHER'
  start_date          date,
  completion_date     date,
  minimum_age         text,
  maximum_age         text,
  sex                 text,
  healthy_volunteers  boolean,
  enrollment_count    integer,
  locations           jsonb,                  -- [{facility, city, state, country}]
  eligibility_criteria text,
  contact_name        text,
  contact_email       text,
  contact_phone       text,
  ctgov_url           text NOT NULL,
  biome_category      text,                   -- 'microbiome','nutrition','sleep','wearables','longevity','quantified_self','other'
  has_compensation    boolean DEFAULT false,
  last_synced_at      timestamptz NOT NULL,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ctgov_status
  ON ctgov_studies(status);

CREATE INDEX IF NOT EXISTS idx_ctgov_category
  ON ctgov_studies(biome_category);

CREATE INDEX IF NOT EXISTS idx_ctgov_conditions
  ON ctgov_studies USING gin(conditions);

CREATE INDEX IF NOT EXISTS idx_ctgov_interventions
  ON ctgov_studies USING gin(interventions);

CREATE INDEX IF NOT EXISTS idx_ctgov_fulltext
  ON ctgov_studies USING gin(
    to_tsvector('english', title || ' ' || coalesce(brief_summary, ''))
  );

-- Public read access (no auth required for registry browsing)
ALTER TABLE ctgov_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ctgov_studies_public_read"
  ON ctgov_studies FOR SELECT
  USING (true);

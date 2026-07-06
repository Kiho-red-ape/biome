-- ================================================================
-- MIGRATION 034 — Content translations cache
-- Caches AI translations of participant-facing content (Tamil,
-- Hindi, German) keyed by content hash + language, so each piece
-- of content is translated once and served instantly after.
-- ================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS content_translations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_hash text        NOT NULL,      -- SHA-256 of the source text
  lang         text        NOT NULL CHECK (lang IN ('ta','hi','de')),
  source_kind  text        DEFAULT 'generic',   -- 'icf' | 'lesson' | 'study' | 'generic'
  translated   text        NOT NULL,
  model_used   text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (content_hash, lang)
);

CREATE INDEX IF NOT EXISTS idx_translations_hash ON content_translations(content_hash);

ALTER TABLE content_translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "content_translations_deny" ON content_translations;
CREATE POLICY "content_translations_deny" ON content_translations USING (false);

COMMIT;

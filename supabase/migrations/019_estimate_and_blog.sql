-- Migration 019: Estimate leads + blog system

-- ── Estimate leads (from /estimate email gate) ───────────────────────────────
CREATE TABLE IF NOT EXISTS estimate_leads (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text        NOT NULL,
  organization       text,
  study_type         text,
  sponsor_type       text,
  participants       integer,
  duration           text,
  geography          text[],
  samples            text[],
  irb_status         text,
  estimated_total    integer,
  estimated_ops_fee  integer,
  estimate_breakdown jsonb,
  contacted          boolean     NOT NULL DEFAULT false,
  contacted_at       timestamptz,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE estimate_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "estimate_leads: service role only" ON estimate_leads;
CREATE POLICY "estimate_leads: service role only"
  ON estimate_leads FOR ALL USING (true);

-- ── Blog posts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text        UNIQUE NOT NULL,
  title           text        NOT NULL,
  excerpt         text,
  content         text        NOT NULL DEFAULT '',
  cover_image_url text,
  author          text        NOT NULL DEFAULT 'Kishore Ramesh Kumar',
  tags            text[]      NOT NULL DEFAULT '{}',
  status          text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_slug   ON blog_posts(slug);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blog_posts: public read published" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts: service role write"    ON blog_posts;
CREATE POLICY "blog_posts: public read published"
  ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "blog_posts: service role write"
  ON blog_posts FOR ALL USING (true);

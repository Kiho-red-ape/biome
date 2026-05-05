-- Migration 017: Blog posts with three-section structure
-- hook (public, top of fold) · content (substance, always visible) · gated artifact (email required)

create table blog_posts (
  id                    uuid primary key default gen_random_uuid(),
  author_id             text references profiles(id) on delete set null,
  title                 text not null,
  slug                  text unique not null,

  -- Three content sections
  hook                  text not null default '',           -- public teaser, top of fold
  content               text not null default '',           -- full article body, always visible
  gated_artifact_url    text,                               -- download URL (PDF/image)
  gated_artifact_label  text,                               -- e.g. "Download the planning worksheet"
  gated_artifact_type   text check (gated_artifact_type in ('pdf', 'image')),

  -- Publishing
  status                text not null default 'draft'
                          check (status in ('draft', 'published')),
  published_at          timestamptz,

  -- Metadata
  tags                  text[] not null default '{}',

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index blog_posts_author_idx  on blog_posts (author_id);
create index blog_posts_status_idx  on blog_posts (status);
create index blog_posts_slug_idx    on blog_posts (slug);

-- ── Artifact email captures ─────────────────────────────────────────────────
-- Stores emails collected at the gated artifact download gate

create table blog_artifact_leads (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references blog_posts(id) on delete cascade,
  email       text not null,
  captured_at timestamptz not null default now()
);

create index blog_artifact_leads_post_idx on blog_artifact_leads (post_id);
create unique index blog_artifact_leads_dedup on blog_artifact_leads (post_id, email);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Note: app uses service client for all mutations, so RLS is a safety layer

alter table blog_posts          enable row level security;
alter table blog_artifact_leads enable row level security;

-- Published posts are publicly readable
create policy "blog_posts_public_read"
  on blog_posts for select
  using (status = 'published');

-- Authors can read their own posts (including drafts)
create policy "blog_posts_author_select"
  on blog_posts for select
  using (author_id = auth.uid()::text);

-- Service client bypasses RLS; these are belt-and-suspenders
create policy "blog_posts_author_insert"
  on blog_posts for insert
  with check (author_id = auth.uid()::text);

create policy "blog_posts_author_update"
  on blog_posts for update
  using (author_id = auth.uid()::text);

create policy "blog_posts_author_delete"
  on blog_posts for delete
  using (author_id = auth.uid()::text);

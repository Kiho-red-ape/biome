-- ============================================================
-- BIOME — Initial Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── Enums ───────────────────────────────────────────────────

create type auth_type as enum ('email', 'wallet');
create type user_role as enum ('experimenter', 'participant', 'both');
create type experiment_status as enum ('draft', 'recruiting', 'active', 'completed', 'cancelled');
create type application_status as enum ('applied', 'approved', 'rejected', 'completed', 'withdrawn');
create type payout_status as enum ('pending', 'paid', 'failed');
create type verification_level as enum ('none', 'biome', 'institutional');

-- ─── profiles ────────────────────────────────────────────────
-- id = Privy user DID (e.g. did:privy:xxxxx)

create table profiles (
  id              text primary key,          -- Privy DID
  auth_type       auth_type not null,
  wallet_address  text,
  display_name    text,
  bio             text,
  role            user_role not null default 'participant',
  region          text,
  avatar_url      text,
  created_at      timestamptz not null default now()
);

-- ─── experiments ─────────────────────────────────────────────

create table experiments (
  id                      uuid primary key default gen_random_uuid(),
  experimenter_id         text not null references profiles(id) on delete cascade,
  title                   text not null,
  description             text not null,
  category                text not null,
  status                  experiment_status not null default 'draft',
  bounty_per_participant  numeric(10, 2) not null default 0,
  total_bounty_pool       numeric(12, 2) not null default 0,
  slots_total             integer not null default 0,
  slots_filled            integer not null default 0,
  duration_weeks          integer,
  region                  text,
  is_remote               boolean not null default true,
  is_verified             boolean not null default false,
  verification_level      verification_level not null default 'none',
  external_comms_url      text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger experiments_updated_at
  before update on experiments
  for each row execute function update_updated_at();

-- ─── applications ─────────────────────────────────────────────

create table applications (
  id              uuid primary key default gen_random_uuid(),
  experiment_id   uuid not null references experiments(id) on delete cascade,
  participant_id  text not null references profiles(id) on delete cascade,
  status          application_status not null default 'applied',
  applied_at      timestamptz not null default now(),
  approved_at     timestamptz,
  completed_at    timestamptz,
  payout_status   payout_status not null default 'pending',
  unique(experiment_id, participant_id)   -- one application per experiment per person
);

-- ─── comments ─────────────────────────────────────────────────

create table comments (
  id              uuid primary key default gen_random_uuid(),
  experiment_id   uuid not null references experiments(id) on delete cascade,
  author_id       text not null references profiles(id) on delete cascade,
  content         text not null,
  parent_id       uuid references comments(id) on delete cascade,  -- null = top-level
  created_at      timestamptz not null default now()
);

-- ─── experiment_updates ───────────────────────────────────────

create table experiment_updates (
  id              uuid primary key default gen_random_uuid(),
  experiment_id   uuid not null references experiments(id) on delete cascade,
  author_id       text not null references profiles(id) on delete cascade,
  title           text not null,
  content         text not null,
  created_at      timestamptz not null default now()
);

-- ─── Row Level Security ───────────────────────────────────────

alter table profiles           enable row level security;
alter table experiments        enable row level security;
alter table applications       enable row level security;
alter table comments           enable row level security;
alter table experiment_updates enable row level security;

-- profiles: public read, anyone can insert their own, self-edit only
create policy "profiles: public read"
  on profiles for select using (true);

create policy "profiles: insert own"
  on profiles for insert with check (true);  -- enforced at app layer via service role

create policy "profiles: update own"
  on profiles for update using (true);       -- enforced at app layer via service role

-- experiments: public read, write via service role only
create policy "experiments: public read"
  on experiments for select using (true);

create policy "experiments: service role write"
  on experiments for all using (true);       -- app layer checks experimenter_id

-- applications: read own (participant) or read own experiments' (experimenter)
create policy "applications: public read"
  on applications for select using (true);   -- scoped further at app layer

create policy "applications: service role write"
  on applications for all using (true);

-- comments: all read, authenticated write (enforced at app layer)
create policy "comments: public read"
  on comments for select using (true);

create policy "comments: service role write"
  on comments for all using (true);

-- experiment_updates: public read
create policy "experiment_updates: public read"
  on experiment_updates for select using (true);

create policy "experiment_updates: service role write"
  on experiment_updates for all using (true);

-- ─── Indexes ─────────────────────────────────────────────────

create index idx_experiments_status         on experiments(status);
create index idx_experiments_experimenter   on experiments(experimenter_id);
create index idx_experiments_verified       on experiments(is_verified);
create index idx_applications_participant   on applications(participant_id);
create index idx_applications_experiment    on applications(experiment_id);
create index idx_comments_experiment        on comments(experiment_id);
create index idx_comments_parent            on comments(parent_id);

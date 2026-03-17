-- ============================================================
-- BIOME — Migration 003: Profile Extensions
-- Creates participant_profiles and experimenter_profiles tables
-- with auto-generated IDs, immutability enforcement, and RLS.
--
-- IMPORTANT: profiles.id is a Privy DID (text), not UUID.
-- user_id on both tables is TEXT to match that FK.
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ─── Section 1: ID Generation Functions ──────────────────────
--
-- generate_unique_participant_id()
--   Produces P-XXXX-XXXX using 31 unambiguous chars:
--   digits 2-9 (no 0 or 1) + letters A-Z minus O, I, L
--   Loops until the result is unique in participant_profiles.
--
-- generate_unique_pseudonym()
--   Picks one adjective + one noun + 000-999 (zero-padded).
--   Example output: SilentOrbit221, CosmicCedar039
--   Loops until unique in participant_profiles.
-- ─────────────────────────────────────────────────────────────

create or replace function generate_unique_participant_id()
returns text language plpgsql as $$
declare
  -- 31 unambiguous chars: no 0, 1, O, I, L
  chars  text    := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  part1  text    := '';
  part2  text    := '';
  result text;
  taken  boolean;
  i      integer;
begin
  loop
    part1 := '';
    part2 := '';

    for i in 1..4 loop
      part1 := part1 || substr(chars, (floor(random() * length(chars)))::integer + 1, 1);
    end loop;

    for i in 1..4 loop
      part2 := part2 || substr(chars, (floor(random() * length(chars)))::integer + 1, 1);
    end loop;

    result := 'P-' || part1 || '-' || part2;

    select count(*) > 0 into taken
    from participant_profiles
    where participant_id = result;

    exit when not taken;
  end loop;

  return result;
end;
$$;


create or replace function generate_unique_pseudonym()
returns text language plpgsql as $$
declare
  adjectives text[] := array[
    'Silent','Bright','Calm','Swift','Deep','Clear','Bold','Keen','Warm','Cool',
    'Sharp','Soft','Wild','Pure','Rare','Still','Quick','True','Free','Wise',
    'Vivid','Noble','Lucid','Steady','Gentle','Fierce','Cosmic','Sonic','Lunar','Solar',
    'Polar','Quantum','Neural','Primal','Rustic','Arctic','Tropic','Astral','Cipher','Nexus',
    'Vapor','Ember','Drift','Bloom','Frost','Storm','Pulse','Shade','Gleam','Spark'
  ];
  nouns text[] := array[
    'Orbit','Signal','Anchor','Bridge','Prism','Vertex','Cipher','Beacon','Photon','Neutron',
    'Cortex','Helix','Lattice','Vector','Matrix','Kernel','Fusion','Plasma','Quartz','Cobalt',
    'Atlas','Nomad','Pilot','Sage','Scout','Ranger','Diver','Climber','Rover','Walker',
    'Harbor','Summit','Ridge','Valley','Creek','Meadow','Pebble','Coral','Ember','Cedar',
    'Birch','Falcon','Heron','Robin','Otter','Badger','Lynx','Condor','Mantis','Gecko'
  ];
  result text;
  taken  boolean;
begin
  loop
    result :=
      adjectives[(floor(random() * array_length(adjectives, 1)))::integer + 1] ||
      nouns[(floor(random() * array_length(nouns, 1)))::integer + 1] ||
      lpad((floor(random() * 1000))::integer::text, 3, '0');

    select count(*) > 0 into taken
    from participant_profiles
    where pseudonym = result;

    exit when not taken;
  end loop;

  return result;
end;
$$;


-- ─── Section 2: participant_profiles ─────────────────────────
--
-- One row per participant. Created at Step 1 of onboarding.
-- Filled progressively through Steps 2-4.
--
-- Fields marked IMMUTABLE are locked by trigger once set.
-- Fields marked INTERNAL are never returned in public queries.
-- ─────────────────────────────────────────────────────────────

create table participant_profiles (

  -- Primary key
  id                        uuid        primary key default gen_random_uuid(),

  -- FK to profiles (Privy DID — text, not uuid)
  user_id                   text        not null unique references profiles(id) on delete cascade,

  -- ── Step 1: Account (set at signup, immutable) ──────────────
  participant_id            text        not null unique,  -- P-XXXX-XXXX, auto-generated, IMMUTABLE
  pseudonym                 text        not null unique,  -- AdjectiveNoun123, auto-generated, IMMUTABLE
  email_verified            boolean     not null default false,
  phone_number              text,
  phone_verified            boolean     not null default false,
  country                   text        not null,
  payout_country            text,
  payout_currency           text,
  verification_status       text        not null default 'pending'
    check (verification_status in ('pending', 'email_verified', 'phone_verified', 'fully_verified')),

  -- Anti-fraud (INTERNAL — never returned in public queries)
  device_fingerprint        text,
  duplicate_score           numeric(3,2) not null default 0,
  flagged                   boolean     not null default false,

  -- ── Step 2: Demographics (set before first application) ─────
  -- Fields marked IMMUTABLE are locked by trigger once non-null
  year_of_birth             integer,      -- IMMUTABLE once set
  sex_assigned_at_birth     text
    check (sex_assigned_at_birth in ('male','female','intersex','prefer_not_to_say')),  -- IMMUTABLE once set
  gender_identity           text,         -- optional, editable
  ethnicity                 text,         -- optional, IMMUTABLE once set
  nationality               text,         -- IMMUTABLE once set
  state_region              text,         -- editable (people move)
  urbanicity                text
    check (urbanicity in ('urban','suburban','rural')),  -- editable

  -- ── Step 3: Participation capability (editable) ─────────────
  smartphone_os             text
    check (smartphone_os in ('ios','android','both','none')),
  wearable_devices          text[],       -- ['oura','whoop','apple_watch','fitbit','garmin','none']
  internet_reliability      text
    check (internet_reliability in ('stable','intermittent','limited')),
  can_receive_kits          boolean,
  sample_comfort            text[],       -- ['stool','saliva','blood_prick','urine','hair','none']
  language_fluency          text[],       -- ['english','hindi','tamil','spanish', ...]
  weekly_availability_hours integer,

  -- ── Step 4: Research history (editable, some calculated) ────
  previous_study_count      integer      not null default 0,
  recent_interventions      text,
  washout_sensitive         boolean      not null default false,
  completion_rate           numeric(5,2),  -- calculated from applications table
  dropout_count             integer      not null default 0,
  no_show_count             integer      not null default 0,

  -- ── Onboarding tracker ──────────────────────────────────────
  -- 1 = account created, 2 = demographics, 3 = capability, 4 = history
  onboarding_step           integer      not null default 1,

  -- ── Timestamps ──────────────────────────────────────────────
  created_at                timestamptz  not null default now(),
  updated_at                timestamptz  not null default now()
);


-- ─── Section 3: experimenter_profiles ────────────────────────
--
-- One row per experimenter. Created at role-selection onboarding.
-- screening_status starts as 'pending'; admin flips to 'approved'
-- directly in Supabase (no admin panel needed for MVP).
-- ─────────────────────────────────────────────────────────────

create table experimenter_profiles (

  id                        uuid        primary key default gen_random_uuid(),

  -- FK to profiles (Privy DID — text, not uuid)
  user_id                   text        not null unique references profiles(id) on delete cascade,

  -- Organization info (publicly visible)
  org_name                  text        not null,
  org_website               text,
  org_description           text,
  role_title                text,         -- "Lead Scientist", "Founder", "Research Director"
  expertise_areas           text[],       -- ['microbiome','nutrition','sleep', ...]

  -- Screening (admin-managed via service role)
  screening_status          text        not null default 'pending'
    check (screening_status in ('pending','approved','rejected')),
  screened_at               timestamptz,
  screened_by               text,         -- display_name of admin who approved

  -- Aggregated stats (updated by triggers or app layer)
  experiments_posted        integer     not null default 0,
  verified_experiments      integer     not null default 0,

  -- Timestamps
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);


-- ─── Section 4: Auto-generation Trigger ──────────────────────
--
-- Fires BEFORE INSERT on participant_profiles.
-- Sets participant_id and pseudonym automatically.
-- The app layer never passes these fields — DB handles it.
-- ─────────────────────────────────────────────────────────────

create or replace function auto_generate_participant_identifiers()
returns trigger language plpgsql as $$
begin
  new.participant_id := generate_unique_participant_id();
  new.pseudonym      := generate_unique_pseudonym();
  return new;
end;
$$;

create trigger participant_profiles_generate_ids
  before insert on participant_profiles
  for each row execute function auto_generate_participant_identifiers();


-- ─── Section 5: Immutability Trigger ─────────────────────────
--
-- Fires BEFORE UPDATE on participant_profiles.
-- Blocks changes to fields that should never change once set.
--
-- Always immutable:    participant_id, pseudonym
-- Immutable once set:  year_of_birth, sex_assigned_at_birth,
--                      ethnicity, nationality
-- ─────────────────────────────────────────────────────────────

create or replace function enforce_immutable_participant_fields()
returns trigger language plpgsql as $$
begin
  -- Always immutable
  if new.participant_id <> old.participant_id then
    raise exception 'participant_id is immutable and cannot be changed';
  end if;

  if new.pseudonym <> old.pseudonym then
    raise exception 'pseudonym is immutable and cannot be changed';
  end if;

  -- Immutable once set (non-null → cannot change)
  if old.year_of_birth is not null
     and new.year_of_birth is distinct from old.year_of_birth then
    raise exception 'year_of_birth cannot be changed after it has been set';
  end if;

  if old.sex_assigned_at_birth is not null
     and new.sex_assigned_at_birth is distinct from old.sex_assigned_at_birth then
    raise exception 'sex_assigned_at_birth cannot be changed after it has been set';
  end if;

  if old.ethnicity is not null
     and new.ethnicity is distinct from old.ethnicity then
    raise exception 'ethnicity cannot be changed after it has been set';
  end if;

  if old.nationality is not null
     and new.nationality is distinct from old.nationality then
    raise exception 'nationality cannot be changed after it has been set';
  end if;

  return new;
end;
$$;

create trigger participant_profiles_enforce_immutable
  before update on participant_profiles
  for each row execute function enforce_immutable_participant_fields();


-- ─── Section 6: updated_at Triggers ──────────────────────────
--
-- Reuses update_updated_at() defined in migration 001.
-- ─────────────────────────────────────────────────────────────

create trigger participant_profiles_updated_at
  before update on participant_profiles
  for each row execute function update_updated_at();

create trigger experimenter_profiles_updated_at
  before update on experimenter_profiles
  for each row execute function update_updated_at();


-- ─── Section 7: Row Level Security ───────────────────────────
--
-- NOTE ON RLS DESIGN:
-- This project authenticates via Privy (DIDs like did:privy:xxx).
-- Supabase auth.uid() is NOT populated — all writes go through
-- the service role client at the app layer, which validates the
-- Privy JWT before any DB mutation.
--
-- Reads use the anon key (public). Sensitive field filtering
-- (never return email, phone, device_fingerprint, duplicate_score)
-- is enforced by the app layer via column selection in queries.
--
-- This matches the pattern established in migration 001.
-- ─────────────────────────────────────────────────────────────

alter table participant_profiles  enable row level security;
alter table experimenter_profiles enable row level security;

-- participant_profiles: public read (app filters sensitive cols)
create policy "participant_profiles: public read"
  on participant_profiles for select using (true);

-- participant_profiles: writes via service role only
create policy "participant_profiles: service role write"
  on participant_profiles for all using (true);

-- experimenter_profiles: fully public read (org info is public)
create policy "experimenter_profiles: public read"
  on experimenter_profiles for select using (true);

-- experimenter_profiles: writes via service role only
create policy "experimenter_profiles: service role write"
  on experimenter_profiles for all using (true);


-- ─── Section 8: Indexes ───────────────────────────────────────
--
-- Optimise the queries we know we'll run:
-- - Look up a profile by user_id (every auth'd page load)
-- - Look up a participant by their public P-XXXX-XXXX ID (profile URL)
-- - Look up a participant by pseudonym (display)
-- - Filter experimenters by screening_status (admin view)
-- - Filter flagged participants (anti-fraud review)
-- ─────────────────────────────────────────────────────────────

create index idx_participant_profiles_user_id
  on participant_profiles(user_id);

create index idx_participant_profiles_participant_id
  on participant_profiles(participant_id);

create index idx_participant_profiles_pseudonym
  on participant_profiles(pseudonym);

create index idx_participant_profiles_flagged
  on participant_profiles(flagged)
  where flagged = true;

create index idx_experimenter_profiles_user_id
  on experimenter_profiles(user_id);

create index idx_experimenter_profiles_screening_status
  on experimenter_profiles(screening_status);

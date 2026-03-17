-- ============================================================
-- BIOME — Migration 004: Reliability Score
-- Adds reliability_score to participant_profiles and a
-- BEFORE UPDATE trigger that auto-recalculates it whenever
-- completion_rate or previous_study_count changes.
--
-- Formula (from spec):
--   reliability_score =
--     (completion_rate * 0.6)
--     + (LEAST(previous_study_count, 20) / 20.0 * 100 * 0.4)
--
-- NOTE: spec uses "experiments_completed" — our column is
-- previous_study_count (same concept, different name).
-- Max possible score = 100 (100% completion rate + 20+ studies).
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ─── Add column ───────────────────────────────────────────────
-- IF NOT EXISTS guards against re-running this migration.

alter table participant_profiles
  add column if not exists reliability_score numeric(5,2) not null default 0;


-- ─── Trigger function ─────────────────────────────────────────
-- Fires BEFORE UPDATE on participant_profiles.
-- Recalculates reliability_score when the two input fields change.
-- Fires BETWEEN the immutability check and the updated_at setter
-- (alphabetical trigger order: enforce_immutable → reliability_score
--  → updated_at).
-- ─────────────────────────────────────────────────────────────

create or replace function update_reliability_score()
returns trigger language plpgsql as $$
begin
  -- Only recalculate when the inputs actually change
  if new.completion_rate is distinct from old.completion_rate or
     new.previous_study_count is distinct from old.previous_study_count then

    if new.completion_rate is null then
      -- No completion data yet — score stays 0
      new.reliability_score := 0;
    else
      new.reliability_score := round(
        (new.completion_rate * 0.6)
        + (least(new.previous_study_count, 20) / 20.0 * 100.0 * 0.4),
        2
      );
    end if;

  end if;

  return new;
end;
$$;

create trigger participant_profiles_reliability_score
  before update on participant_profiles
  for each row execute function update_reliability_score();


-- ─── Index for leaderboard ────────────────────────────────────
-- Leaderboard query: ORDER BY reliability_score DESC
-- Partial index excludes rows with no data yet (score = 0).

create index if not exists idx_participant_profiles_reliability_score
  on participant_profiles(reliability_score desc)
  where reliability_score > 0;

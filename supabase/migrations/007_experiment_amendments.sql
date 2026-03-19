-- ============================================================
-- BIOME — Migration 007: Experiment Amendments + Launch Date
-- Adds amendment_log (JSONB) and launch_date to experiments.
--
-- amendment_log stores an array of amendment objects:
--   [{ ts, field, old_value, new_value, edited_by }]
--
-- launch_date is used to enforce the 7-day edit lock:
--   editing is disabled within 7 days of launch.
--
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS amendment_log  jsonb    NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS launch_date    date;

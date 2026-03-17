-- ============================================================
-- BIOME — Migration 002
-- Adds human-readable detail fields to experiments
-- Adds upvotes to comments
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS tests_needed       TEXT,
  ADD COLUMN IF NOT EXISTS inclusion_criteria TEXT,
  ADD COLUMN IF NOT EXISTS exclusion_criteria TEXT,
  ADD COLUMN IF NOT EXISTS iec_approval       TEXT;

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0;

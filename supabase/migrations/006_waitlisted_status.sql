-- ============================================================
-- BIOME — Migration 006: Add 'waitlisted' to application_status
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'waitlisted';

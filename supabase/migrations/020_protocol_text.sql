-- Migration 020: Add protocol_text column to experiments
-- This stores the detailed study protocol shown to participants before applying.

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS protocol_text text;

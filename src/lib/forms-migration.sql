-- Migration: replace start_date/end_date with per-day sessions
-- Run after the base forms-schema.sql

ALTER TABLE admin_events
  ADD COLUMN IF NOT EXISTS event_days INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sessions JSONB NOT NULL DEFAULT '[{"date":"","startTime":"","endTime":""}]'::jsonb;

-- Optional: drop old columns if they exist
ALTER TABLE admin_events DROP COLUMN IF EXISTS start_date;
ALTER TABLE admin_events DROP COLUMN IF EXISTS end_date;
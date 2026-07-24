-- ============================================================
-- Admin Events & Custom Forms Schema for APRO
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Events table (each event has a registration form)
CREATE TABLE IF NOT EXISTS admin_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      BIGINT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  slug          TEXT NOT NULL UNIQUE,
  start_date    TIMESTAMPTZ,
  end_date      TIMESTAMPTZ,
  location      TEXT NOT NULL DEFAULT '',
  capacity      INTEGER NOT NULL DEFAULT 0,
  reg_deadline  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
  header_type   TEXT NOT NULL DEFAULT 'text' CHECK (header_type IN ('text','image','video','model')),
  header_content TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Form fields (the questions on each event's form)
CREATE TABLE IF NOT EXISTS form_fields (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES admin_events(id) ON DELETE CASCADE,
  field_type    TEXT NOT NULL CHECK (field_type IN (
                  'short_text','long_text','number','slider',
                  'date','time','datetime',
                  'dropdown','checkboxes','radio_buttons','file_upload'
                )),
  label         TEXT NOT NULL,
  placeholder   TEXT NOT NULL DEFAULT '',
  required      BOOLEAN NOT NULL DEFAULT false,
  field_order   INTEGER NOT NULL DEFAULT 0,
  options       JSONB NOT NULL DEFAULT '[]'::jsonb,
  min           NUMERIC,
  max           NUMERIC,
  step          NUMERIC,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Form responses (one row per submission)
CREATE TABLE IF NOT EXISTS form_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES admin_events(id) ON DELETE CASCADE,
  respondent_name TEXT NOT NULL DEFAULT '',
  respondent_email TEXT NOT NULL DEFAULT '',
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Individual field answers within a response
CREATE TABLE IF NOT EXISTS form_field_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  field_id    UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
  value       JSONB NOT NULL DEFAULT 'null'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_events_admin_id ON admin_events(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_events_slug ON admin_events(slug);
CREATE INDEX IF NOT EXISTS idx_form_fields_event_id ON form_fields(event_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_event_id ON form_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_form_field_responses_response_id ON form_field_responses(response_id);
CREATE INDEX IF NOT EXISTS idx_form_field_responses_field_id ON form_field_responses(field_id);
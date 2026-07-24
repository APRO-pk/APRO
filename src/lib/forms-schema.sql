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
  event_days    INTEGER NOT NULL DEFAULT 1,
  sessions      JSONB NOT NULL DEFAULT '[{"date":"","startTime":"","endTime":""}]'::jsonb,
  location      TEXT NOT NULL DEFAULT '',
  capacity      INTEGER NOT NULL DEFAULT 0,
  reg_deadline  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','closed')),
  header_type   TEXT NOT NULL DEFAULT 'text' CHECK (header_type IN ('text','image','video','model','html')),
  header_content TEXT NOT NULL DEFAULT '',
  audience      TEXT NOT NULL DEFAULT 'public' CHECK (audience IN ('public','members')),
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

-- ============================================================
-- Row-Level Security: allow public reads + admin writes
-- ============================================================

-- Admin events: anyone can view open events; only admins can write
ALTER TABLE admin_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_events_select_public" ON admin_events;
CREATE POLICY "admin_events_select_public" ON admin_events
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_events_insert_admin" ON admin_events;
CREATE POLICY "admin_events_insert_admin" ON admin_events
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );
DROP POLICY IF EXISTS "admin_events_update_admin" ON admin_events;
CREATE POLICY "admin_events_update_admin" ON admin_events
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );
DROP POLICY IF EXISTS "admin_events_delete_admin" ON admin_events;
CREATE POLICY "admin_events_delete_admin" ON admin_events
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );

-- Form fields: anyone can view; only admins can write
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "form_fields_select_public" ON form_fields;
CREATE POLICY "form_fields_select_public" ON form_fields
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "form_fields_insert_admin" ON form_fields;
CREATE POLICY "form_fields_insert_admin" ON form_fields
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );
DROP POLICY IF EXISTS "form_fields_update_admin" ON form_fields;
CREATE POLICY "form_fields_update_admin" ON form_fields
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );
DROP POLICY IF EXISTS "form_fields_delete_admin" ON form_fields;
CREATE POLICY "form_fields_delete_admin" ON form_fields
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );

-- Form responses: anyone can insert (public submissions); only admins can view
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "form_responses_insert_public" ON form_responses;
CREATE POLICY "form_responses_insert_public" ON form_responses
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "form_responses_select_admin" ON form_responses;
CREATE POLICY "form_responses_select_admin" ON form_responses
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );

-- Form field responses: anyone can insert; only admins can view
ALTER TABLE form_field_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "form_field_responses_insert_public" ON form_field_responses;
CREATE POLICY "form_field_responses_insert_public" ON form_field_responses
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "form_field_responses_select_admin" ON form_field_responses;
CREATE POLICY "form_field_responses_select_admin" ON form_field_responses
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid())
  );
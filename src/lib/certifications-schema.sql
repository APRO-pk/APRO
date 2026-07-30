-- Certifications Schema
-- Run this in Supabase SQL Editor

-- 1. Certification Templates (created by admins)
CREATE TABLE IF NOT EXISTS certification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE,
  logo_url TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  invert_logo BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add invert_logo column if upgrading existing schema
ALTER TABLE certification_templates ADD COLUMN IF NOT EXISTS invert_logo BOOLEAN NOT NULL DEFAULT false;

-- 2. Certifications (issued to individuals)
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id TEXT NOT NULL UNIQUE,
  template_id UUID NOT NULL REFERENCES certification_templates(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  issued_by UUID NOT NULL REFERENCES auth.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to generate unique 8-digit certification IDs
CREATE OR REPLACE FUNCTION generate_certification_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  done BOOLEAN;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_id := lpad(floor(random() * 100000000)::text, 8, '0');
    IF NOT EXISTS (SELECT 1 FROM certifications WHERE certification_id = new_id) THEN
      done := true;
    END IF;
  END LOOP;
  RETURN new_id;
END;
$$;

-- RLS
ALTER TABLE certification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Everyone can read certifications and templates
DROP POLICY IF EXISTS "public_read_templates" ON certification_templates;
CREATE POLICY "public_read_templates" ON certification_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_certifications" ON certifications;
CREATE POLICY "public_read_certifications" ON certifications FOR SELECT USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "admins_insert_templates" ON certification_templates;
CREATE POLICY "admins_insert_templates" ON certification_templates FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM admins)
);

DROP POLICY IF EXISTS "admins_update_templates" ON certification_templates;
CREATE POLICY "admins_update_templates" ON certification_templates FOR UPDATE TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);

DROP POLICY IF EXISTS "admins_delete_templates" ON certification_templates;
CREATE POLICY "admins_delete_templates" ON certification_templates FOR DELETE TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);

DROP POLICY IF EXISTS "admins_insert_certifications" ON certifications;
CREATE POLICY "admins_insert_certifications" ON certifications FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM admins)
);

DROP POLICY IF EXISTS "admins_update_certifications" ON certifications;
CREATE POLICY "admins_update_certifications" ON certifications FOR UPDATE TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);

DROP POLICY IF EXISTS "admins_delete_certifications" ON certifications;
CREATE POLICY "admins_delete_certifications" ON certifications FOR DELETE TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);

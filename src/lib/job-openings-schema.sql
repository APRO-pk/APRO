-- Job Openings Schema
-- Run this in Supabase SQL Editor

-- 1. Job openings (created by admins, readable by everyone)
CREATE TABLE IF NOT EXISTS job_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link applications to the opening they applied for
ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS job_opening_id UUID REFERENCES job_openings(id) ON DELETE SET NULL;

-- Anyone (anonymous visitors and logged-in members) can submit a career application
DROP POLICY IF EXISTS "public_insert_career_applications" ON career_applications;
CREATE POLICY "public_insert_career_applications" ON career_applications FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Allow resume uploads by anyone (anonymous visitors and logged-in members)
DROP POLICY IF EXISTS "public_upload_resumes" ON storage.objects;
CREATE POLICY "public_upload_resumes" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'resumes');

-- RLS
ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;

-- Everyone can read job openings (including unauthenticated visitors)
DROP POLICY IF EXISTS "public_read_job_openings" ON job_openings;
CREATE POLICY "public_read_job_openings" ON job_openings FOR SELECT USING (true);

-- Only admins can modify job openings
DROP POLICY IF EXISTS "admins_insert_job_openings" ON job_openings;
CREATE POLICY "admins_insert_job_openings" ON job_openings FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM admins)
);

DROP POLICY IF EXISTS "admins_update_job_openings" ON job_openings;
CREATE POLICY "admins_update_job_openings" ON job_openings FOR UPDATE TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);

DROP POLICY IF EXISTS "admins_delete_job_openings" ON job_openings;
CREATE POLICY "admins_delete_job_openings" ON job_openings FOR DELETE TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);

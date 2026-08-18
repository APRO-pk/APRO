-- Admin Dashboard Schema
-- Run this in Supabase SQL Editor

-- 1. Member bans (full account ban)
CREATE TABLE IF NOT EXISTS member_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  reason TEXT DEFAULT '',
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Member restrictions (per-activity limits)
CREATE TABLE IF NOT EXISTS member_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('post', 'comment', 'vote', 'create_crew', 'join_crew', 'create_mission')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, restriction_type)
);

-- RLS
ALTER TABLE member_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_restrictions ENABLE ROW LEVEL SECURITY;

-- Admins can read all
DROP POLICY IF EXISTS "admins_read_bans" ON member_bans;
CREATE POLICY "admins_read_bans" ON member_bans FOR SELECT TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);
DROP POLICY IF EXISTS "admins_insert_bans" ON member_bans;
CREATE POLICY "admins_insert_bans" ON member_bans FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM admins)
);
DROP POLICY IF EXISTS "admins_delete_bans" ON member_bans;
CREATE POLICY "admins_delete_bans" ON member_bans FOR DELETE TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);

DROP POLICY IF EXISTS "admins_read_restrictions" ON member_restrictions;
CREATE POLICY "admins_read_restrictions" ON member_restrictions FOR SELECT TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);
DROP POLICY IF EXISTS "admins_insert_restrictions" ON member_restrictions;
CREATE POLICY "admins_insert_restrictions" ON member_restrictions FOR INSERT TO authenticated WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM admins)
);
DROP POLICY IF EXISTS "admins_delete_restrictions" ON member_restrictions;
CREATE POLICY "admins_delete_restrictions" ON member_restrictions FOR DELETE TO authenticated USING (
  auth.uid() IN (SELECT auth_id FROM admins)
);

-- 3. Admin accounts (admins table created manually: id BIGINT, username TEXT, auth_id UUID)
-- NOTE: admins has its own RLS policies ("Admins can read their own admin record",
-- "admins_select_own_row") so a query on admins only ever returns the caller's own row.
-- Avoid self-referential policies here (auth.uid() IN (SELECT auth_id FROM admins)
-- causes infinite recursion). Use the SECURITY DEFINER helpers below instead.

-- is_admin(): true when the current user is an admin (no RLS recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE auth_id = auth.uid());
$$;

-- admin_auth_ids(): all admin auth ids, empty for non-admins (used for admin badges)
CREATE OR REPLACE FUNCTION admin_auth_ids()
RETURNS TABLE (auth_id UUID)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT a.auth_id FROM admins a WHERE EXISTS (SELECT 1 FROM admins b WHERE b.auth_id = auth.uid());
$$;

REVOKE ALL ON FUNCTION is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION admin_auth_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_auth_ids() TO authenticated;

-- Existing admins can promote members to admin (checked via is_admin())
DROP POLICY IF EXISTS "admins_insert_admins" ON admins;
CREATE POLICY "admins_insert_admins" ON admins FOR INSERT TO authenticated WITH CHECK (is_admin());

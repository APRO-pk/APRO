-- Crew System Schema
-- Run this in Supabase SQL Editor

-- 1. Crews
CREATE TABLE IF NOT EXISTS crews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level       INT NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 20),
  prime_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status      TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'rejected'))
);

-- 2. Crew Members
CREATE TABLE IF NOT EXISTS crew_members (
  crew_id   UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('prime', 'manager', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (crew_id, user_id)
);

-- 3. Crew Join Requests
CREATE TABLE IF NOT EXISTS crew_join_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id    UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (crew_id, user_id)
);

-- 4. Crew Invites
CREATE TABLE IF NOT EXISTS crew_invites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id    UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (crew_id, invitee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crew_members_user ON crew_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_join_requests_user ON crew_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_join_requests_crew ON crew_join_requests(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_invites_invitee ON crew_invites(invitee_id);

-- RLS
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_invites ENABLE ROW LEVEL SECURITY;

-- Crews policies
DROP POLICY IF EXISTS "crews_select" ON crews;
CREATE POLICY "crews_select" ON crews FOR SELECT USING (true);
DROP POLICY IF EXISTS "crews_insert" ON crews;
CREATE POLICY "crews_insert" ON crews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "crews_update" ON crews;
CREATE POLICY "crews_update" ON crews FOR UPDATE USING (auth.uid() IN (
  SELECT user_id FROM crew_members WHERE crew_id = id AND role IN ('prime', 'manager')
));

-- Crew members policies
DROP POLICY IF EXISTS "crew_members_select" ON crew_members;
CREATE POLICY "crew_members_select" ON crew_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "crew_members_insert" ON crew_members;
CREATE POLICY "crew_members_insert" ON crew_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "crew_members_update" ON crew_members;
CREATE POLICY "crew_members_update" ON crew_members FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = crew_members.crew_id AND role IN ('prime', 'manager'))
);
DROP POLICY IF EXISTS "crew_members_delete" ON crew_members;
CREATE POLICY "crew_members_delete" ON crew_members FOR DELETE USING (
  auth.uid() = user_id OR
  auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = crew_members.crew_id AND role IN ('prime', 'manager'))
);

-- Join requests policies
DROP POLICY IF EXISTS "crew_join_requests_select" ON crew_join_requests;
CREATE POLICY "crew_join_requests_select" ON crew_join_requests FOR SELECT USING (
  auth.uid() = user_id OR
  auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = crew_join_requests.crew_id AND role IN ('prime', 'manager'))
);
DROP POLICY IF EXISTS "crew_join_requests_insert" ON crew_join_requests;
CREATE POLICY "crew_join_requests_insert" ON crew_join_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
DROP POLICY IF EXISTS "crew_join_requests_update" ON crew_join_requests;
CREATE POLICY "crew_join_requests_update" ON crew_join_requests FOR UPDATE USING (
  auth.uid() = user_id OR
  auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = crew_join_requests.crew_id AND role IN ('prime', 'manager'))
);

-- Invites policies
DROP POLICY IF EXISTS "crew_invites_select" ON crew_invites;
CREATE POLICY "crew_invites_select" ON crew_invites FOR SELECT USING (
  auth.uid() = invitee_id OR
  auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = crew_invites.crew_id AND role IN ('prime', 'manager'))
);
DROP POLICY IF EXISTS "crew_invites_insert" ON crew_invites;
CREATE POLICY "crew_invites_insert" ON crew_invites FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = crew_invites.crew_id AND role IN ('prime', 'manager'))
);
DROP POLICY IF EXISTS "crew_invites_update" ON crew_invites;
CREATE POLICY "crew_invites_update" ON crew_invites FOR UPDATE USING (auth.uid() = invitee_id);

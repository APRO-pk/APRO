-- Migration: Project Invites table (invite-based joining instead of direct add)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS project_invites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_invites_user ON project_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_project ON project_invites(project_id);

ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_invites_select" ON project_invites;
CREATE POLICY "project_invites_select" ON project_invites FOR SELECT USING (
  user_id = auth.uid()
  OR invited_by = auth.uid()
  OR EXISTS (SELECT 1 FROM project_members WHERE project_id = project_invites.project_id AND user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_invites.project_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_invites.project_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid() AND role IN ('prime', 'manager')))
);

DROP POLICY IF EXISTS "project_invites_insert" ON project_invites;
CREATE POLICY "project_invites_insert" ON project_invites FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    EXISTS (SELECT 1 FROM project_members WHERE project_id = project_invites.project_id AND user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_invites.project_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_invites.project_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid() AND role IN ('prime', 'manager')))
  )
);

DROP POLICY IF EXISTS "project_invites_update" ON project_invites;
CREATE POLICY "project_invites_update" ON project_invites FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "project_invites_delete" ON project_invites;
CREATE POLICY "project_invites_delete" ON project_invites FOR DELETE USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM project_members WHERE project_id = project_invites.project_id AND user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_invites.project_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_invites.project_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid() AND role IN ('prime', 'manager')))
);

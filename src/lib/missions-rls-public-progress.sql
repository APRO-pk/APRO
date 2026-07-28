-- Migration: Allow non-members to read phases/milestones of public projects (needed for progress tracking)
-- Run this in Supabase SQL Editor

DROP POLICY IF EXISTS "project_phases_select" ON project_phases;
CREATE POLICY "project_phases_select" ON project_phases FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members WHERE project_id = project_phases.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND (p.owner_type = 'user' AND p.owner_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.visibility = 'public')
);

DROP POLICY IF EXISTS "project_milestones_select" ON project_milestones;
CREATE POLICY "project_milestones_select" ON project_milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_phases pp JOIN project_members pm ON pm.project_id = pp.project_id WHERE pp.id = project_milestones.phase_id AND pm.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM project_phases pp JOIN projects p ON p.id = pp.project_id WHERE pp.id = project_milestones.phase_id AND (p.owner_type = 'user' AND p.owner_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM project_phases pp JOIN projects p ON p.id = pp.project_id WHERE pp.id = project_milestones.phase_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM project_phases pp JOIN projects p ON p.id = pp.project_id WHERE pp.id = project_milestones.phase_id AND p.visibility = 'public')
);

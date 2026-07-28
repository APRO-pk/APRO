-- Missions Schema (Projects, Phases, Milestones, Checklists, Posts, Crew Tracking)
-- Run this in Supabase SQL Editor

-- 1. Projects
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_type  TEXT NOT NULL CHECK (owner_type IN ('user', 'crew')),
  owner_id    UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration: add visibility column (safe to re-run)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'missions' CHECK (visibility IN ('public', 'missions', 'private'));

-- 2. Project Members (clone from crew or individual)
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  PRIMARY KEY (project_id, user_id)
);

-- 3. Phases (Stages) – chronological, lock when completed
CREATE TABLE IF NOT EXISTS project_phases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_date  TIMESTAMPTZ,
  deadline    TIMESTAMPTZ,
  order_index INT NOT NULL DEFAULT 0,
  completed   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id    UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Milestone Participants
CREATE TABLE IF NOT EXISTS milestone_participants (
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (milestone_id, user_id)
);

-- 6. Checklist Items
CREATE TABLE IF NOT EXISTS milestone_checklist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  assigned_to  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Project Posts (project feed)
CREATE TABLE IF NOT EXISTS project_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phase_id          UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
  milestone_id      UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  checklist_item_id UUID REFERENCES milestone_checklist_items(id) ON DELETE SET NULL,
  content           TEXT NOT NULL,
  images            TEXT[] NOT NULL DEFAULT '{}',
  visibility        TEXT NOT NULL DEFAULT 'missions' CHECK (visibility IN ('private', 'missions', 'public')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Link public project posts to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS project_post_id UUID REFERENCES project_posts(id) ON DELETE CASCADE;

-- 9. Crew Tracking (users follow crews)
CREATE TABLE IF NOT EXISTS crew_follows (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id    UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, crew_id)
);

-- 10. Project Tracking (users track/follow public projects)
CREATE TABLE IF NOT EXISTS project_follows (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, project_id)
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_project ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_phase ON project_milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_milestone_checklist_milestone ON milestone_checklist_items(milestone_id);
CREATE INDEX IF NOT EXISTS idx_project_posts_project ON project_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_posts_visibility ON project_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_crew_follows_user ON crew_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_follows_crew ON crew_follows(crew_id);
CREATE INDEX IF NOT EXISTS idx_project_follows_user ON project_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_project_follows_project ON project_follows(project_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_project_post ON community_posts(project_post_id);

-- ─── RLS ────────────────────────────────────────────────────

-- Helper functions to check project membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION is_project_member(pid UUID, uid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM project_members WHERE project_id = pid AND user_id = uid);
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION is_project_admin(pid UUID, uid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM project_members WHERE project_id = pid AND user_id = uid AND role = 'admin');
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION is_project_owner_or_crew(pid UUID, uid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = pid AND (
      (p.owner_type = 'user' AND p.owner_id = uid)
      OR (p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = uid))
    )
  );
$$ LANGUAGE sql;

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (
  visibility = 'public'
  OR is_project_member(id, auth.uid())
  OR (owner_type = 'user' AND owner_id = auth.uid())
  OR (owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = owner_id AND user_id = auth.uid()))
);

DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (
  is_project_admin(id, auth.uid())
  OR (owner_type = 'user' AND owner_id = auth.uid())
  OR (owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = owner_id AND user_id = auth.uid() AND role IN ('prime', 'manager')))
);

-- Project Members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_members_select" ON project_members;
CREATE POLICY "project_members_select" ON project_members FOR SELECT USING (
  user_id = auth.uid()
  OR is_project_owner_or_crew(project_id, auth.uid())
);

DROP POLICY IF EXISTS "project_members_insert" ON project_members;
CREATE POLICY "project_members_insert" ON project_members FOR INSERT WITH CHECK (
  -- Personal project owner can add anyone
  (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_members.project_id AND p.owner_type = 'user' AND p.owner_id = auth.uid()))
  OR
  -- Crew project: any crew member can insert themselves
  (project_members.user_id = auth.uid()
   AND EXISTS (SELECT 1 FROM projects p WHERE p.id = project_members.project_id AND p.owner_type = 'crew'
               AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid())))
  OR
  -- Crew project: prime/manager can insert anyone
  (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_members.project_id AND p.owner_type = 'crew'
           AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid() AND role IN ('prime', 'manager'))))
);

-- Phases
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_phases_select" ON project_phases;
CREATE POLICY "project_phases_select" ON project_phases FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_members WHERE project_id = project_phases.project_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND (p.owner_type = 'user' AND p.owner_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.visibility = 'public')
);

DROP POLICY IF EXISTS "project_phases_insert" ON project_phases;
CREATE POLICY "project_phases_insert" ON project_phases FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM project_members WHERE project_id = project_phases.project_id AND user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
);

DROP POLICY IF EXISTS "project_phases_update" ON project_phases;
CREATE POLICY "project_phases_update" ON project_phases FOR UPDATE USING (
  EXISTS (SELECT 1 FROM project_members WHERE project_id = project_phases.project_id AND user_id = auth.uid() AND role = 'admin')
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
);

-- Milestones
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_milestones_select" ON project_milestones;
CREATE POLICY "project_milestones_select" ON project_milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM project_phases pp JOIN project_members pm ON pm.project_id = pp.project_id WHERE pp.id = project_milestones.phase_id AND pm.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM project_phases pp JOIN projects p ON p.id = pp.project_id WHERE pp.id = project_milestones.phase_id AND (p.owner_type = 'user' AND p.owner_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM project_phases pp JOIN projects p ON p.id = pp.project_id WHERE pp.id = project_milestones.phase_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
  OR EXISTS (SELECT 1 FROM project_phases pp JOIN projects p ON p.id = pp.project_id WHERE pp.id = project_milestones.phase_id AND p.visibility = 'public')
);

DROP POLICY IF EXISTS "project_milestones_insert" ON project_milestones;
CREATE POLICY "project_milestones_insert" ON project_milestones FOR INSERT WITH CHECK (
  (
    EXISTS (SELECT 1 FROM project_phases pp JOIN project_members pm ON pm.project_id = pp.project_id WHERE pp.id = phase_id AND pm.user_id = auth.uid() AND pm.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_phases pp JOIN projects p ON p.id = pp.project_id WHERE pp.id = phase_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_phases pp JOIN projects p ON p.id = pp.project_id WHERE pp.id = phase_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
  )
  AND NOT EXISTS (SELECT 1 FROM project_phases WHERE id = phase_id AND completed = true)
);

-- Milestone Participants
ALTER TABLE milestone_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milestone_participants_select" ON milestone_participants;
CREATE POLICY "milestone_participants_select" ON milestone_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "milestone_participants_insert" ON milestone_participants;
CREATE POLICY "milestone_participants_insert" ON milestone_participants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN project_members pjm ON pjm.project_id = pp.project_id WHERE pm2.id = milestone_id AND pjm.user_id = auth.uid() AND pjm.role = 'admin')
  OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
);

DROP POLICY IF EXISTS "milestone_participants_delete" ON milestone_participants;
CREATE POLICY "milestone_participants_delete" ON milestone_participants FOR DELETE USING (
  EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN project_members pjm ON pjm.project_id = pp.project_id WHERE pm2.id = milestone_id AND pjm.user_id = auth.uid() AND pjm.role = 'admin')
  OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
);

-- Checklist Items
ALTER TABLE milestone_checklist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milestone_checklist_select" ON milestone_checklist_items;
CREATE POLICY "milestone_checklist_select" ON milestone_checklist_items FOR SELECT USING (true); -- visible to anyone who can see the milestone

DROP POLICY IF EXISTS "milestone_checklist_insert" ON milestone_checklist_items;
CREATE POLICY "milestone_checklist_insert" ON milestone_checklist_items FOR INSERT WITH CHECK (
  (
    EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN project_members pjm ON pjm.project_id = pp.project_id WHERE pm2.id = milestone_id AND pjm.user_id = auth.uid() AND pjm.role = 'admin')
    OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
  )
  AND NOT EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id WHERE pm2.id = milestone_id AND pp.completed = true)
);

DROP POLICY IF EXISTS "milestone_checklist_update" ON milestone_checklist_items;
CREATE POLICY "milestone_checklist_update" ON milestone_checklist_items FOR UPDATE USING (
  auth.uid() = assigned_to
  OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN project_members pjm ON pjm.project_id = pp.project_id WHERE pm2.id = milestone_id AND pjm.user_id = auth.uid() AND pjm.role = 'admin')
  OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
);

DROP POLICY IF EXISTS "milestone_checklist_delete" ON milestone_checklist_items;
CREATE POLICY "milestone_checklist_delete" ON milestone_checklist_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN project_members pjm ON pjm.project_id = pp.project_id WHERE pm2.id = milestone_id AND pjm.user_id = auth.uid() AND pjm.role = 'admin')
  OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM project_milestones pm2 JOIN project_phases pp ON pp.id = pm2.phase_id JOIN projects p ON p.id = pp.project_id WHERE pm2.id = milestone_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
);

-- Project Posts
ALTER TABLE project_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_posts_select" ON project_posts;
CREATE POLICY "project_posts_select" ON project_posts FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects p WHERE p.id = project_posts.project_id AND p.visibility = 'public')
  OR is_project_member(project_posts.project_id, auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_posts.project_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_posts.project_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
);

DROP POLICY IF EXISTS "project_posts_insert" ON project_posts;
CREATE POLICY "project_posts_insert" ON project_posts FOR INSERT WITH CHECK (
  is_project_member(project_posts.project_id, auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_posts.project_id AND p.owner_type = 'user' AND p.owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects p WHERE p.id = project_posts.project_id AND p.owner_type = 'crew' AND EXISTS (SELECT 1 FROM crew_members WHERE crew_id = p.owner_id AND user_id = auth.uid()))
);

DROP POLICY IF EXISTS "project_posts_update" ON project_posts;
CREATE POLICY "project_posts_update" ON project_posts FOR UPDATE USING (author_id = auth.uid());

DROP POLICY IF EXISTS "project_posts_delete" ON project_posts;
CREATE POLICY "project_posts_delete" ON project_posts FOR DELETE USING (author_id = auth.uid());

-- Project Post Votes
CREATE TABLE IF NOT EXISTS project_post_votes (
  project_post_id UUID NOT NULL REFERENCES project_posts(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type       INT NOT NULL CHECK (vote_type IN (1, -1)),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_post_votes_post ON project_post_votes(project_post_id);

ALTER TABLE project_post_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_post_votes_select" ON project_post_votes;
CREATE POLICY "project_post_votes_select" ON project_post_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "project_post_votes_insert" ON project_post_votes;
CREATE POLICY "project_post_votes_insert" ON project_post_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "project_post_votes_update" ON project_post_votes;
CREATE POLICY "project_post_votes_update" ON project_post_votes FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "project_post_votes_delete" ON project_post_votes;
CREATE POLICY "project_post_votes_delete" ON project_post_votes FOR DELETE USING (user_id = auth.uid());

-- Project Post Comments (threaded)
CREATE TABLE IF NOT EXISTS project_post_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_post_id UUID NOT NULL REFERENCES project_posts(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES project_post_comments(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_post_comments_post ON project_post_comments(project_post_id);

ALTER TABLE project_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_post_comments_select" ON project_post_comments;
CREATE POLICY "project_post_comments_select" ON project_post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "project_post_comments_insert" ON project_post_comments;
CREATE POLICY "project_post_comments_insert" ON project_post_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

DROP POLICY IF EXISTS "project_post_comments_delete" ON project_post_comments;
CREATE POLICY "project_post_comments_delete" ON project_post_comments FOR DELETE USING (author_id = auth.uid());

-- Crew Follows
ALTER TABLE crew_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crew_follows_select" ON crew_follows;
CREATE POLICY "crew_follows_select" ON crew_follows FOR SELECT USING (true); -- visible to all

DROP POLICY IF EXISTS "crew_follows_insert" ON crew_follows;
CREATE POLICY "crew_follows_insert" ON crew_follows FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "crew_follows_delete" ON crew_follows;
CREATE POLICY "crew_follows_delete" ON crew_follows FOR DELETE USING (user_id = auth.uid());

-- Project Follows
ALTER TABLE project_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_follows_select" ON project_follows;
CREATE POLICY "project_follows_select" ON project_follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "project_follows_insert" ON project_follows;
CREATE POLICY "project_follows_insert" ON project_follows FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

DROP POLICY IF EXISTS "project_follows_delete" ON project_follows;
CREATE POLICY "project_follows_delete" ON project_follows FOR DELETE USING (user_id = auth.uid());

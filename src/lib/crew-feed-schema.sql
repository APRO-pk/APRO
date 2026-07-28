-- Crew Feed Schema
-- Add crew_id to community_posts for crew-scoped posts
-- Run this in Supabase SQL Editor

ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS crew_id UUID REFERENCES crews(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_community_posts_crew_id ON community_posts(crew_id);

-- Update RLS: crew members can see crew posts
DROP POLICY IF EXISTS "posts_select" ON community_posts;
CREATE POLICY "posts_select" ON community_posts FOR SELECT USING (
  crew_id IS NULL OR
  auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = community_posts.crew_id)
);

-- Update RLS: crew members can post in their crew
DROP POLICY IF EXISTS "posts_insert" ON community_posts;
CREATE POLICY "posts_insert" ON community_posts FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND author_id = auth.uid() AND (
    community_posts.crew_id IS NULL OR
    auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = community_posts.crew_id)
  )
);

-- Restrict voting on crew posts to crew members
DROP POLICY IF EXISTS "votes_insert" ON community_votes;
CREATE POLICY "votes_insert" ON community_votes FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND user_id = auth.uid() AND (
    community_votes.post_id IS NULL OR
    EXISTS (
      SELECT 1 FROM community_posts cp
      WHERE cp.id = community_votes.post_id
      AND (cp.crew_id IS NULL OR
        auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = cp.crew_id))
    )
  )
);

-- Restrict commenting on crew posts to crew members
DROP POLICY IF EXISTS "comments_insert" ON community_comments;
CREATE POLICY "comments_insert" ON community_comments FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND author_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM community_posts cp
      WHERE cp.id = community_comments.post_id
      AND (cp.crew_id IS NULL OR
        auth.uid() IN (SELECT user_id FROM crew_members WHERE crew_id = cp.crew_id))
    )
  )
);

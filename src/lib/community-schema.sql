-- Community Tables (Launchpad / Launches / Telemetry / Signals)

-- 1. Posts (Launches)
CREATE TABLE IF NOT EXISTS community_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL DEFAULT '',
  images        JSONB NOT NULL DEFAULT '[]'::jsonb,
  altitude      INTEGER NOT NULL DEFAULT 0,
  relaunch_of   UUID REFERENCES community_posts(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);

-- 2. Comments (Telemetry) — must be before votes
CREATE TABLE IF NOT EXISTS community_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent ON community_comments(parent_id);

-- 3. Votes (Ignite / Abort) — references both posts and comments
CREATE TABLE IF NOT EXISTS community_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  vote       SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_vote_per_post UNIQUE (user_id, post_id) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT one_vote_per_comment UNIQUE (user_id, comment_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_community_votes_post ON community_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_comment ON community_votes(comment_id);

-- 4. Follows (Tracking)
CREATE TABLE IF NOT EXISTS community_follows (
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_community_follows_follower ON community_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_following ON community_follows(following_id);

-- 5. Notifications (Signals)
CREATE TABLE IF NOT EXISTS community_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('ignite','abort','telemetry','reply','relaunch','track')),
  post_id     UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id  UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_notifications_user ON community_notifications(user_id, read, created_at DESC);

-- 6. Profiles (user display names)
CREATE TABLE IF NOT EXISTS community_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS last_feed_post_id UUID REFERENCES community_posts(id) ON DELETE SET NULL;
ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS last_feed_updated_at TIMESTAMPTZ;
ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';
ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';

ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON community_profiles;
CREATE POLICY "profiles_select" ON community_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_upsert" ON community_profiles;
CREATE POLICY "profiles_upsert" ON community_profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND id = auth.uid());
DROP POLICY IF EXISTS "profiles_update" ON community_profiles;
CREATE POLICY "profiles_update" ON community_profiles FOR UPDATE USING (id = auth.uid());

-- RLS (idempotent — drops before create)
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;

-- Posts: anyone can read, authenticated users can insert, owner can update/delete
DROP POLICY IF EXISTS "posts_select" ON community_posts;
CREATE POLICY "posts_select" ON community_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "posts_insert" ON community_posts;
CREATE POLICY "posts_insert" ON community_posts FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());
DROP POLICY IF EXISTS "posts_update" ON community_posts;
CREATE POLICY "posts_update" ON community_posts FOR UPDATE USING (author_id = auth.uid());
DROP POLICY IF EXISTS "posts_delete" ON community_posts;
CREATE POLICY "posts_delete" ON community_posts FOR DELETE USING (author_id = auth.uid());

-- Votes: anyone can read, authenticated users can manage own votes
DROP POLICY IF EXISTS "votes_select" ON community_votes;
CREATE POLICY "votes_select" ON community_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "votes_insert" ON community_votes;
CREATE POLICY "votes_insert" ON community_votes FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
DROP POLICY IF EXISTS "votes_update" ON community_votes;
CREATE POLICY "votes_update" ON community_votes FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "votes_delete" ON community_votes;
CREATE POLICY "votes_delete" ON community_votes FOR DELETE USING (user_id = auth.uid());

-- Comments: anyone can read, authenticated users can insert own, owner can update/delete
DROP POLICY IF EXISTS "comments_select" ON community_comments;
CREATE POLICY "comments_select" ON community_comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "comments_insert" ON community_comments;
CREATE POLICY "comments_insert" ON community_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());
DROP POLICY IF EXISTS "comments_update" ON community_comments;
CREATE POLICY "comments_update" ON community_comments FOR UPDATE USING (author_id = auth.uid());
DROP POLICY IF EXISTS "comments_delete" ON community_comments;
CREATE POLICY "comments_delete" ON community_comments FOR DELETE USING (author_id = auth.uid());

-- Follows: anyone can read, authenticated users can manage own follows
DROP POLICY IF EXISTS "follows_select" ON community_follows;
CREATE POLICY "follows_select" ON community_follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "follows_insert" ON community_follows;
CREATE POLICY "follows_insert" ON community_follows FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND follower_id = auth.uid());
DROP POLICY IF EXISTS "follows_delete" ON community_follows;
CREATE POLICY "follows_delete" ON community_follows FOR DELETE USING (follower_id = auth.uid());

-- Notifications: only recipient can see, authenticated can manage own
DROP POLICY IF EXISTS "notifications_select" ON community_notifications;
CREATE POLICY "notifications_select" ON community_notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_update" ON community_notifications;
CREATE POLICY "notifications_update" ON community_notifications FOR UPDATE USING (user_id = auth.uid());

-- Altitude increment function
CREATE OR REPLACE FUNCTION increment_post_altitude(post_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE community_posts SET altitude = altitude + 1 WHERE id = post_id;
END;
$$;

-- Storage bucket policies (community_images)
DROP POLICY IF EXISTS "community_images_select" ON storage.objects;
CREATE POLICY "community_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'community_images');
DROP POLICY IF EXISTS "community_images_insert" ON storage.objects;
CREATE POLICY "community_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'community_images' AND auth.role() = 'authenticated');

-- Migration: allow post deletion when referenced as last_feed_post_id
ALTER TABLE community_profiles DROP CONSTRAINT IF EXISTS community_profiles_last_feed_post_id_fkey;
ALTER TABLE community_profiles ADD CONSTRAINT community_profiles_last_feed_post_id_fkey
  FOREIGN KEY (last_feed_post_id) REFERENCES community_posts(id) ON DELETE SET NULL;

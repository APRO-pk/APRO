-- Community Tokens & Membership Class
ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS membership_class TEXT NOT NULL DEFAULT 'Free';
ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS community_tokens INTEGER NOT NULL DEFAULT 120;
ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS tokens_reset_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days';

-- Initialize tokens_reset_at for existing rows that have the default
UPDATE community_profiles SET tokens_reset_at = created_at + interval '30 days' WHERE tokens_reset_at = now() + interval '30 days';

-- RPC to check and reset tokens if needed (call before reading tokens)
CREATE OR REPLACE FUNCTION refresh_community_tokens(uid UUID)
RETURNS TABLE(community_tokens INTEGER, tokens_reset_at TIMESTAMPTZ, membership_class TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE community_profiles cp
  SET
    community_tokens = CASE
      WHEN now() >= cp.tokens_reset_at THEN
        CASE
          WHEN cp.membership_class = 'Free' THEN 120
          ELSE 120
        END
      ELSE cp.community_tokens
    END,
    tokens_reset_at = CASE
      WHEN now() >= cp.tokens_reset_at THEN now() + interval '30 days'
      ELSE cp.tokens_reset_at
    END
  WHERE cp.id = uid;

  RETURN QUERY
  SELECT cp.community_tokens, cp.tokens_reset_at, cp.membership_class
  FROM community_profiles cp
  WHERE cp.id = uid;
END;
$$;

-- RPC to atomically check and deduct tokens (auto-refreshes first)
CREATE OR REPLACE FUNCTION deduct_community_tokens(uid UUID, amount INTEGER DEFAULT 1)
RETURNS TABLE(success BOOLEAN, remaining_tokens INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tokens INTEGER;
  membership TEXT;
BEGIN
  -- Auto-refresh if past reset
  UPDATE community_profiles cp
  SET
    community_tokens = CASE
      WHEN now() >= cp.tokens_reset_at THEN
        CASE
          WHEN cp.membership_class = 'Free' THEN 120
          ELSE 120
        END
      ELSE cp.community_tokens
    END,
    tokens_reset_at = CASE
      WHEN now() >= cp.tokens_reset_at THEN now() + interval '30 days'
      ELSE cp.tokens_reset_at
    END
  WHERE cp.id = uid;

  SELECT cp.community_tokens, cp.membership_class INTO current_tokens, membership
  FROM community_profiles cp WHERE cp.id = uid;

  -- Non-Free tiers have unlimited tokens
  IF membership != 'Free' THEN
    RETURN QUERY SELECT true::boolean, 999999::integer;
    RETURN;
  END IF;

  -- Not enough tokens
  IF current_tokens < amount THEN
    RETURN QUERY SELECT false::boolean, current_tokens;
    RETURN;
  END IF;

  -- Deduct
  UPDATE community_profiles cp SET community_tokens = cp.community_tokens - amount WHERE cp.id = uid;

  RETURN QUERY SELECT true::boolean, current_tokens - amount;
END;
$$;

-- RPC to track post views and deduct every 50 views for Free users
ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS posts_viewed INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_posts_viewed(uid UUID)
RETURNS TABLE(posts_viewed INTEGER, tokens_deducted BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
  membership TEXT;
BEGIN
  UPDATE community_profiles cp SET posts_viewed = cp.posts_viewed + 1 WHERE cp.id = uid RETURNING cp.posts_viewed INTO new_count;

  SELECT cp.membership_class INTO membership FROM community_profiles cp WHERE cp.id = uid;

  IF membership = 'Free' AND new_count % 50 = 0 THEN
    UPDATE community_profiles cp SET community_tokens = GREATEST(0, cp.community_tokens - 1) WHERE cp.id = uid;
    RETURN QUERY SELECT new_count, true;
  ELSE
    RETURN QUERY SELECT new_count, false;
  END IF;
END;
$$;

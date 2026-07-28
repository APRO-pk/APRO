# Community Feature — Implementation Plan

## Overview

A Reddit/Twitter hybrid where APRO members can post, comment, upvote/downvote, repost, and follow each other. Non-members can view but not interact.

---

## Terminology (APRO-Themed)

| Feature | APRO Name | Description |
|---|---|---|
| Post | **Launch** | A new text/image post |
| Comment | **Telemetry** | Reply on a post |
| Upvote | **Ignite** | Rocket-shaped upvote |
| Downvote | **Abort** | Parachute-shaped downvote |
| Repost | **Relaunch** | Share a post to your own feed |
| Follow | **Track** | Follow a user |
| Front page | **Launchpad** | Main feed |
| Notification | **Signal** | Activity alerts |
| Views | **Altitude** | Post view count |

---

## Database Schema

All tables go into the existing Supabase project.

### 1. `community_posts` (Launches)

```sql
CREATE TABLE community_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL DEFAULT '',
  images        JSONB NOT NULL DEFAULT '[]'::jsonb,      -- array of image URLs
  altitude      INTEGER NOT NULL DEFAULT 0,               -- view count
  relaunch_of   UUID REFERENCES community_posts(id) ON DELETE SET NULL,  -- original post if relaunch
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX idx_community_posts_author ON community_posts(author_id);
```

### 2. `community_votes` (Ignite / Abort)

```sql
CREATE TABLE community_votes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id   UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  vote      SMALLINT NOT NULL CHECK (vote IN (1, -1)),   -- 1 = ignite, -1 = abort
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT one_vote_per_post UNIQUE (user_id, post_id) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT one_vote_per_comment UNIQUE (user_id, comment_id) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_community_votes_post ON community_votes(post_id);
CREATE INDEX idx_community_votes_comment ON community_votes(comment_id);
```

### 3. `community_comments` (Telemetry)

```sql
CREATE TABLE community_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES community_comments(id) ON DELETE CASCADE,  -- threaded replies
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_comments_post ON community_comments(post_id);
CREATE INDEX idx_community_comments_parent ON community_comments(parent_id);
```

### 4. `community_follows` (Tracking)

```sql
CREATE TABLE community_follows (
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_community_follows_follower ON community_follows(follower_id);
CREATE INDEX idx_community_follows_following ON community_follows(following_id);
```

### 5. `community_notifications` (Signals)

```sql
CREATE TABLE community_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- recipient
  actor_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- who caused it
  type        TEXT NOT NULL CHECK (type IN (
                'ignite', 'abort', 'telemetry', 'reply', 'relaunch', 'track'
              )),
  post_id     UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id  UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_notifications_user ON community_notifications(user_id, read, created_at DESC);
```

---

## RLS Policies

### community_posts
- **SELECT**: anyone
- **INSERT**: authenticated users (members/admins)
- **UPDATE**: own post only
- **DELETE**: own post or admin

### community_votes
- **SELECT**: anyone (view counts)
- **INSERT**: authenticated, one per user+post or user+comment
- **UPDATE**: own vote
- **DELETE**: own vote

### community_comments
- **SELECT**: anyone
- **INSERT**: authenticated
- **UPDATE**: own comment
- **DELETE**: own comment or admin

### community_follows
- **SELECT**: anyone
- **INSERT**: authenticated (your own follows)
- **DELETE**: own follow

### community_notifications
- **SELECT**: own notifications only (user_id = auth.uid())
- **INSERT**: system (via trigger or application code)
- **UPDATE**: mark as read

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/community` | `Launchpad` | Main feed — shows Launches from tracked users + recent posts |
| `/community/launchpad` | `Launchpad` | Same as above |
| `/community/new` | `NewLaunch` | Create a post (members only) |
| `/community/post/:id` | `LaunchDetail` | Single post with telemetry (comments) |
| `/community/user/:id` | `UserFeed` | A user's profile + their posts/relaunches |
| `/community/signals` | `Signals` | Notifications page |

---

## UI Components (React)

```
pages/
  Community/
    Launchpad.tsx          — Main feed (Launches sorted by recency + tracked users)
    NewLaunch.tsx          — Create post form (text + image upload)
    LaunchDetail.tsx       — Single post + threaded comments + ignite/abort
    UserFeed.tsx           — User profile, posts, follow button
    Signals.tsx            — Notifications list

components/Community/
  LaunchCard.tsx           — Post card (content, images, ignite/abort counts, altitude, relaunch button)
  TelemetryThread.tsx      — Comment thread with nested replies
  IgniteButton.tsx         — Rocket-shaped upvote (animation on click)
  AbortButton.tsx          — Parachute-shaped downvote
  RelaunchButton.tsx       — Repost button
  TrackButton.tsx          — Follow/unfollow toggle
  SignalBadge.tsx          — Unread notification count in navbar
  UserAvatar.tsx           — User avatar with initial
```

---

## Ignite / Abort (Voting) Logic

- `community_votes.vote` stores `1` (ignite) or `-1` (abort)
- For display: `SUM(vote)` gives the net score
- Users can change their vote (UPDATE replaces old value)
- Clicking the same vote again removes it (DELETE = unvote)
- `DEFERRABLE UNIQUE` constraints prevent duplicate votes

---

## Altitude (Views) Logic

- `community_posts.altitude` stores a view count
- Increment when:
  - A logged-in user views the post detail page (unique per user+post per session)
  - A relaunch occurs
- Use a simple increment on page load (debounced, unique per user+post via browser storage or a `post_views` table)

---

## Relaunch (Repost) Logic

- When user clicks Relaunch, create a new `community_posts` row with:
  - `relaunch_of = original_post_id`
  - `author_id = current_user`
  - `content` can be empty or allow adding commentary
  - `images` empty (original images remain with original post)
- On the feed, render a Relaunch card showing:
  - "🚀 Relaunched by @user" header
  - The original post content below it (fetched via `relaunch_of` JOIN)
- Original post's `altitude` increments on relaunch

---

## Tracking (Follow) Logic

- `community_follows` stores follower → following relationships
- Feed on Launchpad shows:
  - Relaunches from tracked users (most recent first)
  - Recent Launches from all users (for discoverability)
- User profile page shows follower/following counts

---

## Signals (Notifications)

Triggers on these actions:
- Someone **Ignites** your post → `type: 'ignite'`
- Someone **Aborts** your post → `type: 'abort'`
- Someone **Telemetry** (comments) on your post → `type: 'telemetry'`
- Someone **replies** to your comment → `type: 'reply'`
- Someone **Relaunches** your post → `type: 'relaunch'`
- Someone **Tracks** you → `type: 'track'`

Notification polling: check `/community/signals` or use a small unread badge in the navbar.

---

## Supabase Setup

### Storage Buckets

Create a **public** bucket called `community_images` for post images.

### SQL

Run `src/lib/community-schema.sql` in the Supabase SQL Editor.

### RPC Function

The `increment_post_altitude(UUID)` function is defined in the schema SQL — it increments the `altitude` column on `community_posts`.

---

## Phase 2 Ideas (Future)

- Image galleries in posts
- Rich text / markdown in posts
- Pinned posts for admins
- Post categories / tags (e.g., #propulsion, #avionics)
- Search
- Moderation tools (admin can hide/remove posts)
- Direct messages (Capsule Comms)
- Badges / flair for trusted members

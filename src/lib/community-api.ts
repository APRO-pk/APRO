import { supabase } from './supabase';
import type { CommunityPost, CommunityComment, CommunityNotification } from './community-types';

// ─── Scoring constants ─────────────────────────────────────
const TAU = 24;
const P = 1.5;
const EPS = 0.001;

function score(post: { created_at: string; altitude: number }, now: number, nUsers: number) {
  const ageH = (now - new Date(post.created_at).getTime()) / 3.6e6;
  const freshness = 1 / (1 + Math.pow(ageH / TAU, P));
  const underExp = 1 / (1 + post.altitude / Math.max(nUsers, 1));
  return freshness * underExp + EPS;
}

function buildFeed(posts: { created_at: string; altitude: number }[], nUsers: number, k = 20) {
  const now = Date.now();
  return posts
    .map(p => ({ p, key: Math.pow(Math.random(), 1 / score(p, now, nUsers)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, k)
    .map(x => x.p);
}

// ─── Session seen-set ─────────────────────────────────────
const seenInSession = new Set<string>();

export function resetSeenSet() {
  seenInSession.clear();
}

// ─── Profiles ─────────────────────────────────────────────

const profileCache = new Map<string, string>();
const avatarCache = new Map<string, string>();
const flagCache = new Map<string, string>();

export async function ensureProfile(userId: string) {
  if (profileCache.has(userId)) return;
  const { data } = await supabase
    .from('community_profiles')
    .select('display_name, avatar_url, flag')
    .eq('id', userId)
    .maybeSingle();
  if (data?.display_name) {
    profileCache.set(userId, data.display_name);
    if (data.avatar_url) avatarCache.set(userId, data.avatar_url);
    if (data.flag) flagCache.set(userId, data.flag);
    return;
  }
  const session = await supabase.auth.getSession();
  const email = session.data.session?.user?.email ?? '';
  const name = email ? email.split('@')[0] : userId.slice(0, 8);
  await supabase.from('community_profiles').upsert({ id: userId, display_name: name });
  profileCache.set(userId, name);
}

export async function getDisplayName(userId: string): Promise<string> {
  if (profileCache.has(userId)) return profileCache.get(userId)!;
  const { data } = await supabase
    .from('community_profiles')
    .select('display_name, avatar_url, flag')
    .eq('id', userId)
    .maybeSingle();
  if (data?.display_name) {
    profileCache.set(userId, data.display_name);
    if (data.avatar_url) avatarCache.set(userId, data.avatar_url);
    if (data.flag) flagCache.set(userId, data.flag);
    return data.display_name;
  }
  return userId.slice(0, 8);
}

export function getProfileFlag(userId: string): string {
  return flagCache.get(userId) || '';
}

export async function getProfileAvatar(userId: string): Promise<string> {
  if (avatarCache.has(userId)) return avatarCache.get(userId)!;
  if (profileCache.has(userId)) return '';
  const { data } = await supabase
    .from('community_profiles')
    .select('avatar_url, flag')
    .eq('id', userId)
    .maybeSingle();
  if (data?.avatar_url) {
    avatarCache.set(userId, data.avatar_url);
    if (data.flag) flagCache.set(userId, data.flag);
    return data.avatar_url;
  }
  return '';
}

export async function hydrateProfiles(ids: string[]) {
  const unique = [...new Set(ids.filter(id => !profileCache.has(id)))];
  if (unique.length === 0) return;
  const { data } = await supabase
    .from('community_profiles')
    .select('id, display_name, avatar_url, flag')
    .in('id', unique);
  if (data) {
    for (const p of data) {
      if (p.display_name) profileCache.set(p.id, p.display_name);
      if (p.avatar_url) avatarCache.set(p.id, p.avatar_url);
      if (p.flag) flagCache.set(p.id, p.flag);
    }
  }
}

// ─── Batched vote helpers ─────────────────────────────────

async function batchPostVotes(postIds: string[]) {
  if (postIds.length === 0) return new Map<string, { ignite: number; abort: number }>();
  const { data } = await supabase
    .from('community_votes')
    .select('post_id, vote')
    .in('post_id', postIds)
    .is('comment_id', null);
  const map = new Map<string, { ignite: number; abort: number }>();
  for (const id of postIds) map.set(id, { ignite: 0, abort: 0 });
  if (data) {
    for (const row of data) {
      const entry = map.get(row.post_id);
      if (entry) {
        if (row.vote === 1) entry.ignite++;
        else if (row.vote === -1) entry.abort++;
      }
    }
  }
  return map;
}

async function batchPostUserVotes(postIds: string[], userId: string) {
  if (postIds.length === 0) return new Map<string, number | null>();
  const { data } = await supabase
    .from('community_votes')
    .select('post_id, vote')
    .in('post_id', postIds)
    .is('comment_id', null)
    .eq('user_id', userId);
  const map = new Map<string, number | null>();
  for (const id of postIds) map.set(id, null);
  if (data) {
    for (const row of data) {
      map.set(row.post_id, row.vote as 1 | -1);
    }
  }
  return map;
}

// ─── N Users ──────────────────────────────────────────────

let nUsersCache = { count: 0, fetchedAt: 0 };

async function getUserCount() {
  if (Date.now() - nUsersCache.fetchedAt < 60_000) return nUsersCache.count;
  const { count } = await supabase
    .from('community_profiles')
    .select('*', { count: 'exact', head: true });
  nUsersCache = { count: count ?? 0, fetchedAt: Date.now() };
  return nUsersCache.count;
}

// ─── Post Votes ───────────────────────────────────────────

async function getPostVoteCounts(postId: string) {
  const { data } = await supabase
    .from('community_votes')
    .select('vote')
    .eq('post_id', postId)
    .is('comment_id', null);
  if (!data) return { ignite: 0, abort: 0 };
  return {
    ignite: data.filter(v => v.vote === 1).length,
    abort: data.filter(v => v.vote === -1).length,
  };
}

async function getPostUserVote(postId: string, userId?: string) {
  if (!userId) return null;
  const { data } = await supabase
    .from('community_votes')
    .select('vote')
    .eq('post_id', postId)
    .is('comment_id', null)
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.vote as 1 | -1) ?? null;
}

async function setPostVote(postId: string, userId: string, vote: 1 | -1) {
  const { data: existing } = await supabase
    .from('community_votes')
    .select('id, vote')
    .eq('post_id', postId)
    .is('comment_id', null)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.vote === vote) {
      await supabase.from('community_votes').delete().eq('id', existing.id);
      const counts = await getPostVoteCounts(postId);
      return { userVote: null, ...counts };
    }
    await supabase.from('community_votes').update({ vote }).eq('id', existing.id);
  } else {
    await supabase.from('community_votes').insert({ post_id: postId, user_id: userId, vote, comment_id: null });
  }
  const counts = await getPostVoteCounts(postId);
  return { userVote: vote, ...counts };
}

// ─── Comment Votes ────────────────────────────────────────

async function getCommentVoteCounts(commentId: string) {
  const { data } = await supabase
    .from('community_votes')
    .select('vote')
    .eq('comment_id', commentId)
    .is('post_id', null);
  if (!data) return { ignite: 0, abort: 0 };
  return {
    ignite: data.filter(v => v.vote === 1).length,
    abort: data.filter(v => v.vote === -1).length,
  };
}

async function getCommentUserVote(commentId: string, userId?: string) {
  if (!userId) return null;
  const { data } = await supabase
    .from('community_votes')
    .select('vote')
    .eq('comment_id', commentId)
    .is('post_id', null)
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.vote as 1 | -1) ?? null;
}

async function setCommentVote(commentId: string, userId: string, vote: 1 | -1) {
  const { data: existing } = await supabase
    .from('community_votes')
    .select('id, vote')
    .eq('comment_id', commentId)
    .is('post_id', null)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    if (existing.vote === vote) {
      await supabase.from('community_votes').delete().eq('id', existing.id);
      const counts = await getCommentVoteCounts(commentId);
      return { userVote: null, ...counts };
    }
    await supabase.from('community_votes').update({ vote }).eq('id', existing.id);
  } else {
    await supabase.from('community_votes').insert({ comment_id: commentId, user_id: userId, vote, post_id: null });
  }
  const counts = await getCommentVoteCounts(commentId);
  return { userVote: vote, ...counts };
}

// ─── Launches (Posts) ─────────────────────────────────────

const POST_SELECT = `id, author_id, content, images, altitude, relaunch_of, project_post_id, crew_id, created_at, updated_at, comment_count:community_comments(count)`;

async function hydratePost(post: any): Promise<CommunityPost> {
  return { ...post, comment_count: post.comment_count?.[0]?.count ?? 0 } as unknown as CommunityPost;
}

async function attachRelaunch(posts: CommunityPost[]) {
  const relaunchIds = posts.filter(p => p.relaunch_of).map(p => p.relaunch_of!);
  if (relaunchIds.length === 0) return;
  const { data: relaunchData } = await supabase
    .from('community_posts')
    .select(POST_SELECT)
    .in('id', relaunchIds);
  await hydrateProfiles((relaunchData || []).map(r => r.author_id));
  const relaunchMap = new Map<string, CommunityPost>();
  for (const r of (relaunchData || []) as any[]) {
    relaunchMap.set(r.id, await hydratePost(r));
  }
  for (const p of posts) {
    if (p.relaunch_of && relaunchMap.has(p.relaunch_of)) {
      p.relaunch_post = relaunchMap.get(p.relaunch_of);
    }
  }
}

export async function fetchLaunchpad(userId?: string) {
  const { data: trackedIds } = userId
    ? await supabase.from('community_follows').select('following_id').eq('follower_id', userId)
    : { data: null };
  const followed = trackedIds?.map(f => f.following_id) ?? [];

  const nUsers = await getUserCount();

  const { data: rawPosts } = await supabase
    .from('community_posts')
    .select(POST_SELECT)
    .is('crew_id', null)
    .order('created_at', { ascending: false })
    .limit(500);

  if (!rawPosts) return { posts: [], followed };

  // Filter out seen-in-session posts
  const unseen = (rawPosts as any[]).filter(p => !seenInSession.has(p.id));
  const pool = unseen.length > 0 ? unseen : rawPosts;
  if (pool === unseen && unseen.length > 0) {
    for (const p of unseen) seenInSession.add(p.id);
  }

  // Score & select
  const selected = buildFeed(pool, nUsers);
  const posts = await Promise.all(selected.map(hydratePost));
  await hydrateProfiles(posts.map(p => p.author_id));

  await attachRelaunch(posts);

  // Batch vote counts
  const postIds = posts.map(p => p.id);
  const [voteCounts, userVotes] = await Promise.all([
    batchPostVotes(postIds),
    userId ? batchPostUserVotes(postIds, userId) : Promise.resolve(new Map<string, number | null>()),
  ]);
  for (const p of posts) {
    const counts = voteCounts.get(p.id) ?? { ignite: 0, abort: 0 };
    p.ignite_count = counts.ignite;
    p.abort_count = counts.abort;
    if (userId) p.user_vote = userVotes.get(p.id) ?? null;
  }

  return { posts, followed };
}

export async function createLaunch(authorId: string, content: string, images: string[], relaunchOf?: string) {
  const { data, error } = await supabase
    .from('community_posts')
    .insert({ author_id: authorId, content, images, relaunch_of: relaunchOf ?? null })
    .select()
    .single();
  if (error) throw error;
  await ensureProfile(authorId);
  seenInSession.add(data.id);
  return data as unknown as CommunityPost;
}

export async function createCrewPost(crewId: string, authorId: string, content: string, images: string[]) {
  const { data, error } = await supabase
    .from('community_posts')
    .insert({ crew_id: crewId, author_id: authorId, content, images })
    .select()
    .single();
  if (error) throw error;
  await ensureProfile(authorId);
  seenInSession.add(data.id);
  return data as unknown as CommunityPost;
}

export async function deleteLaunch(postId: string) {
  const { error } = await supabase.from('community_posts').delete().eq('id', postId);
  if (error) throw error;
}

export async function fetchLaunchById(postId: string, userId?: string) {
  const { data, error } = await supabase
    .from('community_posts')
    .select(POST_SELECT)
    .eq('id', postId)
    .single();
  if (error) throw error;

  const post = await hydratePost(data);
  await hydrateProfiles([post.author_id]);
  await attachRelaunch([post]);

  const counts = await getPostVoteCounts(post.id);
  post.ignite_count = counts.ignite;
  post.abort_count = counts.abort;
  if (userId) post.user_vote = await getPostUserVote(post.id, userId);

  return post;
}

export async function fetchCrewFeed(crewId: string, userId?: string) {
  const nUsers = await getUserCount();
  const { data: rawPosts } = await supabase
    .from('community_posts')
    .select(POST_SELECT)
    .eq('crew_id', crewId)
    .order('created_at', { ascending: false })
    .limit(500);
  if (!rawPosts) return [];

  const unseen = (rawPosts as any[]).filter(p => !seenInSession.has(p.id));
  const pool = unseen.length > 0 ? unseen : rawPosts;
  if (pool === unseen && unseen.length > 0) {
    for (const p of unseen) seenInSession.add(p.id);
  }
  const selected = buildFeed(pool, nUsers);
  const posts = await Promise.all(selected.map(hydratePost));
  await hydrateProfiles(posts.map(p => p.author_id));
  await attachRelaunch(posts);

  const postIds = posts.map(p => p.id);
  const [voteCounts, userVotes] = await Promise.all([
    batchPostVotes(postIds),
    userId ? batchPostUserVotes(postIds, userId) : Promise.resolve(new Map<string, number | null>()),
  ]);
  for (const p of posts) {
    const counts = voteCounts.get(p.id) ?? { ignite: 0, abort: 0 };
    p.ignite_count = counts.ignite;
    p.abort_count = counts.abort;
    if (userId) p.user_vote = userVotes.get(p.id) ?? null;
  }
  return posts;
}

export async function incrementAltitude(postId: string) {
  await supabase.rpc('increment_post_altitude', { post_id: postId });
}

// ─── Post Vote (public) ───────────────────────────────────

export { setPostVote, getPostVoteCounts as getVoteCounts };

// ─── Telemetry (Comments) ─────────────────────────────────

export async function fetchComments(postId: string, userId?: string) {
  const { data, error } = await supabase
    .from('community_comments')
    .select(`id, post_id, author_id, parent_id, content, created_at, updated_at`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const all = (data || []) as CommunityComment[];
  await hydrateProfiles(all.map(c => c.author_id));

  for (const c of all) {
    const counts = await getCommentVoteCounts(c.id);
    c.ignite_count = counts.ignite;
    c.abort_count = counts.abort;
    if (userId) c.user_vote = await getCommentUserVote(c.id, userId);
  }

  const map = new Map<string, CommunityComment & { replies: CommunityComment[] }>();
  const roots: (CommunityComment & { replies: CommunityComment[] })[] = [];

  for (const c of all) {
    map.set(c.id, { ...c, replies: [] });
  }
  for (const c of all) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies.push(map.get(c.id)!);
    } else {
      roots.push(map.get(c.id)!);
    }
  }
  return roots;
}

export async function createComment(authorId: string, postId: string, content: string, parentId?: string) {
  const { data, error } = await supabase
    .from('community_comments')
    .insert({ author_id: authorId, post_id: postId, content, parent_id: parentId ?? null })
    .select()
    .single();
  if (error) throw error;
  await ensureProfile(authorId);
  return data as unknown as CommunityComment;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from('community_comments').delete().eq('id', commentId);
  if (error) throw error;
}

// ─── Comment Vote (public) ────────────────────────────────

export { setCommentVote, getCommentVoteCounts };

// ─── Tracking (Follows) ───────────────────────────────────

export async function isFollowing(followerId: string, followingId: string) {
  const { data } = await supabase
    .from('community_follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return !!data;
}

export async function toggleFollow(followerId: string, followingId: string) {
  const following = await isFollowing(followerId, followingId);
  if (following) {
    await supabase
      .from('community_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    return false;
  }
  await supabase
    .from('community_follows')
    .insert({ follower_id: followerId, following_id: followingId });
  return true;
}

export async function fetchFollowers(userId: string) {
  const { data } = await supabase
    .from('community_follows')
    .select('follower_id, created_at')
    .eq('following_id', userId);
  return (data || []) as any[];
}

export async function fetchFollowing(userId: string) {
  const { data } = await supabase
    .from('community_follows')
    .select('following_id, created_at')
    .eq('follower_id', userId);
  return (data || []) as any[];
}

export async function removeFollower(userId: string, followerId: string) {
  const { error } = await supabase
    .from('community_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', userId);
  if (error) throw error;
}

// ─── Signals (Notifications) ──────────────────────────────

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from('community_notifications')
    .select(`id, user_id, actor_id, type, post_id, comment_id, read, created_at`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const notifications = (data || []) as unknown as CommunityNotification[];
  await hydrateProfiles(notifications.map(n => n.actor_id));
  return notifications as (CommunityNotification & { actor_name?: string })[];
}

export async function unreadSignalCount(userId: string) {
  const { count } = await supabase
    .from('community_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  return count ?? 0;
}

export async function markSignalsRead(userId: string) {
  await supabase
    .from('community_notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
}

// ─── Feed Position Persistence ────────────────────────────

export async function saveFeedPosition(userId: string, postId: string) {
  await supabase
    .from('community_profiles')
    .update({ last_feed_post_id: postId, last_feed_updated_at: new Date().toISOString() })
    .eq('id', userId);
}

export async function loadFeedPosition(userId: string) {
  const { data } = await supabase
    .from('community_profiles')
    .select('last_feed_post_id')
    .eq('id', userId)
    .maybeSingle();
  return data?.last_feed_post_id ?? null;
}

// ─── Users ────────────────────────────────────────────────

export async function fetchUserPosts(userId: string, currentUserId?: string) {
  const { data, error } = await supabase
    .from('community_posts')
    .select(POST_SELECT)
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  const posts = await Promise.all((data || []).map(hydratePost));
  await hydrateProfiles(posts.map(p => p.author_id));
  await attachRelaunch(posts);

  const postIds = posts.map(p => p.id);
  const [voteCounts, userVotes] = await Promise.all([
    batchPostVotes(postIds),
    currentUserId ? batchPostUserVotes(postIds, currentUserId) : Promise.resolve(new Map<string, number | null>()),
  ]);
  for (const p of posts) {
    const counts = voteCounts.get(p.id) ?? { ignite: 0, abort: 0 };
    p.ignite_count = counts.ignite;
    p.abort_count = counts.abort;
    if (currentUserId) p.user_vote = userVotes.get(p.id) ?? null;
  }

  return posts;
}

// ─── Profile Update ───────────────────────────────────────

export async function updateProfile(userId: string, updates: { display_name?: string; bio?: string; avatar_url?: string; flag?: string }) {
  const { error } = await supabase
    .from('community_profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
  if (updates.display_name) profileCache.set(userId, updates.display_name);
  if (updates.avatar_url !== undefined) {
    if (updates.avatar_url) avatarCache.set(userId, updates.avatar_url);
    else avatarCache.delete(userId);
  }
  if (updates.flag !== undefined) {
    if (updates.flag) flagCache.set(userId, updates.flag);
    else flagCache.delete(userId);
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png';
  const path = `avatars/${userId}_${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('community_images')
    .upload(path, file, { upsert: true });
  if (uploadError) throw uploadError;
  const { data: { publicUrl } } = supabase.storage
    .from('community_images')
    .getPublicUrl(path);
  return publicUrl;
}

export async function isUsernameTaken(username: string, excludeUserId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('community_profiles')
    .select('id')
    .eq('display_name', username)
    .neq('id', excludeUserId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('community_profiles')
    .select('id, display_name, bio, avatar_url, flag')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

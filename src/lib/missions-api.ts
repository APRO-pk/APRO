import { supabase } from './supabase';
import { ensureProfile, getDisplayName, hydrateProfiles } from './community-api';
import { findUserByUsername } from './crew-api';
import type { Project, ProjectMember, ProjectPhase, ProjectMilestone, MilestoneChecklistItem, ProjectPost, ProjectPostVote, ProjectPostComment, CrewFollow, TrackedProject, ProjectInvite } from './missions-types';

// ─── Projects ───────────────────────────────────────────────

export async function fetchCrewProjects(crewId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_type', 'crew')
    .eq('owner_id', crewId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Project[];
}

export async function fetchUserProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_type', 'user')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Project[];
}

export async function fetchProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();
  if (error) throw error;
  return data as Project | null;
}

export async function createProject(name: string, description: string, ownerType: 'user' | 'crew', ownerId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, description, visibility: 'missions', owner_type: ownerType, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  // Auto-add creator as admin member
  if (ownerType === 'user') {
    // ownerId is the user's own ID
    const { error: mErr } = await supabase.from('project_members').insert({
      project_id: data.id,
      user_id: ownerId,
      role: 'admin',
    });
    if (mErr) console.error('Failed to add creator to project_members', mErr);
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      let role: 'admin' | 'member' = 'member';
      const { data: cm } = await supabase
        .from('crew_members')
        .select('role')
        .eq('crew_id', ownerId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (cm && (cm.role === 'prime' || cm.role === 'manager')) role = 'admin';
      const { error: mErr } = await supabase.from('project_members').insert({
        project_id: data.id,
        user_id: user.id,
        role,
      });
      if (mErr) console.error('Failed to add creator to project_members', mErr);
    }
  }
  return data as Project;
}

export async function updateProject(projectId: string, updates: { name?: string; description?: string; visibility?: string }) {
  const { error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId);
  if (error) throw error;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw error;
}

export async function fetchPublicProjects(limit = 20): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as Project[];
}

export async function fetchProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select('user_id, role')
    .eq('project_id', projectId);
  if (error) throw error;
  const members = (data || []) as ProjectMember[];
  await hydrateProfiles(members.map(m => m.user_id));
  for (const m of members) {
    m.display_name = await getDisplayName(m.user_id);
  }
  return members;
}

export async function addProjectMember(projectId: string, userId: string, role: 'admin' | 'member' = 'member') {
  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, user_id: userId, role });
  if (error) throw error;
}

export async function removeProjectMember(projectId: string, userId: string) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Phases ─────────────────────────────────────────────────

export async function fetchPhases(projectId: string): Promise<ProjectPhase[]> {
  const { data, error } = await supabase
    .from('project_phases')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data || []) as ProjectPhase[];
}

export async function createPhase(projectId: string, name: string, orderIndex: number, deadline?: string): Promise<ProjectPhase> {
  const { data, error } = await supabase
    .from('project_phases')
    .insert({ project_id: projectId, name, order_index: orderIndex, deadline: deadline ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as ProjectPhase;
}

export async function updatePhase(phaseId: string, updates: { name?: string; description?: string; deadline?: string | null; completed?: boolean }) {
  const { error } = await supabase
    .from('project_phases')
    .update(updates)
    .eq('id', phaseId);
  if (error) throw error;
}

export async function completePhase(phaseId: string) {
  await updatePhase(phaseId, { completed: true });
}

// ─── Milestones ─────────────────────────────────────────────

export async function fetchMilestones(phaseId: string): Promise<ProjectMilestone[]> {
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('phase_id', phaseId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ProjectMilestone[];
}

export async function createMilestone(phaseId: string, name: string, description?: string): Promise<ProjectMilestone> {
  const { data, error } = await supabase
    .from('project_milestones')
    .insert({ phase_id: phaseId, name, description: description ?? '' })
    .select()
    .single();
  if (error) throw error;
  return data as ProjectMilestone;
}

export async function updateMilestone(milestoneId: string, updates: { name?: string; description?: string }) {
  const { error } = await supabase
    .from('project_milestones')
    .update(updates)
    .eq('id', milestoneId);
  if (error) throw error;
}

// ─── Checklist Items ────────────────────────────────────────

export async function fetchChecklistItems(milestoneId: string): Promise<MilestoneChecklistItem[]> {
  const { data, error } = await supabase
    .from('milestone_checklist_items')
    .select('*')
    .eq('milestone_id', milestoneId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as MilestoneChecklistItem[];
}

export async function createChecklistItem(milestoneId: string, text: string, assignedTo?: string): Promise<MilestoneChecklistItem> {
  const { data, error } = await supabase
    .from('milestone_checklist_items')
    .insert({ milestone_id: milestoneId, text, assigned_to: assignedTo ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as MilestoneChecklistItem;
}

export async function toggleChecklistItem(itemId: string, completed: boolean) {
  const { error } = await supabase
    .from('milestone_checklist_items')
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq('id', itemId);
  if (error) throw error;
}

export async function assignChecklistItem(itemId: string, userId: string | null) {
  const { error } = await supabase
    .from('milestone_checklist_items')
    .update({ assigned_to: userId })
    .eq('id', itemId);
  if (error) throw error;
}

export async function deleteChecklistItem(itemId: string) {
  const { error } = await supabase
    .from('milestone_checklist_items')
    .delete()
    .eq('id', itemId);
  if (error) throw error;
}

// ─── Project Posts ──────────────────────────────────────────

const POST_SELECT = `id, project_id, author_id, phase_id, milestone_id, checklist_item_id, content, images, visibility, created_at, updated_at`;

async function hydratePost(post: any): Promise<ProjectPost> {
  return post as ProjectPost;
}

export async function fetchProjectFeed(projectId: string, userId?: string): Promise<ProjectPost[]> {
  const { data, error } = await supabase
    .from('project_posts')
    .select(POST_SELECT)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const posts = await Promise.all((data || []).map(hydratePost));
  await hydrateProfiles(posts.map(p => p.author_id));
  const postIds = posts.map(p => p.id);
  // Fetch vote counts and user votes in batch
  const [igniteRes, abortRes, voteRes, commentRes] = await Promise.all([
    postIds.length ? supabase.from('project_post_votes').select('project_post_id').eq('vote_type', 1).in('project_post_id', postIds) : { data: [] },
    postIds.length ? supabase.from('project_post_votes').select('project_post_id').eq('vote_type', -1).in('project_post_id', postIds) : { data: [] },
    postIds.length && userId ? supabase.from('project_post_votes').select('project_post_id, vote_type').eq('user_id', userId).in('project_post_id', postIds) : { data: [] },
    postIds.length ? supabase.from('project_post_comments').select('project_post_id').in('project_post_id', postIds) : { data: [] },
  ]);
  const igniteMap = new Map<string, number>();
  for (const r of (igniteRes.data || []) as any[]) {
    igniteMap.set(r.project_post_id, (igniteMap.get(r.project_post_id) || 0) + 1);
  }
  const abortMap = new Map<string, number>();
  for (const r of (abortRes.data || []) as any[]) {
    abortMap.set(r.project_post_id, (abortMap.get(r.project_post_id) || 0) + 1);
  }
  const userVoteMap = new Map<string, number>();
  for (const r of (voteRes.data || []) as any[]) {
    userVoteMap.set(r.project_post_id, r.vote_type);
  }
  const commentCountMap = new Map<string, number>();
  for (const r of (commentRes.data || []) as any[]) {
    commentCountMap.set(r.project_post_id, (commentCountMap.get(r.project_post_id) || 0) + 1);
  }
  // Fetch phase/milestone/checklist names
  const phaseIds = [...new Set(posts.map(p => p.phase_id))];
  const milestoneIds = [...new Set(posts.map(p => p.milestone_id))];
  const checklistIds = posts.filter(p => p.checklist_item_id).map(p => p.checklist_item_id!);
  const [phases, milestones, checklists] = await Promise.all([
    phaseIds.length ? supabase.from('project_phases').select('id, name').in('id', phaseIds) : { data: [] },
    milestoneIds.length ? supabase.from('project_milestones').select('id, name').in('id', milestoneIds) : { data: [] },
    checklistIds.length ? supabase.from('milestone_checklist_items').select('id, text').in('id', checklistIds) : { data: [] },
  ]);
  const phaseMap = new Map((phases.data || []).map((p: any) => [p.id, p.name]));
  const milestoneMap = new Map((milestones.data || []).map((m: any) => [m.id, m.name]));
  const checklistMap = new Map((checklists.data || []).map((c: any) => [c.id, c.text]));
  for (const p of posts) {
    p.phase_name = phaseMap.get(p.phase_id) || '';
    p.milestone_name = milestoneMap.get(p.milestone_id) || '';
    p.checklist_text = checklistMap.get(p.checklist_item_id || '') || undefined;
    p.ignite_count = igniteMap.get(p.id) || 0;
    p.abort_count = abortMap.get(p.id) || 0;
    p.user_vote = userVoteMap.get(p.id) || null;
    p.comment_count = commentCountMap.get(p.id) || 0;
    const dn = await getDisplayName(p.author_id);
    p.author_name = dn;
  }
  return posts;
}

export async function createProjectPost(
  projectId: string,
  authorId: string,
  content: string,
  images: string[],
  phaseId: string,
  milestoneId: string,
  visibility: 'private' | 'missions' | 'public',
  checklistItemId?: string,
): Promise<ProjectPost> {
  const { data, error } = await supabase
    .from('project_posts')
    .insert({
      project_id: projectId,
      author_id: authorId,
      phase_id: phaseId,
      milestone_id: milestoneId,
      checklist_item_id: checklistItemId ?? null,
      content,
      images,
      visibility,
    })
    .select()
    .single();
  if (error) throw error;
  await ensureProfile(authorId);
  // Hydrate names for immediate display
  const post = data as ProjectPost;
  post.author_name = await getDisplayName(authorId);
  const [phaseRes, milestoneRes] = await Promise.all([
    supabase.from('project_phases').select('name').eq('id', phaseId).maybeSingle(),
    supabase.from('project_milestones').select('name').eq('id', milestoneId).maybeSingle(),
  ]);
  post.phase_name = (phaseRes.data as any)?.name || '';
  post.milestone_name = (milestoneRes.data as any)?.name || '';
  // If public, also create community post
  if (visibility === 'public') {
    await supabase.from('community_posts').insert({
      project_post_id: data.id,
      author_id: authorId,
      content,
      images,
    });
  }
  return post;
}

export async function deleteProjectPost(postId: string) {
  const { error } = await supabase
    .from('project_posts')
    .delete()
    .eq('id', postId);
  if (error) throw error;
}

// ─── Votes ───────────────────────────────────────────────────

export async function voteProjectPost(postId: string, userId: string, voteType: number) {
  // Upsert: delete existing, then insert new (or remove if same vote)
  const { data: existing } = await supabase
    .from('project_post_votes')
    .select('vote_type')
    .eq('project_post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    if (existing.vote_type === voteType) {
      // Remove vote
      await supabase.from('project_post_votes').delete().eq('project_post_id', postId).eq('user_id', userId);
    } else {
      // Change vote
      await supabase.from('project_post_votes').update({ vote_type: voteType }).eq('project_post_id', postId).eq('user_id', userId);
    }
  } else {
    await supabase.from('project_post_votes').insert({ project_post_id: postId, user_id: userId, vote_type: voteType });
  }
}

// ─── Comments ────────────────────────────────────────────────

export async function fetchProjectPostComments(postId: string): Promise<ProjectPostComment[]> {
  const { data, error } = await supabase
    .from('project_post_comments')
    .select('*')
    .eq('project_post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const comments = (data || []) as ProjectPostComment[];
  const authorIds = [...new Set(comments.map(c => c.author_id))];
  await hydrateProfiles(authorIds);
  for (const c of comments) {
    c.author_name = await getDisplayName(c.author_id);
  }
  // Build threaded tree
  const map = new Map<string, ProjectPostComment>();
  const roots: ProjectPostComment[] = [];
  for (const c of comments) {
    map.set(c.id, c);
    c.replies = [];
  }
  for (const c of comments) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

export async function createProjectPostComment(postId: string, authorId: string, content: string, parentId?: string): Promise<ProjectPostComment> {
  const { data, error } = await supabase
    .from('project_post_comments')
    .insert({ project_post_id: postId, author_id: authorId, content, parent_id: parentId ?? null })
    .select()
    .single();
  if (error) throw error;
  const comment = data as ProjectPostComment;
  await ensureProfile(authorId);
  comment.author_name = await getDisplayName(authorId);
  comment.replies = [];
  return comment;
}

export async function deleteProjectPostComment(commentId: string) {
  const { error } = await supabase
    .from('project_post_comments')
    .delete()
    .eq('id', commentId);
  if (error) throw error;
}

// ─── Relaunch ────────────────────────────────────────────────

export async function relaunchProjectPost(postId: string, authorId: string, content: string, images: string[]) {
  await ensureProfile(authorId);
  const { error } = await supabase
    .from('community_posts')
    .insert({ project_post_id: postId, author_id: authorId, content, images });
  if (error) throw error;
}

// ─── Progress ───────────────────────────────────────────────

export async function getMilestoneProgress(milestoneId: string): Promise<{ done: number; total: number }> {
  const { data, error } = await supabase
    .from('milestone_checklist_items')
    .select('completed')
    .eq('milestone_id', milestoneId);
  if (error) throw error;
  const items = data || [];
  return { done: items.filter(i => i.completed).length, total: items.length };
}

export async function getPhaseProgress(phaseId: string): Promise<{ done: number; total: number }> {
  const { data: milestones, error } = await supabase
    .from('project_milestones')
    .select('id')
    .eq('phase_id', phaseId);
  if (error) throw error;
  const milestoneIds = (milestones || []).map(m => m.id);
  if (milestoneIds.length === 0) return { done: 0, total: 1 };
  let totalDone = 0;
  let totalItems = 0;
  for (const mid of milestoneIds) {
    const p = await getMilestoneProgress(mid);
    totalDone += p.done;
    totalItems += p.total;
  }
  return { done: totalDone, total: totalItems || 1 };
}

// ─── Crew Tracking ──────────────────────────────────────────

export async function isTrackingCrew(userId: string, crewId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('crew_follows')
    .select('crew_id')
    .eq('user_id', userId)
    .eq('crew_id', crewId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleCrewFollow(userId: string, crewId: string): Promise<boolean> {
  const following = await isTrackingCrew(userId, crewId);
  if (following) {
    const { error } = await supabase
      .from('crew_follows')
      .delete()
      .eq('user_id', userId)
      .eq('crew_id', crewId);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('crew_follows')
      .insert({ user_id: userId, crew_id: crewId });
    if (error && error.code === '23505') return true;
    if (error) throw error;
    return true;
  }
}

export async function fetchCrewFollowers(crewId: string): Promise<{ user_id: string }[]> {
  const { data, error } = await supabase
    .from('crew_follows')
    .select('user_id')
    .eq('crew_id', crewId);
  if (error) throw error;
  return data || [];
}

export async function fetchFollowedCrews(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('crew_follows')
    .select('crew_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(f => f.crew_id);
}

// ─── Project Tracking ───────────────────────────────────────

export async function isTrackingProject(userId: string, projectId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('project_follows')
    .select('project_id')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function toggleProjectFollow(userId: string, projectId: string): Promise<boolean> {
  const following = await isTrackingProject(userId, projectId);
  if (following) {
    const { error } = await supabase
      .from('project_follows')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('project_follows')
      .insert({ user_id: userId, project_id: projectId });
    if (error && error.code === '23505') return true;
    if (error) throw error;
    return true;
  }
}

export async function fetchFollowedProjects(userId: string): Promise<TrackedProject[]> {
  // Get followed project IDs
  const { data: follows, error: fError } = await supabase
    .from('project_follows')
    .select('project_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (fError) throw fError;
  if (!follows || follows.length === 0) return [];

  const projectIds = follows.map(f => f.project_id);

  // Fetch projects
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('*')
    .in('id', projectIds);
  if (pError) throw pError;
  if (!projects || projects.length === 0) return [];

  // Fetch post counts to compute new_posts (dummy: count posts since tracking started)
  const now = new Date().toISOString();
  const postCountPromises = follows.map(async f => {
    const { count } = await supabase
      .from('project_posts')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', f.project_id)
      .gte('created_at', f.created_at);
    return { project_id: f.project_id, new_posts: count || 0 };
  });
  const postCounts = await Promise.all(postCountPromises);
  const postCountMap = new Map(postCounts.map(p => [p.project_id, p.new_posts]));

  // Fetch progress for each project (phases → milestones → checklist items)
  const progressPromises = projects.map(async (p: Project) => {
    const phases = await supabase.from('project_phases').select('id').eq('project_id', p.id);
    const phaseIds = (phases.data || []).map((ph: any) => ph.id);
    if (phaseIds.length === 0) return { id: p.id, pct: 0 };

    const milestones = await supabase.from('project_milestones').select('id, phase_id').in('phase_id', phaseIds);
    const milestoneIds = (milestones.data || []).map((m: any) => m.id);
    if (milestoneIds.length === 0) return { id: p.id, pct: 0 };

    const items = await supabase.from('milestone_checklist_items').select('completed').in('milestone_id', milestoneIds);
    const allItems = (items.data || []) as { completed: boolean }[];
    const done = allItems.filter(i => i.completed).length;
    const total = allItems.length || 1;
    return { id: p.id, pct: Math.round((done / total) * 100) };
  });
  const progressResults = await Promise.all(progressPromises);
  const progressMap = new Map(progressResults.map(r => [r.id, r.pct]));

  // Preserve follow order
  const projectMap = new Map(projects.map((p: Project) => [p.id, p]));
  return follows.map(f => {
    const p = projectMap.get(f.project_id) as Project;
    if (!p) return null;
    return {
      ...p,
      progress_pct: progressMap.get(p.id) || 0,
      new_posts: postCountMap.get(p.id) || 0,
    } as TrackedProject;
  }).filter(Boolean) as TrackedProject[];
}

// ─── Project Invites ─────────────────────────────────────────

export async function inviteToProject(projectId: string, invitedBy: string, username: string): Promise<{ userId: string | null }> {
  const userId = await findUserByUsername(username);
  if (!userId) return { userId: null };
  const { error } = await supabase
    .from('project_invites')
    .insert({ project_id: projectId, user_id: userId, invited_by: invitedBy });
  if (error && error.code === '23505') return { userId }; // already invited
  if (error) throw error;
  return { userId };
}

export async function respondToInvite(inviteId: string, accept: boolean) {
  if (accept) {
    // Fetch invite to get project_id and user_id
    const { data: invite, error: fetchErr } = await supabase
      .from('project_invites')
      .select('*')
      .eq('id', inviteId)
      .single();
    if (fetchErr) throw fetchErr;
    // Insert as project member
    const { error: insertErr } = await supabase
      .from('project_members')
      .insert({ project_id: invite.project_id, user_id: invite.user_id, role: 'member' });
    if (insertErr && insertErr.code !== '23505') throw insertErr; // ignore if already member
    // Update invite status
    const { error: updateErr } = await supabase
      .from('project_invites')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', inviteId);
    if (updateErr) throw updateErr;
  } else {
    const { error } = await supabase
      .from('project_invites')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', inviteId);
    if (error) throw error;
  }
}

export async function fetchProjectInvites(projectId: string): Promise<ProjectInvite[]> {
  const { data, error } = await supabase
    .from('project_invites')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const invites = (data || []) as ProjectInvite[];
  const userIds = [...new Set(invites.map(i => i.user_id))];
  await hydrateProfiles(userIds);
  for (const i of invites) {
    i.user_name = await getDisplayName(i.user_id);
    i.inviter_name = await getDisplayName(i.invited_by);
  }
  return invites;
}

export async function fetchUserInvites(userId: string): Promise<ProjectInvite[]> {
  const { data, error } = await supabase
    .from('project_invites')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const invites = (data || []) as ProjectInvite[];
  if (invites.length === 0) return [];
  // Fetch project names
  const projectIds = [...new Set(invites.map(i => i.project_id))];
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .in('id', projectIds);
  const projectMap = new Map((projects || []).map((p: any) => [p.id, p.name]));
  const userIds = [...new Set(invites.map(i => i.invited_by))];
  await hydrateProfiles(userIds);
  for (const i of invites) {
    i.project_name = projectMap.get(i.project_id) || 'Unknown Project';
    i.inviter_name = await getDisplayName(i.invited_by);
  }
  return invites;
}

export async function cancelInvite(inviteId: string) {
  const { error } = await supabase
    .from('project_invites')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', inviteId);
  if (error) throw error;
}

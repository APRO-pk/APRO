import { supabase } from './supabase';
import { hydrateProfiles, getDisplayName, getProfileAvatar } from './community-api';
import type { Crew, CrewMember, CrewJoinRequest, CrewInvite } from './crew-types';

// ─── Crew CRUD ─────────────────────────────────────────────

export async function fetchActiveCrews(limit = 20): Promise<Crew[]> {
  const { data, error } = await supabase
    .from('crews')
    .select('*, crew_members(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map((c: any) => ({
    ...c,
    member_count: c.crew_members?.[0]?.count ?? 0,
  }));
}

export async function fetchCrewById(id: string): Promise<Crew | null> {
  const { data, error } = await supabase
    .from('crews')
    .select('*, crew_members(count)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { ...data, member_count: (data as any).crew_members?.[0]?.count ?? 0 };
}

export async function createCrew(name: string, description: string, flag: string, userId: string) {
  const { data, error } = await supabase
    .from('crews')
    .insert({ name, description, flag: flag || null, prime_id: userId })
    .select()
    .single();
  if (error) throw error;
  // Auto-add prime as member
  await supabase.from('crew_members').insert({ crew_id: data.id, user_id: userId, role: 'prime' });
  return data;
}

export async function updateCrew(crewId: string, updates: { name?: string; description?: string; flag?: string }) {
  const { error } = await supabase
    .from('crews')
    .update(updates)
    .eq('id', crewId);
  if (error) throw error;
}

// ─── Membership ────────────────────────────────────────────

export async function fetchCrewMembers(crewId: string): Promise<CrewMember[]> {
  const { data, error } = await supabase
    .from('crew_members')
    .select('*')
    .eq('crew_id', crewId);
  if (error) throw error;
  const members = (data || []) as CrewMember[];
  await hydrateProfiles(members.map(m => m.user_id));
  for (const m of members) {
    m.display_name = await getDisplayName(m.user_id);
    m.avatar_url = await getProfileAvatar(m.user_id);
  }
  return members.sort((a, b) => {
    const rank = { prime: 0, manager: 1, member: 2 };
    return (rank[a.role] ?? 3) - (rank[b.role] ?? 3);
  });
}

export async function fetchUserCrew(userId: string): Promise<Crew | null> {
  const { data, error } = await supabase
    .from('crew_members')
    .select('crew_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return fetchCrewById(data.crew_id);
}

export async function fetchUserRole(crewId: string, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('crew_members')
    .select('role')
    .eq('crew_id', crewId)
    .eq('user_id', userId)
    .maybeSingle();
  return data?.role ?? null;
}

export async function leaveCrew(crewId: string, userId: string) {
  const { error: deleteErr } = await supabase
    .from('crew_members')
    .delete()
    .eq('crew_id', crewId)
    .eq('user_id', userId);
  if (deleteErr) throw deleteErr;
  // Clear the join request so user can re-request later
  await supabase
    .from('crew_join_requests')
    .update({ status: 'cancelled' })
    .eq('crew_id', crewId)
    .eq('user_id', userId);
}

export async function removeMember(crewId: string, userId: string) {
  const { error: deleteErr } = await supabase
    .from('crew_members')
    .delete()
    .eq('crew_id', crewId)
    .eq('user_id', userId);
  if (deleteErr) throw deleteErr;
  // Clear the join request so user can re-request later
  await supabase
    .from('crew_join_requests')
    .update({ status: 'cancelled' })
    .eq('crew_id', crewId)
    .eq('user_id', userId);
}

export async function transferPrime(crewId: string, newPrimeId: string, oldPrimeId: string) {
  const { error: err1 } = await supabase
    .from('crew_members')
    .update({ role: 'manager' })
    .eq('crew_id', crewId)
    .eq('user_id', oldPrimeId);
  if (err1) throw err1;
  const { error: err2 } = await supabase
    .from('crew_members')
    .update({ role: 'prime' })
    .eq('crew_id', crewId)
    .eq('user_id', newPrimeId);
  if (err2) throw err2;
  const { error: err3 } = await supabase
    .from('crews')
    .update({ prime_id: newPrimeId })
    .eq('id', crewId);
  if (err3) throw err3;
}

export async function changeRole(crewId: string, userId: string, role: 'manager' | 'member') {
  const { error } = await supabase
    .from('crew_members')
    .update({ role })
    .eq('crew_id', crewId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Join Requests ─────────────────────────────────────────

export async function requestJoin(crewId: string, userId: string) {
  const { data: existing } = await supabase
    .from('crew_join_requests')
    .select('id, status')
    .eq('crew_id', crewId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) {
    if (existing.status === 'pending') return;
    // Re-request: reset to pending (handles accepted-without-membership edge case)
    await supabase
      .from('crew_join_requests')
      .update({ status: 'pending' })
      .eq('id', existing.id);
    return;
  }
  const { error } = await supabase
    .from('crew_join_requests')
    .insert({ crew_id: crewId, user_id: userId, status: 'pending' });
  if (error && error.code === '23505') return;
  if (error) throw error;
}

export async function fetchPendingRequests(crewId: string): Promise<CrewJoinRequest[]> {
  const { data, error } = await supabase
    .from('crew_join_requests')
    .select('*')
    .eq('crew_id', crewId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  const requests = (data || []) as CrewJoinRequest[];
  await hydrateProfiles(requests.map(r => r.user_id));
  for (const r of requests) {
    r.display_name = await getDisplayName(r.user_id);
  }
  return requests;
}

export async function fetchMyRequests(userId: string): Promise<CrewJoinRequest[]> {
  const { data, error } = await supabase
    .from('crew_join_requests')
    .select('*, crews(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    ...r,
    crew_name: r.crews?.name ?? '',
  }));
}

export async function acceptJoinRequest(requestId: string, crewId: string, userId: string) {
  const { error: insertErr } = await supabase
    .from('crew_members')
    .insert({ crew_id: crewId, user_id: userId, role: 'member' });
  if (insertErr) throw insertErr;
  // Only mark accepted after member insert succeeds
  const { error: acceptErr } = await supabase
    .from('crew_join_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);
  if (acceptErr) throw acceptErr;
  // Cancel all other pending requests from this user
  const { error: cancelErr } = await supabase
    .from('crew_join_requests')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'pending')
    .neq('id', requestId);
  if (cancelErr) throw cancelErr;
}

export async function rejectJoinRequest(requestId: string) {
  await supabase
    .from('crew_join_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);
}

export async function cancelJoinRequest(requestId: string) {
  await supabase
    .from('crew_join_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId);
}

// ─── Invites ───────────────────────────────────────────────

export async function inviteToCrew(crewId: string, inviterId: string, inviteeId: string) {
  const { error } = await supabase
    .from('crew_invites')
    .insert({ crew_id: crewId, inviter_id: inviterId, invitee_id: inviteeId });
  if (error) throw error;
}

export async function fetchPendingInvites(userId: string): Promise<CrewInvite[]> {
  const { data, error } = await supabase
    .from('crew_invites')
    .select('*, crews(name), inviter:inviter_id(display_name)')
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((i: any) => ({
    ...i,
    crew_name: i.crews?.name ?? '',
    inviter_name: i.inviter?.display_name ?? '',
  }));
}

export async function acceptInvite(inviteId: string, crewId: string, userId: string) {
  await supabase
    .from('crew_invites')
    .update({ status: 'accepted' })
    .eq('id', inviteId);
  await supabase
    .from('crew_members')
    .insert({ crew_id: crewId, user_id: userId, role: 'member' });
}

export async function rejectInvite(inviteId: string) {
  await supabase
    .from('crew_invites')
    .update({ status: 'rejected' })
    .eq('id', inviteId);
}

// ─── Lookup by username ────────────────────────────────────

export async function findUserByUsername(username: string): Promise<string | null> {
  const { data } = await supabase
    .from('community_profiles')
    .select('id')
    .eq('display_name', username)
    .maybeSingle();
  return data?.id ?? null;
}

import { supabase } from './supabase';
import { getDisplayName, getProfileAvatar } from './community-api';
import type { DMConversation, DMMessage } from './dms-types';

// ─── Helpers ─────────────────────────────────────────────

function firstName(name: string) {
  return name.split(' ')[0] || name;
}

async function hydrateConversationProfiles(conversations: DMConversation[]) {
  for (const c of conversations) {
    if (c.other_user_id) {
      const [name, avatar] = await Promise.all([
        getDisplayName(c.other_user_id),
        getProfileAvatar(c.other_user_id),
      ]);
      c.other_user_name = firstName(name);
      c.other_user_avatar = avatar;
    }
  }
}

// ─── Get or create a conversation between two users ─────

export async function getOrCreateConversation(otherUserId: string) {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('create_dm_conversation', { uid1: userId, uid2: otherUserId })
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create conversation');
  return data as string;
}

// ─── Get all conversations for current user ────────────

export async function getMyConversations(): Promise<DMConversation[]> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;
  if (!userId) return [];

  const { data: participants } = await supabase
    .from('dms_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId);

  if (!participants || participants.length === 0) return [];

  const convIds = participants.map(p => p.conversation_id);
  const readMap = new Map(participants.map(p => [p.conversation_id, p.last_read_at]));

  // Get conversations with last message
  const { data: conversations } = await supabase
    .from('dms_conversations')
    .select('*')
    .in('id', convIds)
    .order('updated_at', { ascending: false });

  if (!conversations) return [];

  // Get other participants for each conversation
  const result: DMConversation[] = [];

  for (const conv of conversations) {
    const { data: others } = await supabase
      .from('dms_participants')
      .select('user_id')
      .eq('conversation_id', conv.id)
      .neq('user_id', userId)
      .limit(1);

    const otherUserId = others?.[0]?.user_id;

    // Skip conversations with no other participant (orphaned from failed inserts)
    if (!otherUserId) continue;

    // Get last message
    const { data: lastMsgs } = await supabase
      .from('dms_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const lastMessage = lastMsgs?.[0] ?? undefined;

    // Count unread
    let unreadCount = 0;
    if (lastMessage && readMap.has(conv.id)) {
      const lastRead = new Date(readMap.get(conv.id)!).getTime();
      if (new Date(lastMessage.created_at).getTime() > lastRead) {
        const { count } = await supabase
          .from('dms_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', readMap.get(conv.id));
        unreadCount = count ?? 0;
      }
    }

    result.push({
      id: conv.id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      last_message: lastMessage,
      other_user_id: otherUserId,
      unread_count: unreadCount,
    });
  }

  await hydrateConversationProfiles(result);
  return result;
}

// ─── Get messages for a conversation ───────────────────

export async function getConversationMessages(conversationId: string): Promise<DMMessage[]> {
  const { data } = await supabase
    .from('dms_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return data ?? [];
}

// ─── Send a message ────────────────────────────────────

export async function sendDMMessage(conversationId: string, content: string) {
  const session = await supabase.auth.getSession();
  const senderId = session.data.session?.user?.id;
  if (!senderId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('dms_messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, content })
    .select('*')
    .single();

  // Update conversation updated_at
  await supabase
    .from('dms_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) throw error;
  return data as DMMessage;
}

// ─── Mark conversation as read ─────────────────────────

export async function markConversationRead(conversationId: string) {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;
  if (!userId) return;

  await supabase
    .from('dms_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId);
}

// ─── Get total unread count ────────────────────────────

export async function getTotalUnreadCount(): Promise<number> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;
  if (!userId) return 0;

  const { data: participants } = await supabase
    .from('dms_participants')
    .select('conversation_id, last_read_at')
    .eq('user_id', userId);

  if (!participants || participants.length === 0) return 0;

  let total = 0;
  for (const p of participants) {
    const { count } = await supabase
      .from('dms_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', p.conversation_id)
      .gt('created_at', p.last_read_at);
    total += (count ?? 0);
  }
  return total;
}

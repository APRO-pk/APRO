export interface DMConversation {
  id: string;
  created_at: string;
  updated_at: string;
  // joined
  participants?: DMParticipant[];
  last_message?: DMMessage;
  other_user_name?: string;
  other_user_id?: string;
  other_user_avatar?: string;
  unread_count?: number;
}

export interface DMParticipant {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
}

export interface DMMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

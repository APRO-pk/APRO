export interface Crew {
  id: string;
  name: string;
  description: string;
  level: number;
  prime_id: string;
  flag: string;
  created_at: string;
  updated_at: string;
  status: 'proposed' | 'active' | 'rejected';
  member_count?: number;
}

export interface CrewMember {
  crew_id: string;
  user_id: string;
  role: 'prime' | 'manager' | 'member';
  joined_at: string;
  display_name?: string;
  avatar_url?: string;
}

export interface CrewJoinRequest {
  id: string;
  crew_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  display_name?: string;
  crew_name?: string;
}

export interface CrewInvite {
  id: string;
  crew_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  inviter_name?: string;
  crew_name?: string;
}

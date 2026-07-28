export interface Project {
  id: string;
  name: string;
  description: string;
  visibility: 'public' | 'missions' | 'private';
  owner_type: 'user' | 'crew';
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: 'admin' | 'member';
  display_name?: string;
  avatar_url?: string;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  description: string;
  start_date: string | null;
  deadline: string | null;
  order_index: number;
  completed: boolean;
  created_at: string;
}

export interface ProjectMilestone {
  id: string;
  phase_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface MilestoneChecklistItem {
  id: string;
  milestone_id: string;
  text: string;
  assigned_to: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ProjectPost {
  id: string;
  project_id: string;
  author_id: string;
  phase_id: string;
  milestone_id: string;
  checklist_item_id: string | null;
  content: string;
  images: string[];
  visibility: 'private' | 'missions' | 'public';
  created_at: string;
  updated_at: string;
  // joined
  author_name?: string;
  author_flag?: string;
  phase_name?: string;
  milestone_name?: string;
  checklist_text?: string;
  ignite_count?: number;
  abort_count?: number;
  user_vote?: number | null;
  comment_count?: number;
}

export interface ProjectPostVote {
  project_post_id: string;
  user_id: string;
  vote_type: number;
  created_at: string;
}

export interface ProjectPostComment {
  id: string;
  project_post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  // joined
  author_name?: string;
  author_avatar?: string;
  author_flag?: string;
  replies?: ProjectPostComment[];
}

export interface CrewFollow {
  user_id: string;
  crew_id: string;
  created_at: string;
}

export interface ProjectFollow {
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface TrackedProject extends Project {
  progress_pct: number;
  new_posts: number;
}

export interface ProjectInvite {
  id: string;
  project_id: string;
  user_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  updated_at: string;
  project_name?: string;
  inviter_name?: string;
  user_name?: string;
}

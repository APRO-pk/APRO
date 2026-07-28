export interface CommunityPost {
  id: string;
  author_id: string;
  content: string;
  images: string[];
  altitude: number;
  relaunch_of: string | null;
  created_at: string;
  updated_at: string;
  crew_id?: string;
  project_post_id?: string;
  // joined
  author_name?: string;
  author_flag?: string;
  relaunch_post?: CommunityPost;
  ignite_count?: number;
  abort_count?: number;
  user_vote?: number | null;
  comment_count?: number;
}

export interface CommunityVote {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  vote: 1 | -1;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  // joined
  author_name?: string;
  author_flag?: string;
  replies?: CommunityComment[];
  ignite_count?: number;
  abort_count?: number;
  user_vote?: number | null;
}

export interface CommunityFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
  // joined
  following_name?: string;
  follower_name?: string;
}

export interface CommunityNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'ignite' | 'abort' | 'telemetry' | 'reply' | 'relaunch' | 'track';
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  // joined
  actor_name?: string;
}

export type SignalType = CommunityNotification['type'];

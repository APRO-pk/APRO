import { supabase } from './supabase';
import { hydrateProfiles, getDisplayName } from './community-api';

export interface SearchResults {
  members: { id: string; display_name: string; avatar_url: string }[];
  crews: { id: string; name: string; description: string }[];
  missions: { id: string; name: string; description: string }[];
  posts: { id: string; content: string; author_id: string; author_name?: string }[];
}

let lastQueryTime = 0;

// Rate limit: max 10 calls per second → 100ms between calls
async function rateLimit() {
  const now = Date.now();
  const wait = Math.max(0, 100 - (now - lastQueryTime));
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastQueryTime = Date.now();
}

export async function searchAll(query: string): Promise<SearchResults> {
  const empty: SearchResults = { members: [], crews: [], missions: [], posts: [] };
  if (!query.trim()) return empty;

  await rateLimit();

  const term = `%${query.trim()}%`;

  const [members, crews, missions, posts] = await Promise.all([
    supabase.from('community_profiles').select('id, display_name, avatar_url').ilike('display_name', term).limit(5),
    supabase.from('crews').select('id, name, description').ilike('name', term).limit(5),
    supabase.from('projects').select('id, name, description').ilike('name', term).limit(5),
    supabase.from('community_posts').select('id, content, author_id').ilike('content', term).limit(5),
  ]);

  const result: SearchResults = {
    members: (members.data ?? []) as SearchResults['members'],
    crews: (crews.data ?? []) as SearchResults['crews'],
    missions: (missions.data ?? []) as SearchResults['missions'],
    posts: (posts.data ?? []) as SearchResults['posts'],
  };

  if (result.posts.length > 0) {
    const authorIds = [...new Set(result.posts.map(p => p.author_id))];
    await hydrateProfiles(authorIds);
    for (const p of result.posts) {
      p.author_name = await getDisplayName(p.author_id);
    }
  }

  return result;
}

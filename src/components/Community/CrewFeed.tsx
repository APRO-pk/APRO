import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, ImagePlus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchCrewFeed, createCrewPost, setPostVote } from '../../lib/community-api';
import { LaunchCard } from './LaunchCard';
import type { CommunityPost } from '../../lib/community-types';

interface Props {
  crewId: string;
  userId?: string;
  isMember: boolean;
}

export function CrewFeed({ crewId, userId, isMember }: Props) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await fetchCrewFeed(crewId, userId);
        setPosts(p);
        const votes: Record<string, number | null> = {};
        for (const post of p) {
          if (post.user_vote !== undefined) votes[post.id] = post.user_vote;
        }
        setUserVotes(votes);
      } catch (err) {
        console.error('Failed to load crew feed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [crewId, userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `crew_feed/${crewId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('community_images')
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('community_images')
        .getPublicUrl(path);
      setImages(prev => [...prev, publicUrl]);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!userId || !content.trim()) return;
    setSubmitting(true);
    try {
      const post = await createCrewPost(crewId, userId, content.trim(), images);
      setPosts(prev => [post, ...prev]);
      setContent('');
      setImages([]);
    } catch (err) {
      console.error('Failed to create post', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (postId: string, vote: 1 | -1) => {
    if (!userId) return;
    const result = await setPostVote(postId, userId, vote);
    setUserVotes(prev => ({ ...prev, [postId]: result.userVote }));
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, ignite_count: result.ignite, abort_count: result.abort, user_vote: result.userVote } : p
    ));
  };

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div>
      {isMember && (
        <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 mb-4">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value.slice(0, 1000))}
            placeholder="Share something with your crew..."
            rows={3}
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 resize-none outline-none"
          />
          {images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || images.length >= 12}
                className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all disabled:opacity-30"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <span className="text-[10px] text-slate-600">{content.length}/1000</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-xs font-bold text-white transition-all"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-500">No posts yet{isMember ? ' — be the first!' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <LaunchCard
              key={post.id}
              post={post}
              userVote={userVotes[post.id] ?? post.user_vote ?? null}
              onVote={handleVote}
              userId={userId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

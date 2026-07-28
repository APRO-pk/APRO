import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchLaunchpad, setPostVote, saveFeedPosition, loadFeedPosition, resetSeenSet } from '../../lib/community-api';
import { LaunchCard } from '../../components/Community/LaunchCard';
import { CommunityNavbar } from '../../components/Community/CommunityNavbar';
import type { CommunityPost } from '../../lib/community-types';

const Launchpad: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number | null>>({});
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [wrapping, setWrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedReady, setFeedReady] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const loadFeed = async (uid?: string) => {
    const { posts } = await fetchLaunchpad(uid);
    setPosts(posts);
    for (const p of posts) seenIdsRef.current.add(p.id);
    const voteMap: Record<string, number | null> = {};
    for (const p of posts) {
      if (p.user_vote !== undefined) voteMap[p.id] = p.user_vote;
    }
    setUserVotes(voteMap);
    return posts;
  };

  // Init
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const session = await supabase.auth.getSession();
        const uid = session.data.session?.user?.id;
        if (cancelled) return;
        setUserId(uid);
        await loadFeed(uid);
        if (!cancelled) {
          setFeedReady(true);
          setLoading(false);
        }
      } catch (err) {
        console.error('Launchpad init error:', err);
        if (!cancelled) {
          setError('Failed to load launches. Check the console for details.');
          setLoading(false);
        }
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Restore scroll position after feed renders
  useEffect(() => {
    if (!feedReady || !userId || !scrollRef.current) return;
    loadFeedPosition(userId).then(savedId => {
      if (!savedId || !scrollRef.current) return;
      for (const el of Array.from(scrollRef.current.children)) {
        if ((el as HTMLElement).dataset.postId === savedId) {
          (el as HTMLElement).scrollIntoView({ behavior: 'auto' });
          break;
        }
      }
    });
  }, [feedReady, userId]);

  // Save position every 30s
  useEffect(() => {
    if (!userId) return;
    saveTimerRef.current = setInterval(() => {
      if (!scrollRef.current || !userId) return;
      const container = scrollRef.current;
      const mid = container.scrollTop + container.clientHeight / 2;
      for (const el of Array.from(container.children)) {
        const hEl = el as HTMLElement;
        const postId = hEl.dataset.postId;
        if (!postId) continue;
        const top = hEl.offsetTop;
        const bottom = top + hEl.offsetHeight;
        if (mid >= top && mid < bottom) {
          saveFeedPosition(userId, postId);
          break;
        }
      }
    }, 30_000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [userId, posts]);

  // Observer sentinel for wrap-around
  useEffect(() => {
    if (!sentinelRef.current || loading) return;
    const sentinel = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || wrapping) return;
        handleWrap();
      },
      { rootMargin: '0px 0px 100px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [posts, loading, wrapping, userId]);

  const handleWrap = useCallback(async () => {
    if (wrapping || !userId) return;
    setWrapping(true);

    // Save position of last real post before wrapping
    if (scrollRef.current) {
      const children = Array.from(scrollRef.current.children);
      const lastPost = children[children.length - 2] as HTMLElement; // second-to-last (before sentinel)
      if (lastPost?.dataset.postId) {
        saveFeedPosition(userId, lastPost.dataset.postId);
      }
    }

    resetSeenSet();
    const { posts: newPosts } = await fetchLaunchpad(userId);
    const fresh = newPosts.filter(p => !seenIdsRef.current.has(p.id));
    if (fresh.length === 0) {
      // Pool fully exhausted — reset and include all
      seenIdsRef.current.clear();
      const { posts: fallback } = await fetchLaunchpad(userId);
      for (const p of fallback) seenIdsRef.current.add(p.id);
      setPosts(prev => [...prev, ...fallback]);
      const extraVoteMap: Record<string, number | null> = {};
      for (const p of fallback) {
        if (p.user_vote !== undefined) extraVoteMap[p.id] = p.user_vote;
      }
      setUserVotes(prev => ({ ...prev, ...extraVoteMap }));
    } else {
      for (const p of fresh) seenIdsRef.current.add(p.id);
      setPosts(prev => [...prev, ...fresh]);
      const extraVoteMap: Record<string, number | null> = {};
      for (const p of fresh) {
        if (p.user_vote !== undefined) extraVoteMap[p.id] = p.user_vote;
      }
      setUserVotes(prev => ({ ...prev, ...extraVoteMap }));
    }

    setWrapping(false);
  }, [wrapping, userId]);

  const handleVote = async (postId: string, vote: 1 | -1) => {
    if (!userId) return;
    const result = await setPostVote(postId, userId, vote);
    setUserVotes((prev) => ({ ...prev, [postId]: result.userVote }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, ignite_count: result.ignite, abort_count: result.abort, user_vote: result.userVote }
          : p
      )
    );
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="min-h-screen bg-[#05070d]">
      <CommunityNavbar />

      {loading ? (
        <div className="h-[calc(100dvh-100px)] lg:h-[calc(100vh-140px)] flex items-center justify-center pb-[68px] lg:pb-0">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="h-[calc(100dvh-100px)] lg:h-[calc(100vh-140px)] flex items-center justify-center pb-[68px] lg:pb-0">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="h-[calc(100dvh-100px)] lg:h-[calc(100vh-140px)] flex flex-col items-center justify-center px-4 pb-[68px] lg:pb-0">
          <Rocket size={40} className="text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">No launches yet. Be the first!</p>
          {userId && (
            <button
              onClick={() => navigate('/community/new')}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-600/20 text-cyan-300 text-sm font-semibold hover:bg-cyan-600/30 transition-colors"
            >
              Launch something
            </button>
          )}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="h-[calc(100dvh-100px)] lg:h-[calc(100vh-140px)] overflow-y-auto snap-y snap-mandatory scroll-smooth pb-[68px] lg:pb-0 pt-4"
        >
          {posts.map((post) => (
            <div
              key={post.id}
              data-post-id={post.id}
              className="h-full snap-start flex flex-col justify-center items-center px-4 py-1 overflow-hidden relative"
            >
              <div className="w-full max-w-2xl min-h-0 max-h-full overflow-y-auto overscroll-contain scroll-smooth [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10">
                <LaunchCard
                  post={post}
                  userVote={userVotes[post.id] ?? null}
                  onVote={handleVote}
                  userId={userId}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          ))}
          <div ref={sentinelRef} className="h-20 flex items-center justify-center">
            {wrapping ? (
              <Loader2 size={20} className="text-cyan-400 animate-spin" />
            ) : (
              <span className="text-xs text-slate-600">Scroll for more launches</span>
            )}
          </div>
        </div>
      )}

      {userId && (
        <button
          onClick={() => navigate('/community/new')}
          className="fixed bottom-[76px] lg:bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-600/30 flex items-center justify-center transition-all duration-200 hover:scale-105"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
};

export default Launchpad;

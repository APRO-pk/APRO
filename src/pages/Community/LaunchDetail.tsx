import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  fetchLaunchById,
  setPostVote,
  incrementAltitude,
} from '../../lib/community-api';
import { LaunchCard } from '../../components/Community/LaunchCard';
import { CommunityNavbar } from '../../components/Community/CommunityNavbar';
import type { CommunityPost } from '../../lib/community-types';

const LaunchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const init = async () => {
      const session = await supabase.auth.getSession();
      const uid = session.data.session?.user?.id;
      setUserId(uid);

      const postData = await fetchLaunchById(id, uid);
      setPost(postData);
      setUserVote(postData.user_vote ?? null);

      incrementAltitude(id);
      setLoading(false);
    };
    init();
  }, [id]);

  const handleVote = async (postId: string, vote: 1 | -1) => {
    if (!userId) return;
    const result = await setPostVote(postId, userId, vote);
    setUserVote(result.userVote);
    setPost((prev) => prev ? { ...prev, ignite_count: result.ignite, abort_count: result.abort, user_vote: result.userVote } : prev);
  };

  const handleDelete = () => {
    navigate('/community', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070d] flex items-center justify-center">
        <CommunityNavbar />
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#05070d] flex items-center justify-center">
        <CommunityNavbar />
        <p className="text-slate-500">Launch not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070d]">
      <CommunityNavbar />

      <div className="max-w-2xl mx-auto px-4 pb-20 lg:pb-8 pt-4">
        <button
          onClick={() => navigate('/community')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Launchpad
        </button>

        <LaunchCard
          post={post}
          userVote={userVote}
          onVote={handleVote}
          userId={userId}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};

export default LaunchDetail;

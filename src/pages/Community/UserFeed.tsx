import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Rocket, Lock, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  fetchUserPosts,
  isFollowing,
  toggleFollow,
  fetchFollowers,
  fetchFollowing,
  setPostVote,
  getDisplayName,
  hydrateProfiles,
  removeFollower,
  fetchProfile,
} from '../../lib/community-api';
import { LaunchCard } from '../../components/Community/LaunchCard';
import { FlagIcon } from '../../components/Community/FlagIcon';
import { TrackButton } from '../../components/Community/TrackButton';
import { CommunityNavbar } from '../../components/Community/CommunityNavbar';
import { TrackListModal } from '../../components/Community/TrackListModal';
import { EditProfileModal } from '../../components/Community/EditProfileModal';
import type { CommunityPost } from '../../lib/community-types';

interface TrackUser {
  id: string;
  created_at: string;
}

const UserFeed: React.FC = () => {
  const { id: profileId } = useParams<{ id: string }>();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, number | null>>({});
  const [userId, setUserId] = useState<string | undefined>();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileFlag, setProfileFlag] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileFollowsMe, setProfileFollowsMe] = useState(false);
  const [trackListType, setTrackListType] = useState<'trackers' | 'tracking' | null>(null);
  const [followers, setFollowers] = useState<TrackUser[]>([]);
  const [followingList, setFollowingList] = useState<TrackUser[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalKey, setEditModalKey] = useState(0);

  useEffect(() => {
    if (!profileId) return;
    const init = async () => {
      const session = await supabase.auth.getSession();
      const uid = session.data.session?.user?.id;
      setUserId(uid);

      const [userPosts, fData, fwData, profile] = await Promise.all([
        fetchUserPosts(profileId, uid),
        fetchFollowers(profileId),
        fetchFollowing(profileId),
        fetchProfile(profileId),
      ]);

      setPosts(userPosts);
      setFollowers((fData as any[]).filter((f: any) => f.follower_id).map((f: any) => ({ id: f.follower_id, created_at: f.created_at })));
      setFollowingList((fwData as any[]).filter((f: any) => f.following_id).map((f: any) => ({ id: f.following_id, created_at: f.created_at })));
      setFollowerCount(fData.length);
      setFollowingCount(fwData.length);
      setProfileName(profile?.display_name || uid === profileId ? (await getDisplayName(profileId)) : profileId.slice(0, 8));
      setProfileBio(profile?.bio || '');
      setProfileAvatar(profile?.avatar_url || '');
      setProfileFlag(profile?.flag || '');

      if (uid) {
        setFollowing(await isFollowing(uid, profileId));
        if (uid !== profileId) {
          setProfileFollowsMe(await isFollowing(profileId, uid));
        }
        const voteMap: Record<string, number | null> = {};
        for (const p of userPosts) {
          if (p.user_vote !== undefined) voteMap[p.id] = p.user_vote;
        }
        setUserVotes(voteMap);
      }

      setLoading(false);
    };
    init();
  }, [profileId]);

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

  const handleToggleFollow = async () => {
    if (!userId || !profileId) return;
    const nowFollowing = await toggleFollow(userId, profileId);
    setFollowing(nowFollowing);
    setFollowerCount((prev) => prev + (nowFollowing ? 1 : -1));
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!profileId) return;
    await removeFollower(profileId, followerId);
    setFollowers((prev) => prev.filter((f) => f.id !== followerId));
    setFollowerCount((prev) => Math.max(0, prev - 1));
  };

  const handleUntrack = async (targetId: string) => {
    if (!userId) return;
    await toggleFollow(userId, targetId);
    setFollowingList((prev) => prev.filter((f) => f.id !== targetId));
    setFollowingCount((prev) => Math.max(0, prev - 1));
    if (targetId === profileId) setFollowing(false);
  };

  const handleProfileSaved = (name: string, bio: string, avatarUrl: string, flag: string) => {
    setProfileName(name);
    setProfileBio(bio);
    setProfileAvatar(avatarUrl);
    setProfileFlag(flag);
  };

  if (!profileId) return null;

  const isOwnProfile = userId === profileId;

  return (
    <div className="min-h-screen bg-[#05070d]">
      <CommunityNavbar />

      <div className="max-w-xl mx-auto px-4 pb-20 lg:pb-8">
        {/* Profile header */}
        <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-6 mt-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shrink-0 overflow-hidden">
              {profileAvatar ? (
                <img src={profileAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                (profileName[0] || '?').toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white truncate flex items-center gap-1.5">{profileFlag && <FlagIcon code={profileFlag} />}{profileName}</h2>
                {isOwnProfile && (
                  <button
                    onClick={() => { setEditModalKey(k => k + 1); setShowEditModal(true); }}
                    className="p-1 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-white/5 transition-all shrink-0"
                    title="Edit profile"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              {profileBio && (
                <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{profileBio}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <button
                  onClick={() => { if (isOwnProfile || profileFollowsMe) setTrackListType('trackers'); }}
                  className={`flex items-center gap-1 transition-colors ${(isOwnProfile || profileFollowsMe) ? 'hover:text-slate-200 cursor-pointer' : 'cursor-default'}`}
                  title={!isOwnProfile && !profileFollowsMe ? 'Only visible to mutual connections' : ''}
                >
                  {!isOwnProfile && !profileFollowsMe ? <Lock size={10} className="text-slate-600" /> : <Users size={12} />}
                  {followerCount} {followerCount === 1 ? 'tracker' : 'trackers'}
                </button>
                <button
                  onClick={() => { if (isOwnProfile || profileFollowsMe) setTrackListType('tracking'); }}
                  className={`flex items-center gap-1 transition-colors ${(isOwnProfile || profileFollowsMe) ? 'hover:text-slate-200 cursor-pointer' : 'cursor-default'}`}
                  title={!isOwnProfile && !profileFollowsMe ? 'Only visible to mutual connections' : ''}
                >
                  {!isOwnProfile && !profileFollowsMe ? <Lock size={10} className="text-slate-600" /> : <Rocket size={12} />}
                  {followingCount} tracking
                </button>
              </div>
            </div>
            {userId && userId !== profileId && (
              <TrackButton isFollowing={following} onToggle={handleToggleFollow} />
            )}
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Rocket size={36} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-500 text-sm">No launches yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <LaunchCard
                key={post.id}
                post={post}
                userVote={userVotes[post.id] ?? null}
                onVote={handleVote}
                userId={userId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <TrackListModal
        open={trackListType === 'trackers'}
        onClose={() => setTrackListType(null)}
        title="Trackers"
        users={followers}
        currentUserId={isOwnProfile ? userId : undefined}
        onRemove={isOwnProfile ? handleRemoveFollower : undefined}
        removeLabel="Remove"
      />
      <TrackListModal
        open={trackListType === 'tracking'}
        onClose={() => setTrackListType(null)}
        title="Tracking"
        users={followingList}
        currentUserId={isOwnProfile ? userId : undefined}
        onRemove={isOwnProfile ? handleUntrack : undefined}
        removeLabel="Untrack"
      />

      {isOwnProfile && userId && (
        <EditProfileModal
          key={editModalKey}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          userId={userId}
          initialDisplayName={profileName}
          initialBio={profileBio}
          initialAvatarUrl={profileAvatar}
          initialFlag={profileFlag}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
};

export default UserFeed;

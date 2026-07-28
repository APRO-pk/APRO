import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Eye, Repeat2, Rocket, PenLine, ExternalLink, Send, X, MoreVertical, Trash2, ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CommunityPost, CommunityComment } from '../../lib/community-types';
import { getDisplayName, getProfileAvatar, getProfileFlag, hydrateProfiles, createLaunch, fetchComments, createComment, deleteComment, setCommentVote, deleteLaunch, isFollowing, toggleFollow } from '../../lib/community-api';
import { FlagIcon } from './FlagIcon';
import { IgniteButton } from './IgniteButton';
import { AbortButton } from './AbortButton';
import { ImageGrid } from './ImageGrid';
import { TelemetryThread } from './TelemetryThread';
import { TrackButton } from './TrackButton';
import { SignupPrompt } from './SignupPrompt';

interface Props {
  post: CommunityPost;
  userVote: number | null;
  onVote: (postId: string, vote: 1 | -1) => void;
  userId?: string;
  onDelete?: (postId: string) => void;
}

export function LaunchCard({ post, userVote, onVote, userId, onDelete }: Props) {
  const [authorName, setAuthorName] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('');
  const [authorFlag, setAuthorFlag] = useState('');
  const isRelaunch = !!post.relaunch_of && !!post.relaunch_post;
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [relaunchText, setRelaunchText] = useState('');
  const [relaunching, setRelaunching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<(CommunityComment & { replies: CommunityComment[] })[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const isAuthor = userId && userId === post.author_id;
  const [isTracking, setIsTracking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId || isAuthor) return;
    isFollowing(userId, post.author_id).then(setIsTracking);
  }, [userId, post.author_id]);

  useEffect(() => {
    hydrateProfiles([post.author_id]).then(async () => {
      setAuthorName(await getDisplayName(post.author_id));
      setAuthorAvatar(await getProfileAvatar(post.author_id));
      setAuthorFlag(getProfileFlag(post.author_id));
    });
  }, [post.author_id]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (dotsRef.current && !dotsRef.current.contains(e.target as Node)) {
        setDotsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!showComments) return;
    const handleWheel = (e: WheelEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowComments(false);
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [showComments]);

  const [dotsOpen, setDotsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [authAction, setAuthAction] = useState<string | null>(null);

  const doRelaunch = async (text?: string) => {
    if (!userId) return;
    setRelaunching(true);
    try {
      await createLaunch(userId, text ?? '', [], post.id);
      setMenuOpen(false);
      setShowTextPanel(false);
      setRelaunchText('');
    } catch (err) {
      console.error('Relaunch failed', err);
    } finally {
      setRelaunching(false);
    }
  };

  const openComments = async () => {
    setShowComments(true);
    const isMobile = window.innerWidth < 1024;
    if (cardRef.current && !isMobile) {
      const rect = cardRef.current.getBoundingClientRect();
      const gap = 16;
      let left = rect.right + gap;
      const panelWidth = 400;
      if (left + panelWidth > window.innerWidth - 16) {
        left = rect.left - gap - panelWidth;
      }
      setPanelStyle({
        top: rect.top,
        left: left,
        height: Math.min(rect.height, window.innerHeight - rect.top - 16),
      });
    }
    if (!commentsFetched) {
      setLoadingComments(true);
      try {
        const data = await fetchComments(post.id, userId);
        setComments(data);
        setCommentsFetched(true);
      } catch (err) {
        console.error('Failed to load comments', err);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const handleTrackToggle = async () => {
    if (!userId) return;
    const nowFollowing = await toggleFollow(userId, post.author_id);
    setIsTracking(nowFollowing);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteLaunch(post.id);
      onDelete?.(post.id);
    } catch (err) {
      console.error('Failed to delete launch', err);
    }
    setDotsOpen(false);
    setConfirmDelete(false);
  };

  const handleNewComment = async () => {
    if (!newComment.trim() || !userId) return;
    await createComment(userId, post.id, newComment.trim());
    setNewComment('');
    const fresh = await fetchComments(post.id, userId);
    setComments(fresh);
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!userId) return;
    await createComment(userId, post.id, content, parentId);
    const fresh = await fetchComments(post.id, userId);
    setComments(fresh);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
    const fresh = await fetchComments(post.id, userId);
    setComments(fresh);
  };

  const handleCommentVote = async (commentId: string, vote: 1 | -1) => {
    if (!userId) return;
    const result = await setCommentVote(commentId, userId, vote);
    const updateTree = (list: (CommunityComment & { replies: CommunityComment[] })[]): (CommunityComment & { replies: CommunityComment[] })[] =>
      list.map(c => {
        if (c.id === commentId) {
          return { ...c, ignite_count: result.ignite, abort_count: result.abort, user_vote: result.userVote };
        }
        if (c.replies.length > 0) {
          return { ...c, replies: updateTree(c.replies) };
        }
        return c;
      });
    setComments(prev => updateTree(prev));
  };

  const isProjectPost = !!post.project_post_id;

  const handleViewMission = () => {
    navigate('/community/missions', { state: { openProjectPostId: post.project_post_id } });
  };

  const commentCount = post.comment_count ?? 0;
  const isLongContent = post.content ? (post.content.length > 250 || post.content.split('\n').length > 5) : false;

  return (
    <>
      <div ref={cardRef} className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 transition-all duration-200 hover:border-white/20">
        {isRelaunch && (
          <div className="flex items-center gap-2 text-xs text-cyan-400/70 mb-3">
            <Repeat2 size={12} />
            <span>Relaunched</span>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Link
                  to={"/community/user/" + post.author_id}
                  className="flex items-center gap-2 group min-w-0 shrink-0"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                    {authorAvatar ? (
                      <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (authorName[0] || '?').toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate flex items-center gap-1">
                    {authorFlag && <FlagIcon code={authorFlag} />}
                    {authorName || post.author_id.slice(0, 8)}
                  </span>
                </Link>
                {userId && !isAuthor && (
                  <TrackButton isFollowing={isTracking} onToggle={handleTrackToggle} />
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-slate-500">
                  {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                {isAuthor && (
                  <div className="relative" ref={dotsRef}>
                    <button
                      onClick={() => setDotsOpen((v) => !v)}
                      className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <MoreVertical size={14} />
                    </button>
                    {dotsOpen && (
                      <div
                        className="absolute right-0 top-full mt-1 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#0f1120] shadow-xl backdrop-blur-xl z-20"
                        style={{ animation: 'dropdownFadeIn 0.12s ease-out' }}
                      >
                        {confirmDelete ? (
                          <div className="p-3 space-y-2">
                            <p className="text-xs text-slate-400">Delete this launch?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setDotsOpen(false); setConfirmDelete(false); }}
                                className="flex-1 px-2 py-1.5 text-xs rounded-lg text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteConfirm}
                                className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(true)}
                            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {isRelaunch && post.relaunch_post && (
              <>
                {post.content && (
                  <div>
                    <p className={`text-sm text-slate-200 whitespace-pre-wrap ${showFullText ? '' : 'line-clamp-5'}`}>
                      {post.content}
                    </p>
                    {!showFullText && isLongContent && (
                      <button onClick={() => setShowFullText(true)} className="text-xs text-cyan-400/60 hover:text-cyan-300 mt-1 transition-colors">
                        Read more
                      </button>
                    )}
                  </div>
                )}
                <div className="ml-4 pl-3 border-l-2 border-cyan-500/30 space-y-1.5">
                  <Link
                    to={"/community/user/" + post.relaunch_post.author_id}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <ProfileName id={post.relaunch_post.author_id} />
                  </Link>
                  <p className="text-sm text-slate-400 whitespace-pre-wrap">{post.relaunch_post.content}</p>
                  <ImageGrid images={post.relaunch_post.images ?? []} />
                  <Link
                    to={"/community/post/" + post.relaunch_of}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400/60 hover:text-cyan-300 transition-colors"
                  >
                    <ExternalLink size={11} />
                    View original launch
                  </Link>
                </div>
              </>
            )}
            {!isRelaunch && (
              <>
                {post.content && (
                  <div>
                    <p className={`text-sm text-slate-300 whitespace-pre-wrap ${showFullText ? '' : 'line-clamp-5'}`}>
                      {post.content}
                    </p>
                    {!showFullText && isLongContent && (
                      <button onClick={() => setShowFullText(true)} className="text-xs text-cyan-400/60 hover:text-cyan-300 mt-1 transition-colors">
                        Read more
                      </button>
                    )}
                  </div>
                )}
                <ImageGrid images={post.images ?? []} />
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 shrink-0 pt-1">
            {isProjectPost ? (
              <button
                onClick={handleViewMission}
                className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200"
                title="View in Mission"
              >
                <ArrowRight size={18} className="transition-transform duration-200 hover:translate-x-0.5" />
                <span className="text-[9px] leading-none font-semibold">Mission</span>
              </button>
            ) : (
              <>
                <IgniteButton
                  count={post.ignite_count ?? 0}
                  userVote={userVote}
                  onVote={(v) => onVote(post.id, v)}
                  vertical
                  onAuthRequired={!userId ? () => setAuthAction('ignite') : undefined}
                />
                <AbortButton
                  count={post.abort_count ?? 0}
                  userVote={userVote === -1 ? -1 : null}
                  onVote={(v) => onVote(post.id, v)}
                  vertical
                  onAuthRequired={!userId ? () => setAuthAction('abort') : undefined}
                />
                <button
                  onClick={() => userId ? openComments() : setAuthAction('comment')}
                  className="group flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-all duration-200 text-slate-500 hover:text-sky-400 hover:bg-sky-500/5"
                >
                  <MessageCircle size={18} className="transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-[10px] leading-none font-semibold">{commentCount}</span>
                </button>
                <div className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 text-slate-500">
                  <Eye size={18} />
                  <span className="text-[10px] leading-none font-semibold">{post.altitude ?? 0}</span>
                </div>
                {!isRelaunch && (
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => userId ? setMenuOpen((v) => !v) : setAuthAction('relaunch')}
                      className="group flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all duration-200"
                    >
                      <Repeat2 size={18} className="transition-transform duration-200 group-hover:scale-110" />
                      <span className="text-[10px] leading-none">Relaunch</span>
                    </button>
                    {menuOpen && (
                      <div
                        className="absolute right-0 top-0 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#0f1120] shadow-xl backdrop-blur-xl z-20"
                        style={{ animation: 'dropdownFadeIn 0.12s ease-out' }}
                      >
                        <button
                          onClick={() => { setMenuOpen(false); doRelaunch(); }}
                          disabled={relaunching}
                          className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                        >
                          <Rocket size={14} className="text-cyan-400" />
                          Relaunch Now
                        </button>
                        <button
                          onClick={() => { setMenuOpen(false); setShowTextPanel(true); }}
                          className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-slate-200 hover:bg-white/[0.06] transition-colors"
                        >
                          <PenLine size={14} className="text-amber-400" />
                          Relaunch With Text
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {showTextPanel && (
          <div className="pl-8 space-y-2 mt-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <textarea
              value={relaunchText}
              onChange={(e) => setRelaunchText(e.target.value)}
              placeholder="Add your thoughts..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none transition-colors"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => doRelaunch(relaunchText.trim() || undefined)}
                disabled={relaunching}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-xs font-semibold text-white transition-colors"
              >
                {relaunching ? '...' : 'Relaunch'}
              </button>
              <button
                onClick={() => { setShowTextPanel(false); setRelaunchText(''); }}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {showComments && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowComments(false)} />
          <div
            ref={panelRef}
            className={`fixed z-50 border border-white/10 bg-[#0f1120]/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden ${
              window.innerWidth < 1024
                ? 'left-0 right-0 bottom-0 rounded-t-2xl max-h-[80vh]'
                : 'rounded-2xl'
            }`}
            style={
              window.innerWidth < 1024
                ? { animation: 'bottomSheetUp 0.25s ease-out' }
                : {
                    top: panelStyle.top + 'px',
                    left: panelStyle.left + 'px',
                    width: '400px',
                    height: panelStyle.height + 'px',
                  }
            }
          >
            <style>{`
              @keyframes commentsSlideIn { 0% { transform: translateX(-24px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
              @keyframes bottomSheetUp { 0% { transform: translateY(100%); } 100% { transform: translateY(0); } }
            `}</style>
            <div
              className="h-full flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Telemetry</h3>
                  <span className="text-xs text-slate-500">({commentCount})</span>
                </div>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {loadingComments ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth overscroll-contain">
                    <TelemetryThread
                      comments={comments}
                      userId={userId}
                      onReply={handleReply}
                      onDelete={handleDeleteComment}
                      onVote={handleCommentVote}
                      onAuthRequired={(action) => setAuthAction(action)}
                    />
                  </div>
                  {userId && (
                    <div className="flex gap-2 px-4 py-3 border-t border-white/10 shrink-0">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Send a telemetry signal..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleNewComment()}
                      />
                      <button
                        onClick={handleNewComment}
                        disabled={!newComment.trim()}
                        className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      <SignupPrompt action={authAction} onClose={() => setAuthAction(null)} />
    </>
  );
}

function ProfileName({ id }: { id: string }) {
  const [name, setName] = useState(id.slice(0, 8));
  const [flag, setFlag] = useState('');
  useEffect(() => {
    hydrateProfiles([id]).then(() => {
      getDisplayName(id).then(setName);
      setFlag(getProfileFlag(id));
    });
  }, [id]);
  return <span className="inline-flex items-center gap-1">{flag && <FlagIcon code={flag} />}{name}</span>;
}

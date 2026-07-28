import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Flame, Zap, MessageCircle, Repeat2, Trash2, Send, X, Loader2, Globe, Lock, Eye, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getDisplayName, getProfileFlag, hydrateProfiles } from '../../lib/community-api';
import { voteProjectPost, fetchProjectPostComments, createProjectPostComment, deleteProjectPostComment, deleteProjectPost, relaunchProjectPost } from '../../lib/missions-api';
import { FlagIcon } from './FlagIcon';
import { ImageGrid } from './ImageGrid';
import type { ProjectPost, ProjectPostComment, ProjectMember } from '../../lib/missions-types';

interface Props {
  post: ProjectPost;
  userId?: string;
  members?: ProjectMember[];
  onBack: () => void;
  onDeleted?: (postId: string) => void;
}

export function PostDetail({ post, userId, members: _members, onBack, onDeleted }: Props) {
  const [comments, setComments] = useState<ProjectPostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [igniteCount, setIgniteCount] = useState(post.ignite_count || 0);
  const [abortCount, setAbortCount] = useState(post.abort_count || 0);
  const [userVote, setUserVote] = useState<number | null>(post.user_vote || null);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [relaunching, setRelaunching] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadComments(); }, [post.id]);

  useEffect(() => {
    if (post.milestone_id) {
      // Fetch members from milestone_participants
      supabase.from('milestone_participants')
        .select('user_id')
        .eq('milestone_id', post.milestone_id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const ids = data.map((r: any) => r.user_id);
            hydrateProfiles(ids).then(() => {
              Promise.all(ids.map(getDisplayName)).then(names => {
                setMembers(ids.map((uid, i) => ({ user_id: uid, display_name: names[i], role: 'member' as const, project_id: '' })));
              });
            });
          }
        });
    }
  }, [post.milestone_id]);

  const loadComments = async () => {
    try {
      const c = await fetchProjectPostComments(post.id);
      setComments(c);
    } catch {} finally {
      setLoadingComments(false);
    }
  };

  const handleVote = async (type: number) => {
    if (!userId) return;
    const prevVote = userVote;
    const prevIgnite = igniteCount;
    const prevAbort = abortCount;
    if (userVote === type) {
      setUserVote(null);
      if (type === 1) setIgniteCount(c => Math.max(0, c - 1));
      else setAbortCount(c => Math.max(0, c - 1));
    } else {
      if (userVote === 1) setIgniteCount(c => Math.max(0, c - 1));
      else if (userVote === -1) setAbortCount(c => Math.max(0, c - 1));
      setUserVote(type);
      if (type === 1) setIgniteCount(c => c + 1);
      else setAbortCount(c => c + 1);
    }
    try {
      await voteProjectPost(post.id, userId, type);
    } catch {
      setUserVote(prevVote);
      setIgniteCount(prevIgnite);
      setAbortCount(prevAbort);
    }
  };

  const handleComment = async () => {
    if (!userId || !newComment.trim()) return;
    setSubmitting(true);
    try {
      const c = await createProjectPostComment(post.id, userId, newComment.trim(), replyTo || undefined);
      setComments(prev => {
        if (replyTo) {
          return prev.map(root =>
            root.id === replyTo
              ? { ...root, replies: [...(root.replies || []), c] }
              : root
          );
        }
        return [...prev, c];
      });
      setNewComment('');
      setReplyTo(null);
      setCommentCount(c => c + 1);
    } catch (err) {
      console.error('Failed to comment', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async () => {
    if (!userId) return;
    try {
      await deleteProjectPost(post.id);
      onDeleted?.(post.id);
      onBack();
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  const handleRelaunch = async () => {
    if (!userId) return;
    setRelaunching(true);
    try {
      await relaunchProjectPost(post.id, userId, post.content, post.images || []);
    } catch (err) {
      console.error('Failed to relaunch', err);
    } finally {
      setRelaunching(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteProjectPostComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const flag = getProfileFlag(post.author_id);
  const isOwner = userId === post.author_id;

  const renderComment = (comment: ProjectPostComment, depth: number = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-6 pl-3 border-l border-white/5' : ''}`}>
      <div className="py-2 group">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
            {(comment.author_name || '?')[0].toUpperCase()}
          </div>
          <span className="text-[11px] font-semibold text-slate-300">{comment.author_name || 'Unknown'}</span>
          <span className="text-[9px] text-slate-600">{new Date(comment.created_at).toLocaleDateString()}</span>
          {userId === comment.author_id && (
            <button onClick={() => handleDeleteComment(comment.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
              <Trash2 size={10} />
            </button>
          )}
        </div>
        <p className="text-[12px] text-slate-400 pl-7">{comment.content}</p>
        {userId && depth < 3 && (
          <button
            onClick={() => { setReplyTo(comment.id); setNewComment(''); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="text-[10px] text-slate-600 hover:text-cyan-400 pl-7 mt-0.5 transition-colors"
          >
            Reply
          </button>
        )}
      </div>
      {comment.replies?.map(r => renderComment(r, depth + 1))}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
          <ArrowLeft size={18} />
        </button>
        <span className="text-xs font-semibold text-slate-400">Mission Post</span>
      </div>

      <div className="relative flex gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Post Card */}
          <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 mb-4">
            {/* Author */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(post.author_name || '?')[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white">{post.author_name || 'Unknown'}</span>
                  {flag && <FlagIcon code={flag} size={14} />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{post.phase_name}</span>
                  <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{post.milestone_name}</span>
                  {post.visibility === 'private' && <Lock size={10} className="text-red-400" />}
                  {post.visibility === 'missions' && <Eye size={10} className="text-cyan-400" />}
                  {post.visibility === 'public' && <Globe size={10} className="text-green-400" />}
                </div>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm text-slate-200 whitespace-pre-wrap mb-3">{post.content}</p>

            {/* Images */}
            {post.images && post.images.length > 0 && (
              <div className="mb-3">
                <ImageGrid images={post.images} />
              </div>
            )}

            {/* Timestamp */}
            <div className="text-[10px] text-slate-600">{new Date(post.created_at).toLocaleString()}</div>
          </div>

          {/* Comments Section */}
          <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4">
            <h3 className="text-xs font-semibold text-slate-400 mb-3">
              {commentCount === 0 ? 'No replies yet' : `${commentCount} ${commentCount === 1 ? 'reply' : 'replies'}`}
            </h3>

            {loadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 size={14} className="animate-spin text-slate-500" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">Be the first to reply</p>
            ) : (
              <div className="divide-y divide-white/5">
                {comments.map(c => renderComment(c))}
              </div>
            )}

            {/* Comment Input */}
            {userId && (
              <div className="mt-3 pt-3 border-t border-white/5">
                {replyTo && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-cyan-400">Replying to a comment</span>
                    <button onClick={() => setReplyTo(null)} className="text-slate-600 hover:text-slate-400">
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value.slice(0, 500))}
                    placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
                    className="flex-1 bg-white/5 text-sm text-slate-200 placeholder-slate-500 rounded-xl px-3 py-2 outline-none border border-white/10 focus:border-cyan-500/30 transition-colors"
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!newComment.trim() || submitting}
                    className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 transition-all"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className="text-white" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Actions & Members */}
        <div className="hidden lg:flex flex-col items-center gap-3 shrink-0 w-14">
          {/* Ignite */}
          <button
            onClick={() => handleVote(1)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${userVote === 1 ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
          >
            <Flame size={18} />
            <span className="text-[10px] font-bold">{igniteCount}</span>
          </button>

          {/* Abort */}
          <button
            onClick={() => handleVote(-1)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${userVote === -1 ? 'text-red-400 bg-red-500/10' : 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'}`}
          >
            <Zap size={18} />
            <span className="text-[10px] font-bold">{abortCount}</span>
          </button>

          {/* Comments */}
          <div className="flex flex-col items-center gap-0.5 p-2 text-slate-600">
            <MessageCircle size={18} />
            <span className="text-[10px] font-bold">{commentCount}</span>
          </div>

          {/* Relaunch */}
          {post.visibility === 'public' && (
            <button
              onClick={handleRelaunch}
              disabled={relaunching}
              className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-slate-600 hover:text-green-400 hover:bg-green-500/10 transition-all"
            >
              {relaunching ? <Loader2 size={18} className="animate-spin" /> : <Repeat2 size={18} />}
              <span className="text-[10px] font-bold">Relaunch</span>
            </button>
          )}

          {/* Delete */}
          {isOwner && (
            <div className="relative">
              {confirmDelete ? (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1">
                  <button onClick={handleDeletePost} className="text-[10px] font-bold text-red-400 whitespace-nowrap">Confirm</button>
                  <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-slate-400 whitespace-nowrap">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 size={18} />
                  <span className="text-[10px] font-bold">Delete</span>
                </button>
              )}
            </div>
          )}

          {/* Members */}
          {members.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowMembers(!showMembers)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all ${showMembers ? 'text-violet-400 bg-violet-500/10' : 'text-slate-600 hover:text-violet-400 hover:bg-violet-500/10'}`}
              >
                <Users size={18} />
                <span className="text-[10px] font-bold">{members.length}</span>
              </button>
              {showMembers && (
                <div className="absolute right-full mr-2 top-0 bg-[#0f1120] border border-white/10 rounded-xl p-3 w-48 shadow-xl z-10">
                  <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Members</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {members.map(m => (
                      <div key={m.user_id} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                          {(m.display_name || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-[11px] text-slate-300 truncate">{m.display_name || m.user_id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f1120]/95 backdrop-blur-md border-t border-white/10 px-4 py-2 z-50">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button onClick={() => handleVote(1)} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${userVote === 1 ? 'text-cyan-400' : 'text-slate-500'}`}>
            <Flame size={16} />
            <span className="text-[9px] font-bold">{igniteCount}</span>
          </button>
          <button onClick={() => handleVote(-1)} className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg ${userVote === -1 ? 'text-red-400' : 'text-slate-500'}`}>
            <Zap size={16} />
            <span className="text-[9px] font-bold">{abortCount}</span>
          </button>
          <div className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-500">
            <MessageCircle size={16} />
            <span className="text-[9px] font-bold">{commentCount}</span>
          </div>
          {post.visibility === 'public' && (
            <button onClick={handleRelaunch} disabled={relaunching} className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-500">
              {relaunching ? <Loader2 size={16} className="animate-spin" /> : <Repeat2 size={16} />}
              <span className="text-[9px] font-bold">Relaunch</span>
            </button>
          )}
          {isOwner && (
            <button onClick={() => setConfirmDelete(true)} className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-500">
              <Trash2 size={16} />
              <span className="text-[9px] font-bold">Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CommunityComment } from '../../lib/community-types';
import { getDisplayName, getProfileAvatar, getProfileFlag, hydrateProfiles } from '../../lib/community-api';
import { FlagIcon } from './FlagIcon';
import { IgniteButton } from './IgniteButton';
import { AbortButton } from './AbortButton';

interface Props {
  comments: (CommunityComment & { replies: CommunityComment[] })[];
  userId?: string;
  onReply: (parentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onVote: (commentId: string, vote: 1 | -1) => void;
  onAuthRequired?: (action: string) => void;
}

function CommentItem({
  comment,
  userId,
  onReply,
  onDelete,
  onVote,
  onAuthRequired,
  depth = 0,
  collapsed,
  onToggleCollapse,
}: {
  comment: CommunityComment & { replies: CommunityComment[] };
  userId?: string;
  onReply: (parentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onVote: (commentId: string, vote: 1 | -1) => void;
  onAuthRequired?: (action: string) => void;
  depth?: number;
  collapsed: Set<string>;
  onToggleCollapse: (id: string) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('');
  const [authorFlag, setAuthorFlag] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    hydrateProfiles([comment.author_id]).then(async () => {
      setAuthorName(await getDisplayName(comment.author_id));
      setAuthorAvatar(await getProfileAvatar(comment.author_id));
      setAuthorFlag(getProfileFlag(comment.author_id));
    });
  }, [comment.author_id]);

  const handleSubmit = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText.trim());
    setReplyText('');
    setShowReply(false);
  };

  const hasReplies = comment.replies.length > 0;
  const isCollapsed = collapsed.has(comment.id);

  return (
    <div className={`${depth > 0 ? 'ml-6 pl-3 border-l border-white/10' : ''}`}>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          {hasReplies && depth === 0 && (
            <button
              onClick={() => onToggleCollapse(comment.id)}
              className="p-0.5 rounded text-slate-500 hover:text-white transition-colors"
            >
              {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-pink-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
            {authorAvatar ? (
              <img src={authorAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              authorName[0]?.toUpperCase() ?? '?'
            )}
          </div>
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-0.5">
            {authorFlag && <FlagIcon code={authorFlag} />}
            {authorName || comment.author_id.slice(0, 8)}
          </span>
          <span className="text-[10px] text-slate-500">
            {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <p className="text-sm text-slate-400 whitespace-pre-wrap pl-8">{comment.content}</p>
        <div className="flex items-center gap-3 pl-8 mt-1">
          <IgniteButton
            count={comment.ignite_count ?? 0}
            userVote={comment.user_vote === 1 ? 1 : null}
            onVote={(v) => onVote(comment.id, v)}
            onAuthRequired={!userId && onAuthRequired ? () => onAuthRequired('commentVote') : undefined}
          />
          <AbortButton
            count={comment.abort_count ?? 0}
            userVote={comment.user_vote === -1 ? -1 : null}
            onVote={(v) => onVote(comment.id, v)}
            onAuthRequired={!userId && onAuthRequired ? () => onAuthRequired('commentVote') : undefined}
          />
          {userId && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-[11px] text-slate-500 hover:text-sky-400 transition-colors"
            >
              Reply
            </button>
          )}
          {!userId && onAuthRequired && (
            <button
              onClick={() => onAuthRequired('reply')}
              className="text-[11px] text-slate-500 hover:text-sky-400 transition-colors"
            >
              Reply
            </button>
          )}
          {userId && userId === comment.author_id && (
            confirmingDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Delete?</span>
                <button
                  onClick={() => { onDelete(comment.id); setConfirmingDelete(false); }}
                  className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            )
          )}
          {hasReplies && depth > 0 && (
            <button
              onClick={() => onToggleCollapse(comment.id)}
              className="text-[11px] text-slate-500 hover:text-white transition-colors"
            >
              {isCollapsed ? `${comment.replies.length} replies` : 'Hide replies'}
            </button>
          )}
        </div>
        {showReply && (
          <div className="pl-8 mt-2 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a telemetry reply..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-semibold text-white transition-colors"
            >
              Send
            </button>
          </div>
        )}
      </div>
      {hasReplies && !isCollapsed && comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          userId={userId}
          onReply={onReply}
          onDelete={onDelete}
          onVote={onVote}
          onAuthRequired={onAuthRequired}
          depth={depth + 1}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      ))}
    </div>
  );
}

export function TelemetryThread({ comments, userId, onReply, onDelete, onVote, onAuthRequired }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (comments.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">
        No telemetry yet. Be the first to comment.
      </p>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          userId={userId}
          onReply={onReply}
          onDelete={onDelete}
          onVote={onVote}
          onAuthRequired={onAuthRequired}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      ))}
    </div>
  );
}

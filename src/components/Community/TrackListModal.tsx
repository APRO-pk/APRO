import { useNavigate } from 'react-router-dom';
import { X, UserMinus, ExternalLink, Users, Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDisplayName, getProfileFlag, hydrateProfiles } from '../../lib/community-api';
import { FlagIcon } from './FlagIcon';

interface TrackUser {
  id: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  users: TrackUser[];
  currentUserId?: string;
  onRemove?: (id: string) => void;
  removeLabel?: string;
}

export function TrackListModal({ open, onClose, title, users, currentUserId, onRemove, removeLabel }: Props) {
  const navigate = useNavigate();
  const [names, setNames] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || users.length === 0) return;
    const ids = users.map(u => u.id);
    hydrateProfiles(ids).then(async () => {
      const map: Record<string, string> = {};
      const flagMap: Record<string, string> = {};
      for (const id of ids) {
        map[id] = await getDisplayName(id);
        flagMap[id] = getProfileFlag(id);
      }
      setNames(map);
      setFlags(flagMap);
    });
  }, [open, users]);

  if (!open) return null;

  const isOwn = currentUserId !== undefined;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#0f1120]/95 backdrop-blur-xl shadow-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            {title === 'Trackers' ? <Users size={16} className="text-cyan-400" /> : <Rocket size={16} className="text-cyan-400" />}
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <span className="text-xs text-slate-500">({users.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 scroll-smooth overscroll-contain">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              {title === 'Trackers' ? <Users size={28} className="text-slate-600 mb-3" /> : <Rocket size={28} className="text-slate-600 mb-3" />}
              <p className="text-sm text-slate-500">No {title.toLowerCase()} yet.</p>
            </div>
          ) : (
            users.filter(u => u.id).map((user) => {
              const displayName = names[user.id] || user.id.slice(0, 8);
              const isMe = currentUserId === user.id;
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {displayName[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate flex items-center gap-1">
                      {flags[user.id] && <FlagIcon code={flags[user.id]} />}
                      {displayName}
                      {isMe && <span className="text-[10px] text-slate-500 ml-1.5">(you)</span>}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => navigate('/community/user/' + user.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                      title="Visit profile"
                    >
                      <ExternalLink size={14} />
                    </button>
                    {isOwn && !isMe && onRemove && (
                      <button
                        onClick={() => onRemove(user.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title={removeLabel || 'Remove'}
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

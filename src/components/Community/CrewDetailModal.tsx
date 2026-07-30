import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, Shield, Crown, UserMinus, UserPlus, Pencil, Check, X as XIcon } from 'lucide-react';
import { fetchCrewMembers, fetchUserRole, requestJoin, fetchPendingRequests, acceptJoinRequest, rejectJoinRequest, updateCrew } from '../../lib/crew-api';
import { FlagPicker } from './FlagPicker';
import { FlagIcon } from './FlagIcon';
import { useTokens } from '../../lib/token-utils';
import { InsufficientTokensModal, UpgradeRequiredModal } from './TokenModals';
import type { Crew, CrewMember, CrewJoinRequest } from '../../lib/crew-types';

interface Props {
  open: boolean;
  crew: Crew | null;
  userId?: string;
  hasApplied?: boolean;
  onClose: () => void;
  onJoined: () => void;
  onUpdated?: (crew: Crew) => void;
}

export function CrewDetailModal({ open, crew, userId, hasApplied, onClose, onJoined, onUpdated }: Props) {
  const navigate = useNavigate();
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<CrewJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { isFree, canAfford, deduct } = useTokens(userId ?? null);
  const [joining, setJoining] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFlag, setEditFlag] = useState('');

  useEffect(() => {
    if (!open || !crew) return;
    const load = async () => {
      setLoading(true);
      const [m, reqs] = await Promise.all([
        fetchCrewMembers(crew.id),
        userId ? fetchPendingRequests(crew.id).catch(() => []) : Promise.resolve([]),
      ]);
      setMembers(m);
      setPendingRequests(reqs);
      if (userId) {
        const role = await fetchUserRole(crew.id, userId);
        setUserRole(role);
      }
      setLoading(false);
    };
    load();
  }, [open, crew?.id, userId]);

  useEffect(() => {
    if (crew) {
      setEditName(crew.name);
      setEditDescription(crew.description);
      setEditFlag(crew.flag || '');
    }
  }, [crew]);

  if (!open || !crew) return null;

  const isManager = userRole === 'prime' || userRole === 'manager';
  const isMember = !!userRole;
  const maxMembers = Math.min(crew.level * 10, 200);
  const memberCount = members.length;

  const hasPendingRequest = hasApplied || pendingRequests.some(r => r.user_id === userId);

  const handleJoin = async () => {
    if (!userId) return;
    if (isFree && !canAfford(2)) { setInsufficientModalOpen(true); return; }
    setJoining(true);
    try {
      await requestJoin(crew.id, userId);
      if (isFree) await deduct(2);
      onJoined();
      onClose();
    } catch (err) {
      console.error('Failed to request join', err);
    } finally {
      setJoining(false);
    }
  };

  const handleAccept = async (req: CrewJoinRequest) => {
    try {
      await acceptJoinRequest(req.id, crew.id, req.user_id);
      const [m, reqs] = await Promise.all([
        fetchCrewMembers(crew.id),
        fetchPendingRequests(crew.id).catch(() => []),
      ]);
      setMembers(m);
      setPendingRequests(reqs);
    } catch (err) {
      console.error('Failed to accept request', err);
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      await rejectJoinRequest(reqId);
      setPendingRequests(prev => prev.filter(r => r.id !== reqId));
    } catch (err) {
      console.error('Failed to reject request', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await updateCrew(crew.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      flag: editFlag || undefined,
    });
    onUpdated?.({ ...crew, name: editName.trim(), description: editDescription.trim(), flag: editFlag || '' });
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(crew.name);
    setEditDescription(crew.description);
    setEditFlag(crew.flag || '');
    setEditing(false);
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'prime': return <Crown size={14} className="text-amber-400" />;
      case 'manager': return <Shield size={14} className="text-cyan-400" />;
      default: return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0f1120]/95 backdrop-blur-xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {crew.flag ? (
              <FlagIcon code={crew.flag} size={20} />
            ) : (
              <Users size={16} className="text-cyan-400 shrink-0" />
            )}
            <h3 className="text-sm font-bold text-white truncate">
              {crew.name}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 scroll-smooth overscroll-contain">
          {/* Crew info */}
          <div className="px-4 py-3 border-b border-white/10">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Crew Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={50}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value.slice(0, 500))}
                    maxLength={500}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Flag</label>
                  <FlagPicker value={editFlag} onChange={setEditFlag} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                  >
                    <Check size={12} /> Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-xs font-semibold hover:bg-white/10 transition-colors"
                  >
                    <XIcon size={12} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-slate-400">{crew.description || 'No description'}</p>
                  {isManager && (
                    <button
                      onClick={() => setEditing(true)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all shrink-0"
                      title="Edit crew"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>Level {crew.level}</span>
                  <span>{memberCount}/{maxMembers} members</span>
                </div>
              </>
            )}
          </div>

          {/* Pending requests (manager view) */}
          {!editing && isManager && pendingRequests.length > 0 && (
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-xs font-semibold text-slate-400 mb-2">Join Requests ({pendingRequests.length})</p>
              {pendingRequests.map(req => (
                <div key={req.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-sm text-slate-200 flex-1 truncate">{req.display_name || req.user_id.slice(0, 8)}</span>
                  <button
                    onClick={() => handleAccept(req)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 text-xs font-semibold hover:bg-red-600/30 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Members */}
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-slate-400 mb-2">Members ({memberCount})</p>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No members yet.</p>
            ) : (
              <div className="space-y-1">
                {members.map(m => (
                  <div key={m.user_id} className="flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-white/[0.03] transition-colors group">
                    <button
                      onClick={() => { navigate('/community/user/' + m.user_id); onClose(); }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (m.display_name?.[0] || '?').toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-200 truncate">{m.display_name || m.user_id.slice(0, 8)}</span>
                          {roleIcon(m.role)}
                        </div>
                        <p className="text-[10px] text-slate-500">{m.role}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {userId && !isMember && (
          <div className="px-4 py-3 border-t border-white/10 shrink-0">
            {hasPendingRequest ? (
              <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm font-semibold">
                Pending approval
              </div>
            ) : memberCount >= maxMembers ? (
              <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 text-sm font-semibold">
                Crew is full
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-sm font-bold text-white transition-all duration-200"
              >
                {joining ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                {joining ? 'Requesting...' : 'Request to Join'}
              </button>
            )}
          </div>
        )}
      </div>
      <InsufficientTokensModal open={insufficientModalOpen} onClose={() => setInsufficientModalOpen(false)} />
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, LogIn, Loader2, Shield, Crown, UserMinus, Check, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CommunityNavbar } from '../../components/Community/CommunityNavbar';
import { CrewDetailModal } from '../../components/Community/CrewDetailModal';
import { CrewFeed } from '../../components/Community/CrewFeed';
import { CreateCrewModal } from '../../components/Community/CreateCrewModal';
import { FlagPicker } from '../../components/Community/FlagPicker';
import { fetchActiveCrews, fetchUserCrew, fetchCrewMembers, fetchUserRole, leaveCrew, removeMember, changeRole, transferPrime, fetchMyRequests, updateCrew } from '../../lib/crew-api';
import { FlagIcon } from '../../components/Community/FlagIcon';
import { SignupPrompt } from '../../components/Community/SignupPrompt';
import type { Crew, CrewMember, CrewJoinRequest } from '../../lib/crew-types';

const CrewPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [myCrew, setMyCrew] = useState<Crew | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [authAction, setAuthAction] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'manager' | 'demote' | 'transfer'; userId: string } | null>(null);
  const [appliedCrewIds, setAppliedCrewIds] = useState<Set<string>>(new Set());
  const [showFlagPicker, setShowFlagPicker] = useState(false);
  const [crewTab, setCrewTab] = useState<'feed' | 'members'>('feed');
  const flagPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (flagPickerRef.current && !flagPickerRef.current.contains(e.target as Node)) {
        setShowFlagPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const init = async () => {
      const session = await supabase.auth.getSession();
      const uid = session.data.session?.user?.id;
      setUserId(uid);

      if (uid) {
        const crew = await fetchUserCrew(uid);
        setMyCrew(crew);
        if (crew) {
          const [m, role] = await Promise.all([
            fetchCrewMembers(crew.id),
            fetchUserRole(crew.id, uid),
          ]);
          setMembers(m);
          setMyRole(role);
        }
        // Fetch pending requests by this user
        const myReqs = await fetchMyRequests(uid);
        setAppliedCrewIds(new Set(myReqs.filter(r => r.status === 'pending').map(r => r.crew_id)));
      }

      const allCrews = await fetchActiveCrews(20);
      setCrews(allCrews);
      setLoading(false);
    };
    init();
  }, []);

  const refreshMyCrew = async () => {
    if (!userId) return;
    const crew = await fetchUserCrew(userId);
    setMyCrew(crew);
    if (crew) {
      const [m, role] = await Promise.all([
        fetchCrewMembers(crew.id),
        fetchUserRole(crew.id, userId),
      ]);
      setMembers(m);
      setMyRole(role);
    }
    // Refresh applied requests — merge so optimistic updates aren't lost to RLS filtering
    const myReqs = await fetchMyRequests(userId);
    setAppliedCrewIds(prev => {
      const next = new Set(prev);
      for (const r of myReqs) {
        if (r.status === 'pending') next.add(r.crew_id);
        else next.delete(r.crew_id);
      }
      return next;
    });
    // Refresh available crews
    const allCrews = await fetchActiveCrews(20);
    setCrews(allCrews);
  };

  const handleLeave = async (crewId: string, memberId: string) => {
    setLeaving(memberId);
    try {
      await leaveCrew(crewId, memberId);
      if (memberId === userId) {
        setMyCrew(null);
        setMyRole(null);
        setMembers([]);
      } else {
        setMembers(prev => prev.filter(m => m.user_id !== memberId));
      }
    } catch (err) {
      console.error('Failed to leave crew', err);
    } finally {
      setLeaving(null);
      setConfirmLeave(null);
    }
  };

  const handleMakeManager = async (crewId: string, memberId: string) => {
    await changeRole(crewId, memberId, 'manager');
    setMembers(prev => prev.map(m => m.user_id === memberId ? { ...m, role: 'manager' } : m));
    setConfirmAction(null);
  };

  const handleMakeMember = async (crewId: string, memberId: string) => {
    await changeRole(crewId, memberId, 'member');
    setMembers(prev => prev.map(m => m.user_id === memberId ? { ...m, role: 'member' } : m));
    setConfirmAction(null);
  };

  const handleTransferPrime = async (crewId: string, newPrimeId: string) => {
    if (!userId) return;
    await transferPrime(crewId, newPrimeId, userId);
    await refreshMyCrew();
    setConfirmAction(null);
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#05070d]">
        <CommunityNavbar />
        <div className="flex flex-col items-center justify-center px-4 py-24 pb-28 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center mb-4">
            <Users size={28} className="text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Crew</h1>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Join or create a crew to work together on aerospace projects.
          </p>
          <button
            onClick={() => setAuthAction('view crews')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-sm font-bold text-white transition-all duration-200"
          >
            <LogIn size={16} />
            Login to view crews
          </button>
        </div>
        <SignupPrompt action={authAction} onClose={() => setAuthAction(null)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070d]">
        <CommunityNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-140px)]">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070d]">
      <CommunityNavbar />

      <div className="max-w-2xl mx-auto px-4 pb-20 lg:pb-8">

        {myCrew ? (
          <>
            {/* My Crew header */}
            <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-5 mt-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  {(myRole === 'prime' || myRole === 'manager') ? (
                    <>
                      <button
                        onClick={() => setShowFlagPicker(v => !v)}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shrink-0 hover:border-cyan-500/40 transition-all"
                        title="Change crew flag"
                      >
                        {myCrew.flag ? <FlagIcon code={myCrew.flag} size={28} /> : <Users size={22} className="text-cyan-400" />}
                      </button>
                      {showFlagPicker && (
                        <div ref={flagPickerRef} className="absolute top-full left-0 mt-2 z-50">
                          <FlagPicker
                            value={myCrew.flag || ''}
                            defaultOpen
                            onChange={async (newFlag) => {
                              await updateCrew(myCrew.id, { flag: newFlag || undefined });
                              setMyCrew({ ...myCrew, flag: newFlag });
                              setShowFlagPicker(false);
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center shrink-0">
                      {myCrew.flag ? <FlagIcon code={myCrew.flag} size={28} /> : <Users size={22} className="text-cyan-400" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                      {myCrew.flag && <FlagIcon code={myCrew.flag} />}
                      {myCrew.name}
                    </h2>
                    {myRole === 'prime' && <Crown size={14} className="text-amber-400 shrink-0" />}
                    {myRole === 'manager' && <Shield size={14} className="text-cyan-400 shrink-0" />}
                    {(myRole === 'prime' || myRole === 'manager') && (
                      <button
                        onClick={() => setSelectedCrew(myCrew)}
                        className="p-1 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all shrink-0"
                        title="Crew settings"
                      >
                        <Settings size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{myCrew.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span>Level {myCrew.level}</span>
                    <span>{members.length}/{Math.min(myCrew.level * 10, 200)} members</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-4 border-b border-white/5">
              <button
                onClick={() => setCrewTab('feed')}
                className={`pb-2 text-sm font-semibold transition-colors ${crewTab === 'feed' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Feed
              </button>
              <button
                onClick={() => setCrewTab('members')}
                className={`pb-2 text-sm font-semibold transition-colors ${crewTab === 'members' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Members ({members.length})
              </button>
            </div>

            {crewTab === 'feed' && myCrew && (
              <CrewFeed crewId={myCrew.id} userId={userId} isMember={!!myRole} />
            )}

            {crewTab === 'members' && (
              <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 mb-4">
                <div className="space-y-1">
                  {members.map(m => {
                    const isMe = m.user_id === userId;
                    const isPrime = myRole === 'prime';
                    const isManager = myRole === 'prime' || myRole === 'manager';
                    const canManage = (isPrime || (isManager && m.role === 'member')) && !isMe;
                    return (
                      <div key={m.user_id} className="flex items-center gap-2.5 py-2 px-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                        <button
                          onClick={() => navigate('/community/user/' + m.user_id)}
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
                              {m.role === 'prime' && <Crown size={12} className="text-amber-400 shrink-0" />}
                              {m.role === 'manager' && <Shield size={12} className="text-cyan-400 shrink-0" />}
                              {isMe && <span className="text-[10px] text-slate-500">(you)</span>}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          {canManage && (
                            <>
                              {m.role === 'member' && (
                                confirmAction?.type === 'manager' && confirmAction.userId === m.user_id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleMakeManager(myCrew.id, m.user_id)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-semibold text-cyan-400 bg-cyan-500/20 hover:bg-cyan-500/30 transition-colors"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setConfirmAction(null)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmAction({ type: 'manager', userId: m.user_id })}
                                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                                  >
                                    Make Manager
                                  </button>
                                )
                              )}
                              {m.role === 'manager' && isPrime && (
                                confirmAction?.type === 'demote' && confirmAction.userId === m.user_id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleMakeMember(myCrew.id, m.user_id)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 bg-white/20 hover:bg-white/30 transition-colors"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setConfirmAction(null)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmAction({ type: 'demote', userId: m.user_id })}
                                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                                  >
                                    Demote
                                  </button>
                                )
                              )}
                              {isPrime && m.role !== 'prime' && (
                                confirmAction?.type === 'transfer' && confirmAction.userId === m.user_id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleTransferPrime(myCrew.id, m.user_id)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-400 bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setConfirmAction(null)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmAction({ type: 'transfer', userId: m.user_id })}
                                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                                    title="Transfer prime to this member"
                                  >
                                    Transfer
                                  </button>
                                )
                              )}
                              {confirmLeave === m.user_id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleLeave(myCrew.id, m.user_id)}
                                    disabled={leaving === m.user_id}
                                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-red-400 bg-red-500/20 hover:bg-red-500/30 transition-colors"
                                  >
                                    {leaving === m.user_id ? '...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => setConfirmLeave(null)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmLeave(m.user_id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                  title="Remove member"
                                >
                                  <UserMinus size={13} />
                                </button>
                              )}
                            </>
                          )}
                          {isMe && myRole !== 'prime' && (
                            confirmLeave === m.user_id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleLeave(myCrew.id, m.user_id)}
                                  disabled={leaving === m.user_id}
                                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-red-400 bg-red-500/20 hover:bg-red-500/30 transition-colors"
                                >
                                  {leaving === m.user_id ? '...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setConfirmLeave(null)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmLeave(m.user_id)}
                                className="px-2 py-1 rounded-lg text-[10px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                              >
                                Leave
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Crew list for non-members */}
            <div className="flex items-center justify-between mt-4 mb-3">
              <h2 className="text-sm font-bold text-white">Available Crews</h2>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 text-cyan-300 text-xs font-semibold hover:from-cyan-600/30 hover:to-blue-600/30 transition-all"
              >
                <Plus size={14} />
                Propose New
              </button>
            </div>

            {crews.length === 0 ? (
              <div className="text-center py-16">
                <Users size={36} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">No active crews yet.</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 px-4 py-2 rounded-xl bg-cyan-600/20 text-cyan-300 text-sm font-semibold hover:bg-cyan-600/30 transition-colors"
                >
                  Propose the first crew
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {crews.map(crew => {
                  const applied = appliedCrewIds.has(crew.id);
                  return (
                    <button
                      key={crew.id}
                      onClick={() => setSelectedCrew(crew)}
                      className={`text-left rounded-2xl border p-4 transition-all duration-200 ${
                        applied
                          ? 'border-cyan-500/40 bg-cyan-500/10 hover:border-cyan-400/60'
                          : 'border-white/10 bg-[#0f1120]/80 backdrop-blur-sm hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                          applied
                            ? 'bg-cyan-500/20 border-cyan-500/30'
                            : 'bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border-white/10'
                        }`}>
                          {applied ? (
                            <Check size={15} className="text-cyan-400" />
                          ) : crew.flag ? (
                            <FlagIcon code={crew.flag} size={20} />
                          ) : (
                            <Users size={15} className="text-cyan-400" />
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white truncate flex items-center gap-1">
                          {crew.flag && <FlagIcon code={crew.flag} />}
                          {crew.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-2">{crew.description || 'No description'}</p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500">
                        <span>Level {crew.level}</span>
                        <span>{(crew as any).member_count ?? 0}/{Math.min(crew.level * 10, 200)} members</span>
                      </div>
                      {applied && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400 font-semibold">
                          <Check size={10} />
                          Applied
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <CrewDetailModal
        open={!!selectedCrew}
        crew={selectedCrew}
        userId={userId}
        hasApplied={selectedCrew ? appliedCrewIds.has(selectedCrew.id) : false}
        onClose={() => setSelectedCrew(null)}
        onJoined={() => {
          if (selectedCrew) {
            setAppliedCrewIds(prev => new Set(prev).add(selectedCrew.id));
          }
          refreshMyCrew();
        }}
        onUpdated={(updated) => { setMyCrew(updated); setSelectedCrew(updated); }}
      />

      <CreateCrewModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        userId={userId}
        onCreated={() => { fetchActiveCrews(20).then(setCrews); }}
      />
    </div>
  );
};

export default CrewPage;

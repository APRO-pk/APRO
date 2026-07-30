import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Users, Globe, User, MessageSquare, Search, Send, ArrowLeft, Coins } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { getDisplayName, fetchFollowing, getProfileAvatar } from '../../lib/community-api';
import { getMyConversations, getConversationMessages, sendDMMessage, markConversationRead, getTotalUnreadCount, getOrCreateConversation } from '../../lib/dms-api';
import { searchAll } from '../../lib/search-api';
import { useTokens } from '../../lib/token-utils';
import { InsufficientTokensModal } from './TokenModals';
import type { DMConversation, DMMessage } from '../../lib/dms-types';
import type { SearchResults } from '../../lib/search-api';

export function CommunityNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [ownUsername, setOwnUsername] = useState<string | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<'dms' | 'search' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeOtherUserId, setActiveOtherUserId] = useState<string>('');
  const [activeOtherName, setActiveOtherName] = useState<string>('');
  const [activeOtherAvatar, setActiveOtherAvatar] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [trackedUsers, setTrackedUsers] = useState<{ id: string; name: string; avatar: string }[]>([]);
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const { deduct, isFree, canAfford, tokens, resetAt, membershipClass } = useTokens(userId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) {
        const uid = data.session.user.id;
        setUserId(uid);
        loadConversations(uid);
        loadUnread(uid);
        loadTracked(uid);
        supabase.from('community_profiles').select('display_name').eq('id', uid).maybeSingle().then(({ data: p }) => {
          if (p?.display_name) setOwnUsername(p.display_name);
        });
      }
    });
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || activeSidebar !== 'search') {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      const results = await searchAll(searchQuery.trim());
      setSearchResults(results);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeSidebar]);

  const loadTracked = async (uid: string) => {
    const following = await fetchFollowing(uid) as { following_id: string }[];
    const users = await Promise.all(
      following.map(async f => ({
        id: f.following_id,
        name: (await getDisplayName(f.following_id)).split(' ')[0] || '?',
        avatar: await getProfileAvatar(f.following_id),
      }))
    );
    setTrackedUsers(users);
  };

  const loadConversations = async (uid: string) => {
    const convs = await getMyConversations();
    setConversations(convs);
  };

  const loadUnread = async (uid: string) => {
    const count = await getTotalUnreadCount();
    setUnreadCount(count);
  };

  const openConversation = async (convId: string, otherUserId?: string) => {
    setActiveConvId(convId);
    if (otherUserId) {
      setActiveOtherUserId(otherUserId);
      Promise.all([getDisplayName(otherUserId), getProfileAvatar(otherUserId)]).then(([name, avatar]) => {
        setActiveOtherName(name.split(' ')[0] || name);
        setActiveOtherAvatar(avatar);
      });
    }
    const msgs = await getConversationMessages(convId);
    setMessages(msgs);
    await markConversationRead(convId);
    setUnreadCount(prev => Math.max(0, prev - (conversations.find(c => c.id === convId)?.unread_count ?? 0)));
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    setTimeout(() => messageInputRef.current?.focus(), 200);
  };

  const handleTrackedUserClick = async (otherUserId: string) => {
    if (!userId) return;
    try {
      if (isFree) {
        if (!canAfford(1)) { setInsufficientModalOpen(true); return; }
        await deduct(1);
      }
      const convId = await getOrCreateConversation(otherUserId);
      const convs = await getMyConversations();
      setConversations(convs);
      await openConversation(convId, otherUserId);
    } catch (err) {
      console.error('Failed to open DM:', err);
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !activeConvId) return;
    try {
      const msg = await sendDMMessage(activeConvId, messageInput.trim());
      setMessageInput('');
      setMessages(prev => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNav = (path: string | null, isProfile?: boolean) => {
    if (isProfile && (ownUsername || userId)) navigate(`/community/user/${ownUsername || userId}`);
    else if (path) navigate(path);
  };

  const isActive = (path: string | null, exact?: boolean, isProfile?: boolean) => {
    if (exact) return location.pathname === '/community' || location.pathname === '/community/launchpad';
    if (isProfile) return location.pathname.startsWith('/community/user/');
    if (!path) return false;
    return location.pathname === path;
  };

  const toggleSidebar = (type: 'dms' | 'search') => {
    if (activeSidebar === type) {
      setActiveSidebar(null);
      setSearching(false);
      setActiveConvId(null);
    } else {
      setActiveSidebar(type);
      if (type === 'search') setSearching(false);
      if (type === 'dms') {
        setActiveConvId(null);
        setMessages([]);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const items = [
    { path: '/community/missions', icon: Globe, label: 'Missions' },
    { path: '/community', icon: Home, label: 'Home', exact: true },
    { path: '/community/crew', icon: Users, label: 'Crew' },
    { path: null, icon: User, label: 'Profile', isProfile: true },
  ];

  const btnClass = (active: boolean) =>
    `relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
      active ? 'text-white' : 'text-slate-500 hover:text-slate-200'
    }`;

  const pillBase = 'rounded-2xl border border-white/10 bg-[#0f1120]/90 backdrop-blur-xl shadow-lg shadow-black/20';

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block sticky top-24 z-40 w-full px-3 py-2">
        <div className="relative flex justify-center">
          {/* Centered pill nav */}
          <div className={`inline-flex items-center gap-0.5 px-1.5 py-1 ${pillBase}`}>
            {items.map((item) => {
              const active = isActive(item.path, item.exact, item.isProfile);
              return (
                <button
                  key={item.label}
                  onClick={() => handleNav(item.path, item.isProfile)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    active ? 'text-white' : 'text-slate-500 hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600/25 to-blue-600/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
                  )}
                  <item.icon size={15} className="relative" />
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Community Tokens (top right) */}
          {tokens !== null && (
            <div className="absolute right-0 top-0 group">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${pillBase} cursor-default`}>
                <Coins size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-white">{tokens}</span>
              </div>

              {/* Hover dropdown */}
              <div className="absolute right-0 top-full mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-50">
                <div className={`${pillBase} p-4 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Community Tokens</span>
                    <span className="text-xs font-bold text-white">{tokens} / 120</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        tokens >= 72 ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' :
                        tokens >= 36 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                        'bg-gradient-to-r from-red-500 to-rose-500'
                      }`}
                      style={{ width: `${Math.min(tokens / 120, 1) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Resets in</span>
                    <span className="text-xs font-semibold text-white">
                      {resetAt
                        ? `${Math.max(0, Math.ceil((new Date(resetAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days`
                        : '30 days'}
                    </span>
                  </div>
                  <Link to="/pricing"
                    className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-600/30 transition-all"
                  >
                    Upgrade
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar at full left edge */}
          <div className="absolute left-0 top-0">
            <div className={`inline-flex items-center gap-0.5 px-1.5 py-1 ${pillBase}`}>
              <button
                onClick={() => toggleSidebar('dms')}
                className={btnClass(activeSidebar === 'dms')}
              >
                {activeSidebar === 'dms' && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600/25 to-blue-600/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
                )}
                <MessageSquare size={15} className="relative" />
                <span className="relative">DMs</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-[9px] font-bold text-white shadow-lg shadow-rose-500/30">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => toggleSidebar('search')}
                className={btnClass(activeSidebar === 'search')}
              >
                {activeSidebar === 'search' && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600/25 to-blue-600/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
                )}
                <Search size={15} className="relative" />
                <span className="relative">Search</span>
              </button>
            </div>

            {/* DM Panel (overlay) */}
            {activeSidebar === 'dms' && (
              <div className="absolute left-0 top-full mt-2 z-50" style={{ width: '360px', animation: 'dropdownFadeIn 0.15s ease-out' }}>
                <div className={`${pillBase} overflow-hidden`} style={{ maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
                  {activeConvId ? (
                    <>
                      <div className="flex items-center gap-2 p-3 border-b border-white/10">
                        <button onClick={() => { setActiveConvId(null); setMessages([]); setActiveOtherUserId(''); setActiveOtherName(''); setActiveOtherAvatar(''); }} className="text-slate-400 hover:text-white transition-colors">
                          <ArrowLeft size={16} />
                        </button>
                        <button onClick={() => activeOtherUserId && navigate(`/community/user/${activeOtherUserId}`)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          {activeOtherAvatar ? (
                            <img src={activeOtherAvatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 flex items-center justify-center text-[10px] font-bold text-cyan-200">
                              {activeOtherName[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <span className="text-sm font-semibold text-white">{activeOtherName}</span>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ minHeight: '200px', maxHeight: '400px' }}>
                        {messages.length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-8">No messages yet. Say hello!</p>
                        )}
                        {messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                              msg.sender_id === userId
                                ? 'bg-cyan-600/30 text-cyan-100 rounded-tr-sm'
                                : 'bg-white/5 text-slate-200 rounded-tl-sm'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="p-3 border-t border-white/10">
                        <div className="flex gap-2">
                          <input
                            ref={messageInputRef}
                            type="text"
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-colors"
                          />
                          <button
                            onClick={handleSend}
                            disabled={!messageInput.trim()}
                            className="p-2 rounded-xl bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/50 disabled:opacity-30 transition-all"
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 border-b border-white/10">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                          <MessageSquare size={15} className="text-cyan-400" />
                          Direct Messages
                        </div>
                      </div>
                      {trackedUsers.length > 0 && (
                        <div className="px-3 py-3 border-b border-white/5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Tracked</p>
                          <div className="flex flex-wrap gap-2">
                            {trackedUsers.map(tu => (
                              <button
                                key={tu.id}
                                onClick={() => handleTrackedUserClick(tu.id)}
                                className="group relative flex flex-col items-center gap-1"
                                title={tu.name}
                              >
                                {tu.avatar ? (
                                  <img src={tu.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 transition-transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-600/20" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 flex items-center justify-center text-xs font-bold text-cyan-200 shrink-0 transition-transform group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-600/20">
                                    {tu.name[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="text-[9px] text-slate-500 truncate max-w-[44px] group-hover:text-slate-300 transition-colors">
                                  {tu.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="overflow-y-auto" style={{ minHeight: '200px', maxHeight: '450px' }}>
                        {conversations.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 px-4">
                            <MessageSquare size={28} className="text-slate-700 mb-2" />
                            <p className="text-sm text-slate-500 text-center">No conversations yet</p>
                          </div>
                        )}
                        {conversations.map(conv => (
                          <button
                            key={conv.id}
                            onClick={() => openConversation(conv.id, conv.other_user_id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left border-b border-white/[0.03]"
                          >
                            {conv.other_user_avatar ? (
                              <img src={conv.other_user_avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 flex items-center justify-center text-xs font-bold text-cyan-200 shrink-0">
                                {(conv.other_user_name ?? '?')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-white truncate">{conv.other_user_name}</span>
                                {conv.last_message && (
                                  <span className="text-[10px] text-slate-500 shrink-0">
                                    {new Date(conv.last_message.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {conv.last_message?.content ?? 'No messages yet'}
                              </p>
                            </div>
                            {(conv.unread_count ?? 0) > 0 && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Search Panel (overlay) */}
            {activeSidebar === 'search' && (
              <div className="absolute left-0 top-full mt-2 z-50 w-80" style={{ animation: 'dropdownFadeIn 0.15s ease-out' }}>
                <div className={`${pillBase} p-4`}>
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search community..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-colors"
                      />
                    </div>
                  </form>
                  {searchLoading && (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {searchResults && !searchLoading && (
                    <div className="mt-3 space-y-3 max-h-[50vh] overflow-y-auto">
                      {searchResults.members.length === 0 && searchResults.crews.length === 0 && searchResults.missions.length === 0 && searchResults.posts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6">
                          <Search size={24} className="text-slate-700 mb-2" />
                          <p className="text-xs text-slate-500">No results for &ldquo;{searchQuery}&rdquo;</p>
                        </div>
                      ) : (
                        <>
                          {searchResults.members.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 px-1">Members</p>
                              <div className="space-y-0.5">
                                {searchResults.members.map(m => (
                                  <button key={m.id} onClick={() => navigate(`/community/user/${m.id}`)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors text-left">
                                    {m.avatar_url ? (
                                      <img src={m.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 flex items-center justify-center text-[10px] font-bold text-cyan-200 shrink-0">
                                        {m.display_name[0]?.toUpperCase() ?? '?'}
                                      </div>
                                    )}
                                    <span className="text-sm font-medium text-white truncate">{m.display_name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {searchResults.crews.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 px-1">Crews</p>
                              <div className="space-y-0.5">
                                {searchResults.crews.map(c => (
                                  <button key={c.id} onClick={() => navigate(`/community/crew`)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors text-left">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-600/30 to-orange-600/30 flex items-center justify-center text-[10px] font-bold text-amber-200 shrink-0">
                                      {c.name[0]?.toUpperCase() ?? '?'}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-white truncate">{c.name}</p>
                                      <p className="text-[10px] text-slate-500 truncate">{c.description}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {searchResults.missions.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 px-1">Missions</p>
                              <div className="space-y-0.5">
                                {searchResults.missions.map(m => (
                                  <button key={m.id} onClick={() => navigate(`/community/missions`)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors text-left">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600/30 to-green-600/30 flex items-center justify-center text-[10px] font-bold text-emerald-200 shrink-0">
                                      <Globe size={12} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-white truncate">{m.name}</p>
                                      <p className="text-[10px] text-slate-500 truncate">{m.description}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          {searchResults.posts.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 px-1">Posts</p>
                              <div className="space-y-0.5">
                                {searchResults.posts.map(p => (
                                  <button key={p.id} onClick={() => navigate(`/community/post/${p.id}`)} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors text-left">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600/30 to-purple-600/30 flex items-center justify-center text-[10px] font-bold text-violet-200 shrink-0">
                                      <MessageSquare size={12} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[11px] text-white leading-snug line-clamp-2">{p.content}</p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">{p.author_name}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: fixed bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3 pb-3 pt-1">
        <div className="w-full max-w-md flex items-center justify-around rounded-2xl border border-white/10 bg-[#0f1120]/95 backdrop-blur-xl px-2 py-2 shadow-lg shadow-black/30">
          {items.map((item) => {
            const active = isActive(item.path, item.exact, item.isProfile);
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path, item.isProfile)}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                  active ? 'text-white' : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20" />
                )}
                <item.icon size={20} className="relative" />
              </button>
            );
          })}
        </div>
      </div>
      <InsufficientTokensModal open={insufficientModalOpen} onClose={() => setInsufficientModalOpen(false)} />
    </>
  );
}

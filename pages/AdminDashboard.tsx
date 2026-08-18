import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Shield, Target, FileText, MessageSquare, Calendar,
  Search, X, Ban, CheckCircle, Clock, Mail, Activity, ChevronRight,
  Wifi, WifiOff, UserX, UserCheck, MoreHorizontal, LogOut, ExternalLink,
  RefreshCw, MessageCircle, Repeat2, Eye, Flag, AlertTriangle, Award, Plus, Trash2, Save, Edit3, Upload,
  ListChecks, Download, Loader2,
} from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { getCachedDisplayName } from "../src/lib/community-api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdminShell, SurfacePanel } from "../components/PageScaffold";

type AdminUser = { id: number; username: string; auth_id: string };
type MemberProfile = { id: string; display_name: string; avatar_url: string; bio: string; created_at: string };
type MemberBan = { id: string; user_id: string; reason: string; is_permanent: boolean; expires_at: string | null; created_at: string };
type MemberRestriction = { id: string; user_id: string; restriction_type: string; created_at: string };
type MemberActivity = { type: 'post' | 'comment'; content: string; created_at: string; id: string };
type Crew = { id: string; name: string; description: string; level: number; status: string; prime_id: string; member_count?: number; created_at: string };
type Project = { id: string; title: string; visibility: string; owner_id: string; crew_id: string | null; created_at: string };

type NavSection = 'overview' | 'members' | 'crews' | 'missions' | 'certifications';

const APPLICATION_TYPES = { STUDENT: "STUDENT", CHAPTER: "CHAPTER" };
const STATUS = { PENDING: "PENDING" };
const RESTRICTION_TYPES = ['post', 'comment', 'vote', 'create_crew', 'join_crew', 'create_mission'] as const;

const NAV_ITEMS: { id: NavSection; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'crews', label: 'Crews', icon: Shield },
  { id: 'missions', label: 'Missions', icon: Target },
  { id: 'certifications', label: 'Certifications', icon: Award },
];

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [navSection, setNavSection] = useState<NavSection>('overview');

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { navigate("/admin/login"); return; }
        const { data: row, error } = await supabase.from("admins").select("id, username, auth_id").eq("auth_id", session.user.id).single();
        if (error || !row) { await supabase.auth.signOut(); navigate("/admin/login"); return; }
        setAdmin(row);
      } catch { navigate("/admin/login");
      } finally { setLoading(false); }
    })();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  if (loading) return <AdminShell eyebrow="Admin" title="APRO Admin Dashboard" description="Loading..." actions={<Link to="/" className="text-sm text-slate-300 hover:text-white">View site</Link>}><SurfacePanel>Loading dashboard...</SurfacePanel></AdminShell>;

  return (
    <div className="min-h-screen bg-[#05070d] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(5,7,13,0.95)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1880px] items-center justify-between px-5 py-3 md:px-8 xl:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-[10px] font-bold text-white">A</div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Admin Panel</div>
              <div className="text-[10px] text-slate-500">{admin?.username || 'Dashboard'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">View site</Link>
            <button onClick={handleLogout} className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/20 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5"><LogOut size={14} /> Logout</button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1880px] px-5 md:px-8 xl:px-12">
        {/* Sidebar */}
        <aside className="sticky top-[73px] hidden h-[calc(100vh-73px)] w-[200px] shrink-0 overflow-y-auto border-r border-white/10 py-6 pr-4 lg:block">
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setNavSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    navSection === item.id ? 'bg-[linear-gradient(180deg,#9879ff33,#7b2cbf33)] text-white border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-600 mb-2 px-3">Management</div>
            <div className="space-y-1">
              <SideLink to="/admin/students" label="Member Applications" />
              <SideLink to="/admin/chapters" label="Chapter Applications" />
              <SideLink to="/admin/careers" label="Career Applications" />
              <SideLink to="/admin/feedback" label="Feedback & Bugs" />
              <SideLink to="/admin/events" label="Event Forms" />
            </div>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10 bg-[rgba(5,7,13,0.98)] lg:hidden">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setNavSection(item.id)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                  navSection === item.id ? 'text-violet-300' : 'text-slate-500'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="min-h-[calc(100vh-73px)] flex-1 py-6 pl-0 lg:pl-6 pb-20 lg:pb-6">
          {navSection === 'overview' && <OverviewSection admin={admin} />}
          {navSection === 'members' && <MembersSection admin={admin} />}
          {navSection === 'crews' && <CrewsSection admin={admin} />}
          {navSection === 'missions' && <MissionsSection admin={admin} />}
          {navSection === 'certifications' && <CertificationsSection admin={admin} />}
        </main>
      </div>
    </div>
  );
};

/* ─── Sidebar Link ─── */
const SideLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link to={to} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-slate-400 transition-all hover:text-white hover:bg-white/[0.04]">
    <ChevronRight size={14} className="opacity-40" />
    {label}
  </Link>
);

/* ─── OVERVIEW SECTION ─── */
const OverviewSection: React.FC<{ admin: AdminUser | null }> = ({ admin }) => {
  const [stats, setStats] = useState({ members: 0, chapters: 0, careers: 0, crewProposals: 0, pendingMembers: 0, pendingChapters: 0, pendingCareers: 0, pendingCrew: 0, totalCrews: 0, totalProjects: 0, totalProfiles: 0, totalPosts: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("applications").select("*", { count: "exact", head: true }).eq("applicant_type", APPLICATION_TYPES.STUDENT),
      supabase.from("applications").select("*", { count: "exact", head: true }).eq("applicant_type", APPLICATION_TYPES.CHAPTER),
      supabase.from("career_applications").select("*", { count: "exact", head: true }),
      supabase.from("crews").select("*", { count: "exact", head: true }),
      supabase.from("applications").select("*", { count: "exact", head: true }).eq("applicant_type", APPLICATION_TYPES.STUDENT).eq("status", STATUS.PENDING),
      supabase.from("applications").select("*", { count: "exact", head: true }).eq("applicant_type", APPLICATION_TYPES.CHAPTER).eq("status", STATUS.PENDING),
      supabase.from("career_applications").select("*", { count: "exact", head: true }).eq("status", STATUS.PENDING),
      supabase.from("crews").select("*", { count: "exact", head: true }).eq("status", "proposed"),
      supabase.from("crews").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("community_profiles").select("*", { count: "exact", head: true }),
      supabase.from("community_posts").select("*", { count: "exact", head: true }),
    ]).then(([m, ch, ca, c, pm, pch, pca, pc, tc, tp, tpr, tpo]) => {
      setStats({
        members: m.count || 0, chapters: ch.count || 0, careers: ca.count || 0, crewProposals: c.count || 0,
        pendingMembers: pm.count || 0, pendingChapters: pch.count || 0, pendingCareers: pca.count || 0, pendingCrew: pc.count || 0,
        totalCrews: tc.count || 0, totalProjects: tp.count || 0, totalProfiles: tpr.count || 0, totalPosts: tpo.count || 0,
      });
    });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome back{admin?.username ? `, ${admin.username}` : ''}</h1>
        <p className="mt-1 text-sm text-slate-400">Here's what's happening across APRO.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MiniStat label="Total Members" value={stats.totalProfiles} />
        <MiniStat label="Active Crews" value={stats.totalCrews} />
        <MiniStat label="Projects" value={stats.totalProjects} />
        <MiniStat label="Posts" value={stats.totalPosts} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SurfacePanel className="p-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2"><FileText size={16} /> Applications Pending Review</h3>
          <div className="mt-4 space-y-3">
            <OverviewRow label="Member Applications" value={stats.pendingMembers} to="/admin/students" />
            <OverviewRow label="Chapter Applications" value={stats.pendingChapters} to="/admin/chapters" />
            <OverviewRow label="Career Applications" value={stats.pendingCareers} to="/admin/careers" />
            <OverviewRow label="Crew Proposals" value={stats.pendingCrew} to="/admin/crew" />
          </div>
        </SurfacePanel>

        <SurfacePanel className="p-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2"><LayoutDashboard size={16} /> Quick Actions</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <QuickCard to="/admin/students" label="Member Apps" />
            <QuickCard to="/admin/chapters" label="Chapter Apps" />
            <QuickCard to="/admin/careers" label="Career Apps" />
            <QuickCard to="/admin/feedback" label="Feedback" />
            <QuickCard to="/admin/events" label="Events" />
            <QuickCard to="/admin/crew" label="Crew Proposals" />
          </div>
        </SurfacePanel>

        <SurfacePanel className="p-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2"><Users size={16} /> Totals</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <OverviewRow label="Total Member Applications" value={stats.members} />
            <OverviewRow label="Total Chapter Applications" value={stats.chapters} />
            <OverviewRow label="Total Career Applications" value={stats.careers} />
            <OverviewRow label="Total Crew Proposals" value={stats.crewProposals} />
          </div>
        </SurfacePanel>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <SurfacePanel className="p-4 text-center">
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-slate-500">{label}</div>
  </SurfacePanel>
);

const OverviewRow: React.FC<{ label: string; value: number; to?: string }> = ({ label, value, to }) => {
  const inner = (
    <div className="flex items-center justify-between border-b border-white/10 py-2.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

const QuickCard: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link to={to} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] hover:border-violet-500/20">
    {label}
  </Link>
);

/* ─── MEMBERS SECTION ─── */
const MembersSection: React.FC<{ admin: AdminUser | null }> = ({ admin }) => {
  const [query, setQuery] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const fetchAdmins = useCallback(async () => {
    const { data } = await supabase.from('admins').select('auth_id');
    if (data) setAdminIds(new Set((data as { auth_id: string }[]).map(a => a.auth_id)));
  }, []);

  const loadMembers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      let queryBuilder = supabase.from('community_profiles')
        .select('id, display_name, avatar_url, bio, created_at')
        .order('display_name', { ascending: true });
      if (q.trim()) queryBuilder = queryBuilder.ilike('display_name', `%${q}%`).limit(50);
      const { data } = await queryBuilder;
      setMembers(data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);
  useEffect(() => { const t = setTimeout(() => loadMembers(query), query.trim() ? 300 : 0); return () => clearTimeout(t); }, [query, loadMembers]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="mt-1 text-sm text-slate-400">Search, manage, and moderate community members.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by username..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/30 transition" />
          {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={16} /></button>}
        </div>
      </div>

      {loading ? <SurfacePanel className="p-4 text-sm text-slate-400">Loading members...</SurfacePanel> :
       members.length === 0 ? <SurfacePanel className="p-4 text-sm text-slate-400">{query ? 'No members found.' : 'No members yet.'}</SurfacePanel> :
       <div className="space-y-3">
         {members.map(m => <MemberCard key={m.id} member={m} isAdmin={adminIds.has(m.id)} onClick={() => setSelectedMember(m)} />)}
       </div>}

      {selectedMember && <MemberDetailModal member={selectedMember} admin={admin} isAdmin={adminIds.has(selectedMember.id)} onPromoted={fetchAdmins} onClose={() => { setSelectedMember(null); loadMembers(query); }} />}
    </div>
  );
};

const MemberCard: React.FC<{ member: any; isAdmin?: boolean; onClick: () => void }> = ({ member, isAdmin, onClick }) => {
  const initial = (member.display_name?.[0] || '?').toUpperCase();
  return (
    <button onClick={onClick} className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06] hover:border-violet-500/20">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-sm font-bold text-violet-300">{initial}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-white">{member.display_name || 'Unknown'}</div>
            {isAdmin && <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300"><Shield size={10} className="inline mr-0.5 -mt-0.5" /> Admin</span>}
          </div>
          <div className="text-xs text-slate-500">Joined {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}</div>
        </div>
        <ChevronRight size={16} className="text-slate-500" />
      </div>
    </button>
  );
};

/* ─── MEMBER DETAIL MODAL ─── */
const MemberDetailModal: React.FC<{ member: any; admin: AdminUser | null; isAdmin?: boolean; onPromoted?: () => void; onClose: () => void }> = ({ member, admin, isAdmin, onPromoted, onClose }) => {
  const [ban, setBan] = useState<MemberBan | null>(null);
  const [restrictions, setRestrictions] = useState<MemberRestriction[]>([]);
  const [activity, setActivity] = useState<MemberActivity[]>([]);
  const [membership, setMembership] = useState<{ membership_class: string; community_tokens: number; tokens_reset_at: string } | null>(null);
  const [banForm, setBanForm] = useState({ show: false, reason: '', isPermanent: true, hours: '24' });
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState('');

  const promoteToAdmin = async () => {
    setPromoting(true);
    setPromoteMsg('');
    const { error } = await supabase.from('admins').insert({
      auth_id: member.id,
      username: member.display_name || 'admin',
    });
    setPromoting(false);
    if (error) { setPromoteMsg(error.message); return; }
    setPromoted(true);
    setPromoteMsg('Member promoted to admin.');
    onPromoted?.();
  };
  const [tokenEdit, setTokenEdit] = useState({ show: false, value: 0 });
  const [savingTokens, setSavingTokens] = useState(false);
  const [tokenMsg, setTokenMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'message'>('info');
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('member_bans').select('*').eq('user_id', member.id).maybeSingle(),
      supabase.from('member_restrictions').select('*').eq('user_id', member.id),
      supabase.from('community_posts').select('id, content, created_at').eq('author_id', member.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('community_comments').select('id, content, created_at').eq('author_id', member.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('community_profiles').select('membership_class, community_tokens, tokens_reset_at').eq('id', member.id).maybeSingle(),
    ]).then(([banRes, restrRes, postsRes, commentsRes, profileRes]) => {
      setBan(banRes.data);
      setRestrictions(restrRes.data || []);
      setMembership(profileRes.data);
      if (profileRes.data) setTokenEdit(prev => ({ ...prev, value: profileRes.data!.community_tokens }));
      const acts: MemberActivity[] = [
        ...(postsRes.data || []).map(p => ({ type: 'post' as const, content: p.content, created_at: p.created_at, id: p.id })),
        ...(commentsRes.data || []).map(c => ({ type: 'comment' as const, content: c.content, created_at: c.created_at, id: c.id })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
      setActivity(acts);
    });
  }, [member.id]);

  const handleBan = async () => {
    if (!banForm.reason.trim()) return;
    const expires = banForm.isPermanent ? null : new Date(Date.now() + parseInt(banForm.hours) * 3600000).toISOString();
    const { error } = await supabase.from('member_bans').upsert({
      user_id: member.id, reason: banForm.reason, is_permanent: banForm.isPermanent,
      expires_at: expires, created_by: admin?.auth_id || '',
    }, { onConflict: 'user_id' });
    if (!error) { setBan({ id: '', user_id: member.id, reason: banForm.reason, is_permanent: banForm.isPermanent, expires_at: expires, created_at: new Date().toISOString() }); setBanForm({ ...banForm, show: false }); }
  };

  const handleUnban = async () => {
    await supabase.from('member_bans').delete().eq('user_id', member.id);
    setBan(null);
  };

  const toggleRestriction = async (type: string, active: boolean) => {
    if (active) {
      await supabase.from('member_restrictions').insert({ user_id: member.id, restriction_type: type, created_by: admin?.auth_id || '' });
      setRestrictions(prev => [...prev, { id: '', user_id: member.id, restriction_type: type, created_at: new Date().toISOString() }]);
    } else {
      await supabase.from('member_restrictions').delete().eq('user_id', member.id).eq('restriction_type', type);
      setRestrictions(prev => prev.filter(r => r.restriction_type !== type));
    }
  };

  const handleSaveTokens = async () => {
    if (tokenEdit.value < 0) return;
    setSavingTokens(true);
    setTokenMsg('');
    const { error } = await supabase.from('community_profiles').update({ community_tokens: tokenEdit.value }).eq('id', member.id);
    if (error) { setTokenMsg('Failed to update tokens.'); } else { setTokenMsg('Tokens updated.'); setMembership(prev => prev ? { ...prev, community_tokens: tokenEdit.value } : prev); }
    setSavingTokens(false);
    setTimeout(() => setTokenMsg(''), 3000);
  };

  const sendAdminMessage = async () => {
    if (!messageText.trim()) return;
    setSendingMsg(true);
    try {
      const { data: convId } = await supabase.rpc('create_dm_conversation', { uid1: admin?.auth_id || '', uid2: member.id }).single();
      if (convId) {
        await supabase.from('dms_messages').insert({ conversation_id: convId, sender_id: admin?.auth_id || '', content: `[ADMIN] ${messageText}` });
        await supabase.from('dms_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
      }
      setMsgSent(true);
      setMessageText('');
      setTimeout(() => setMsgSent(false), 3000);
    } finally { setSendingMsg(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c101a] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/20 text-lg font-bold text-violet-300">
              {(member.display_name?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{member.display_name || 'Unknown'}</h2>
              <p className="text-sm text-slate-400">ID: {member.id.slice(0, 8)}...</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {ban ? (
              <span className="flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                <Ban size={12} /> Banned{ban.is_permanent ? '' : ` (${ban.expires_at ? Math.ceil((new Date(ban.expires_at).getTime() - Date.now()) / 3600000) : '?'}h)`}
              </span>
            ) : null}
            {!isAdmin && !promoted ? (
              <button onClick={promoteToAdmin} disabled={promoting}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-500/20 disabled:opacity-50 transition">
                <Shield size={12} /> {promoting ? 'Promoting...' : 'Make Admin'}
              </button>
            ) : null}
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-300">
                <Shield size={12} /> Admin
              </span>
            )}
            <button onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-white">Close</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          {(['info', 'activity', 'message'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                activeTab === tab ? 'border-violet-400 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'info' ? 'Info & Restrictions' : tab === 'activity' ? 'Activity' : 'Message'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {promoteMsg && (
                <div className={`rounded-xl border px-4 py-3 text-sm ${promoteMsg === 'Member promoted to admin.' ? 'border-green-400/20 bg-green-400/10 text-green-300' : 'border-red-400/20 bg-red-400/10 text-red-200'}`}>
                  {promoteMsg}
                </div>
              )}
              {/* Ban Controls */}
              <SurfacePanel className="p-4">
                <h4 className="text-sm font-bold text-white mb-3">Account Status</h4>
                {ban ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-red-300"><Ban size={14} /> Banned — {ban.reason}</div>
                    {!ban.is_permanent && ban.expires_at && <div className="text-xs text-slate-400">Expires: {new Date(ban.expires_at).toLocaleString()}</div>}
                    <button onClick={handleUnban} className="mt-2 rounded-full border border-green-400/20 px-4 py-1.5 text-xs font-semibold text-green-300 hover:bg-green-400/10"><UserCheck size={14} className="inline mr-1" /> Unban Member</button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle size={14} /> Active</div>
                    {!banForm.show ? (
                      <button onClick={() => setBanForm({ ...banForm, show: true })} className="mt-2 rounded-full border border-red-400/20 px-4 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-400/10"><Ban size={14} className="inline mr-1" /> Ban Member</button>
                    ) : (
                      <div className="mt-3 space-y-3 border border-white/10 rounded-xl bg-white/[0.03] p-4">
                        <textarea value={banForm.reason} onChange={e => setBanForm({ ...banForm, reason: e.target.value })} placeholder="Ban reason..." className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/30" rows={2} />
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={banForm.isPermanent} onChange={e => setBanForm({ ...banForm, isPermanent: e.target.checked })} /> Permanent</label>
                          {!banForm.isPermanent && (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <span>Expires in</span>
                              <input type="number" value={banForm.hours} onChange={e => setBanForm({ ...banForm, hours: e.target.value })} className="w-16 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-white outline-none" min="1" />
                              <span>hours</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleBan} className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700">Apply Ban</button>
                          <button onClick={() => setBanForm({ ...banForm, show: false })} className="rounded-full border border-white/10 px-4 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06]">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </SurfacePanel>

              {/* Membership & Tokens */}
              <SurfacePanel className="p-4">
                <h4 className="text-sm font-bold text-white mb-3">Subscription & Tokens</h4>
                {membership ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs text-slate-400">Plan</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        membership.membership_class === 'Free' ? 'bg-slate-500/12 text-slate-200 border-slate-400/18'
                        : 'bg-violet-500/12 text-violet-200 border-violet-400/18'
                      }`}>{membership.membership_class}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs text-slate-400">Tokens</span>
                      <div className="flex items-center gap-2">
                        {tokenEdit.show ? (
                          <>
                            <input type="number" value={tokenEdit.value} onChange={e => setTokenEdit({ ...tokenEdit, value: parseInt(e.target.value) || 0 })}
                              className="w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white text-center outline-none focus:border-violet-500/30" min="0" />
                            <button onClick={handleSaveTokens} disabled={savingTokens}
                              className="rounded-full bg-violet-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-violet-700 disabled:opacity-50">{savingTokens ? '...' : 'Save'}</button>
                            <button onClick={() => setTokenEdit({ ...tokenEdit, show: false })}
                              className="text-[10px] text-slate-500 hover:text-white">Cancel</button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-bold text-white">{membership.community_tokens}</span>
                            <button onClick={() => setTokenEdit({ ...tokenEdit, show: true, value: membership.community_tokens })}
                              className="text-[10px] text-violet-400 hover:text-violet-300 underline">Edit</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Reset</span>
                      <span className="text-xs text-slate-300">{membership.tokens_reset_at ? new Date(membership.tokens_reset_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    {tokenMsg && <div className={`text-xs ${tokenMsg.includes('Failed') ? 'text-red-300' : 'text-emerald-300'}`}>{tokenMsg}</div>}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No profile data found.</p>
                )}
              </SurfacePanel>

              {/* Activity Restrictions */}
              <SurfacePanel className="p-4">
                <h4 className="text-sm font-bold text-white mb-3">Activity Restrictions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {RESTRICTION_TYPES.map(type => {
                    const isActive = restrictions.some(r => r.restriction_type === type);
                    return (
                      <button key={type} onClick={() => toggleRestriction(type, !isActive)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          isActive ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        {isActive ? <WifiOff size={14} /> : <Wifi size={14} />}
                        {type.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </SurfacePanel>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              {activity.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {activity.map(a => (
                    <div key={`${a.type}-${a.id}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        {a.type === 'post' ? <MessageCircle size={12} /> : <MessageSquare size={12} />}
                        <span className="font-semibold">{a.type === 'post' ? 'Post' : 'Comment'}</span>
                        <span>·</span>
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-200 line-clamp-2">{a.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'message' && (
            <div>
              {msgSent ? (
                <div className="rounded-xl border border-green-400/20 bg-green-400/10 p-4 text-sm text-green-300 flex items-center gap-2 mb-4"><CheckCircle size={16} /> Message sent with ADMIN tag.</div>
              ) : null}
              <textarea value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Type your admin message... The message will be prefixed with [ADMIN]."
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/30 transition" rows={4} />
              <button onClick={sendAdminMessage} disabled={sendingMsg || !messageText.trim()}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 transition hover:-translate-y-0.5">
                {sendingMsg ? 'Sending...' : <><Mail size={14} /> Send as Admin</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── CREWS SECTION ─── */
const CrewsSection: React.FC<{ admin: AdminUser | null }> = ({ admin }) => {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);

  const fetchCrews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('crews').select('*').order('created_at', { ascending: false });
    if (data) {
      const withCounts = await Promise.all((data as Crew[]).map(async (crew) => {
        const { count } = await supabase.from('crew_members').select('*', { count: 'exact', head: true }).eq('crew_id', crew.id);
        return { ...crew, member_count: count || 0 };
      }));
      setCrews(withCounts);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCrews(); }, [fetchCrews]);

  const updateCrewStatus = async (id: string, status: string) => {
    await supabase.from('crews').update({ status }).eq('id', id);
    setCrews(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    if (selectedCrew?.id === id) setSelectedCrew({ ...selectedCrew, status });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Crews</h1>
          <p className="mt-1 text-sm text-slate-400">All crews across APRO.</p>
        </div>
        <button onClick={fetchCrews} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06]"><RefreshCw size={14} className="inline mr-1" /> Refresh</button>
      </div>

      {loading ? <SurfacePanel className="p-4 text-sm text-slate-400">Loading crews...</SurfacePanel> : crews.length === 0 ? <SurfacePanel className="p-4 text-sm text-slate-400">No crews found.</SurfacePanel> : (
        <div className="space-y-3">
          {crews.map(crew => (
            <button key={crew.id} onClick={() => setSelectedCrew(crew)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06] hover:border-violet-500/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-sm font-bold text-amber-300">
                    {(crew.name?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white">{crew.name}</div>
                    <div className="text-xs text-slate-500">Level {crew.level} · {crew.member_count || 0} members · {crew.status}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={crew.status as Crew['status']} />
                  <ChevronRight size={16} className="text-slate-500" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedCrew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c101a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedCrew.name}</h2>
                <p className="text-sm text-slate-400">Level {selectedCrew.level} · {selectedCrew.member_count || 0} members</p>
              </div>
              <button onClick={() => setSelectedCrew(null)} className="text-sm font-semibold text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <SurfacePanel className="p-4">
                <h4 className="text-sm font-bold text-white mb-2">Description</h4>
                <p className="text-sm text-slate-300">{selectedCrew.description || 'No description.'}</p>
              </SurfacePanel>
              <SurfacePanel className="p-4">
                <h4 className="text-sm font-bold text-white mb-2">Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Status</span><StatusBadge status={selectedCrew.status as Crew['status']} /></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Level</span><span className="text-white">{selectedCrew.level}</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Members</span><span className="text-white">{selectedCrew.member_count || 0}</span></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Prime ID</span><span className="text-white font-mono text-[11px]">{selectedCrew.prime_id?.slice(0, 12)}...</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Created</span><span className="text-white">{new Date(selectedCrew.created_at).toLocaleDateString()}</span></div>
                </div>
              </SurfacePanel>
              {selectedCrew.status === 'proposed' && (
                <div className="flex gap-3">
                  <button onClick={() => updateCrewStatus(selectedCrew.id, 'active')} className="rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"><CheckCircle size={14} className="inline mr-1" /> Approve Crew</button>
                  <button onClick={() => updateCrewStatus(selectedCrew.id, 'rejected')} className="rounded-full border border-red-400/20 px-5 py-2.5 text-xs font-bold text-red-300 hover:bg-red-400/10"><X size={14} className="inline mr-1" /> Reject</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls = status === 'active' ? 'bg-emerald-500/12 text-emerald-200 border-emerald-400/18'
    : status === 'proposed' ? 'bg-amber-500/12 text-amber-200 border-amber-400/18'
    : status === 'rejected' ? 'bg-red-500/12 text-red-200 border-red-400/18'
    : 'bg-slate-500/12 text-slate-200 border-slate-400/18';
  return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}>{status}</span>;
};

/* ─── MISSIONS SECTION ─── */
const MissionsSection: React.FC<{ admin: AdminUser | null }> = ({ admin }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('projects').select('id, title, visibility, owner_id, crew_id, created_at').order('created_at', { ascending: false }).limit(50);
    if (data) {
      setProjects(data as Project[]);
      const ids = [...new Set((data as Project[]).map(p => p.owner_id).filter(Boolean))];
      const names: Record<string, string> = {};
      await Promise.all(ids.map(async (id) => {
        try { names[id] = await getCachedDisplayName(id); } catch { names[id] = id.slice(0, 8); }
      }));
      setMemberNames(names);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Missions</h1>
          <p className="mt-1 text-sm text-slate-400">All projects across APRO.</p>
        </div>
        <button onClick={fetchProjects} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06]"><RefreshCw size={14} className="inline mr-1" /> Refresh</button>
      </div>

      {loading ? <SurfacePanel className="p-4 text-sm text-slate-400">Loading missions...</SurfacePanel> : projects.length === 0 ? <SurfacePanel className="p-4 text-sm text-slate-400">No missions found.</SurfacePanel> : (
        <div className="space-y-3">
          {projects.map(proj => (
            <button key={proj.id} onClick={() => setSelectedProject(proj)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:bg-white/[0.06] hover:border-violet-500/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-sm font-bold text-cyan-300">
                    {(proj.title?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">{proj.title}</div>
                    <div className="text-xs text-slate-500">by {memberNames[proj.owner_id] || proj.owner_id?.slice(0, 8) || 'Unknown'} · {proj.visibility}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <VisibilityBadge visibility={proj.visibility as Project['visibility']} />
                  <ChevronRight size={16} className="text-slate-500" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c101a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedProject.title}</h2>
                <p className="text-sm text-slate-400">by {memberNames[selectedProject.owner_id] || selectedProject.owner_id?.slice(0, 8) || 'Unknown'}</p>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-sm font-semibold text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <SurfacePanel className="p-4">
                <h4 className="text-sm font-bold text-white mb-2">Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Visibility</span><VisibilityBadge visibility={selectedProject.visibility as Project['visibility']} /></div>
                  <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Owner ID</span><span className="text-white font-mono text-[11px]">{selectedProject.owner_id?.slice(0, 12)}...</span></div>
                  {selectedProject.crew_id && <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-slate-400">Crew ID</span><span className="text-white font-mono text-[11px]">{selectedProject.crew_id?.slice(0, 12)}...</span></div>}
                  <div className="flex justify-between"><span className="text-slate-400">Created</span><span className="text-white">{new Date(selectedProject.created_at).toLocaleDateString()}</span></div>
                </div>
              </SurfacePanel>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VisibilityBadge: React.FC<{ visibility: string }> = ({ visibility }) => {
  const cls = visibility === 'public' ? 'bg-emerald-500/12 text-emerald-200 border-emerald-400/18'
    : visibility === 'missions' ? 'bg-amber-500/12 text-amber-200 border-amber-400/18'
    : 'bg-slate-500/12 text-slate-200 border-slate-400/18';
  return <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${cls}`}>{visibility}</span>;
};

/* ─── CERTIFICATIONS SECTION ─── */
const CertificationsSection: React.FC<{ admin: AdminUser | null }> = ({ admin }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'templates' | 'issued'>('templates');
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkForm, setBulkForm] = useState({ names: '', template_id: '' });
  const [bulkIssuing, setBulkIssuing] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateForm, setTemplateForm] = useState({ title: '', description: '', start_date: '', end_date: '', logo_url: '', remarks: '', invert_logo: false });
  const [issueForm, setIssueForm] = useState({ person_name: '', template_id: '', certification_id: '' });
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = `cert-logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('community_images').upload(path, file);
    if (error) { setMsg('Logo upload failed: ' + error.message); setLogoUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('community_images').getPublicUrl(path);
    setTemplateForm(prev => ({ ...prev, logo_url: publicUrl }));
    setLogoUploading(false);
    setMsg('Logo uploaded.');
    setTimeout(() => setMsg(''), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [tRes, cRes] = await Promise.all([
      supabase.from('certification_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('certifications').select('*, template:template_id(*)').order('issued_at', { ascending: false }),
    ]);
    if (!tRes.error) setTemplates(tRes.data || []);
    if (!cRes.error) setCerts(cRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveTemplate = async () => {
    if (!templateForm.title || !templateForm.start_date) return;
    setSaving(true);
    setMsg('');
    const payload = {
      ...templateForm,
      start_date: templateForm.start_date || null,
      end_date: templateForm.end_date || null,
      created_by: admin?.auth_id || '',
    };
    if (editTemplate) {
      const { error } = await supabase.from('certification_templates').update(payload).eq('id', editTemplate.id);
      if (error) setMsg(error.message); else { setMsg('Template updated.'); setShowTemplateForm(false); setEditTemplate(null); }
    } else {
      const { error } = await supabase.from('certification_templates').insert(payload);
      if (error) setMsg(error.message); else { setMsg('Template created.'); setShowTemplateForm(false); }
    }
    setSaving(false);
    await fetchData();
    setTimeout(() => setMsg(''), 3000);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template? Certifications using it will also be removed.')) return;
    await supabase.from('certification_templates').delete().eq('id', id);
    await fetchData();
  };

  const openEdit = (tpl: any) => {
    setEditTemplate(tpl);
    setTemplateForm({ title: tpl.title, description: tpl.description || '', start_date: tpl.start_date, end_date: tpl.end_date || '', logo_url: tpl.logo_url || '', remarks: tpl.remarks || '', invert_logo: tpl.invert_logo || false });
    setShowTemplateForm(true);
  };

  const issueCert = async () => {
    if (!issueForm.person_name.trim() || !issueForm.template_id) return;
    setSaving(true);
    setMsg('');
    const { data: idData, error: idErr } = await supabase.rpc('generate_certification_id');
    if (idErr) { setMsg('Failed to generate ID.'); setSaving(false); return; }
    const { error } = await supabase.from('certifications').insert({
      certification_id: idData, template_id: issueForm.template_id,
      person_name: issueForm.person_name.trim(), issued_by: admin?.auth_id || '',
    });
    if (error) setMsg(error.message); else { setMsg(`Certification issued. ID: ${idData}`); setIssueForm({ person_name: '', template_id: '', certification_id: '' }); setShowIssueForm(false); }
    setSaving(false);
    await fetchData();
    setTimeout(() => setMsg(''), 5000);
  };

  const deleteCert = async (id: string) => {
    if (!confirm('Revoke this certification?')) return;
    await supabase.from('certifications').delete().eq('id', id);
    await fetchData();
  };

  const bulkIssue = async () => {
    const names = bulkForm.names.split(',').map(n => n.trim()).filter(Boolean);
    if (names.length === 0 || !bulkForm.template_id) return;
    setBulkIssuing(true);
    setMsg('');
    let issued = 0;
    let failed = 0;
    for (const name of names) {
      const { data: idData, error: idErr } = await supabase.rpc('generate_certification_id');
      if (idErr) { failed++; continue; }
      const { error } = await supabase.from('certifications').insert({
        certification_id: idData, template_id: bulkForm.template_id,
        person_name: name, issued_by: admin?.auth_id || '',
      });
      if (error) failed++; else issued++;
    }
    setMsg(`Bulk issue complete: ${issued} issued${failed ? `, ${failed} failed` : ''}.`);
    setBulkIssuing(false);
    setBulkForm({ names: '', template_id: '' });
    setShowBulkForm(false);
    await fetchData();
    setTimeout(() => setMsg(''), 5000);
  };

  const exportCertsPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text('APRO Certifications', 14, 14);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`${certs.length} certification(s) issued`, 14, 20);
    doc.setTextColor(0);
    autoTable(doc, {
      head: [['#', 'Name', 'Certification ID', 'Template', 'Issued At']],
      body: certs.map((c, i) => [
        String(i + 1),
        c.person_name,
        c.certification_id,
        c.template?.title || 'Unknown',
        new Date(c.issued_at).toLocaleDateString(),
      ]),
      startY: 24,
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [76, 29, 149], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      margin: { left: 14, right: 14 },
    });
    doc.save('apro-certifications.pdf');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Certifications</h1>
          <p className="mt-1 text-sm text-slate-400">Manage templates and issue certifications.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditTemplate(null); setTemplateForm({ title: '', description: '', start_date: '', end_date: '', logo_url: '', remarks: '', invert_logo: false }); setShowTemplateForm(true); }} className="rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-4 py-2 text-xs font-semibold text-white"><Plus size={14} className="inline mr-1" /> New Template</button>
          <button onClick={() => setShowIssueForm(true)} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.06]"><Award size={14} className="inline mr-1" /> Issue</button>
          <button onClick={() => setShowBulkForm(true)} className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.06]"><ListChecks size={14} className="inline mr-1" /> Bulk Issue</button>
          <button onClick={exportCertsPdf} disabled={certs.length === 0}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.06] disabled:opacity-40"><Download size={14} className="inline mr-1" /> Export PDF</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('templates')} className={`px-4 py-2 rounded-full text-xs font-semibold transition ${tab === 'templates' ? 'bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white' : 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]'}`}>Templates ({templates.length})</button>
        <button onClick={() => setTab('issued')} className={`px-4 py-2 rounded-full text-xs font-semibold transition ${tab === 'issued' ? 'bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white' : 'border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]'}`}>Issued ({certs.length})</button>
      </div>

      {msg && <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{msg}</div>}

      {loading ? <SurfacePanel className="p-4 text-sm text-slate-400">Loading...</SurfacePanel> : tab === 'templates' ? (
        <div className="space-y-3">
          {templates.length === 0 ? <SurfacePanel className="p-4 text-sm text-slate-400">No templates yet.</SurfacePanel> :
            templates.map(tpl => (
              <SurfacePanel key={tpl.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {tpl.logo_url && <img src={tpl.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain bg-white/[0.04]" />}
                    <div className="min-w-0">
                      <div className="font-semibold text-white">{tpl.title}</div>
                      <div className="text-xs text-slate-500">{tpl.start_date}{tpl.end_date ? ` — ${tpl.end_date}` : ''}{tpl.remarks ? ` · "${tpl.remarks}"` : ''}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => openEdit(tpl)} className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-slate-300 hover:bg-white/[0.06]"><Edit3 size={12} className="inline mr-1" /> Edit</button>
                    <button onClick={() => deleteTemplate(tpl.id)} className="rounded-full border border-red-400/20 px-3 py-1.5 text-[10px] font-semibold text-red-300 hover:bg-red-400/10"><Trash2 size={12} className="inline mr-1" /> Delete</button>
                  </div>
                </div>
              </SurfacePanel>
            ))}
          {showTemplateForm && (
            <SurfacePanel className="p-5 mt-4">
              <h3 className="text-sm font-bold text-white mb-4">{editTemplate ? 'Edit Template' : 'New Template'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Title</label>
                  <input value={templateForm.title} onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Description (optional)</label>
                  <textarea value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1" rows={2} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Start Date</label>
                  <input type="date" value={templateForm.start_date} onChange={e => setTemplateForm({ ...templateForm, start_date: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">End Date (optional)</label>
                  <input type="date" value={templateForm.end_date} onChange={e => setTemplateForm({ ...templateForm, end_date: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Logo</label>
                  <div className="mt-1 flex items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 hover:bg-white/[0.06] transition">
                      <Upload size={14} />
                      {logoUploading ? 'Uploading...' : 'Upload Logo'}
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]); }} />
                    </label>
                    {templateForm.logo_url && (
                      <>
                        <img src={templateForm.logo_url} alt="" className="h-8 w-8 rounded object-contain bg-white/[0.06]" />
                        <button onClick={() => setTemplateForm({ ...templateForm, logo_url: '' })}
                          className="text-[10px] text-red-400 hover:text-red-300">Remove</button>
                      </>
                    )}
                  </div>
                  <input value={templateForm.logo_url} onChange={e => setTemplateForm({ ...templateForm, logo_url: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-400 outline-none focus:border-violet-500/30"
                    placeholder="Or paste an image URL..." />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Remarks by APRO (optional — shows between title and name on certificate)</label>
                  <textarea value={templateForm.remarks} onChange={e => setTemplateForm({ ...templateForm, remarks: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1" rows={2} placeholder="e.g. For demonstrating exceptional achievement in..." />
                </div>
                <div className="md:col-span-2 flex items-center gap-3 mt-2">
                  <input type="checkbox" id="invert_logo" checked={templateForm.invert_logo}
                    onChange={e => setTemplateForm({ ...templateForm, invert_logo: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-white/[0.04] accent-violet-600" />
                  <label htmlFor="invert_logo" className="text-[10px] uppercase tracking-[0.15em] text-slate-500 cursor-pointer">Invert logo colors for print</label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={saveTemplate} disabled={saving} className="rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">{saving ? 'Saving...' : <><Save size={14} className="inline mr-1" /> {editTemplate ? 'Update' : 'Create'}</>}</button>
                <button onClick={() => { setShowTemplateForm(false); setEditTemplate(null); }} className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-slate-300 hover:bg-white/[0.06]">Cancel</button>
              </div>
            </SurfacePanel>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {certs.length === 0 ? <SurfacePanel className="p-4 text-sm text-slate-400">No certifications issued yet.</SurfacePanel> :
            certs.map(c => (
              <SurfacePanel key={c.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                      <Award size={18} className="text-violet-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white">{c.person_name}</div>
                      <div className="text-xs text-slate-500">{c.template?.title || 'Unknown template'} · ID: {c.certification_id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`/certifications?id=${c.certification_id}`} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-slate-300 hover:bg-white/[0.06]"><ExternalLink size={12} className="inline mr-1" /> View</a>
                    <button onClick={() => deleteCert(c.id)} className="rounded-full border border-red-400/20 px-3 py-1.5 text-[10px] font-semibold text-red-300 hover:bg-red-400/10"><Trash2 size={12} /> </button>
                  </div>
                </div>
              </SurfacePanel>
            ))}
          {showIssueForm && (
            <SurfacePanel className="p-5 mt-4">
              <h3 className="text-sm font-bold text-white mb-4">Issue Certification</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Person Name</label>
                  <input value={issueForm.person_name} onChange={e => setIssueForm({ ...issueForm, person_name: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1" placeholder="Full name" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Template</label>
                  <select value={issueForm.template_id} onChange={e => setIssueForm({ ...issueForm, template_id: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1">
                    <option value="" className="bg-[#0c101a]">Select a template...</option>
                    {templates.map(t => <option key={t.id} value={t.id} className="bg-[#0c101a]">{t.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={issueCert} disabled={saving || !issueForm.person_name.trim() || !issueForm.template_id}
                  className="rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"><Award size={14} className="inline mr-1" /> {saving ? 'Issuing...' : 'Issue Certification'}</button>
                <button onClick={() => setShowIssueForm(false)} className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-slate-300 hover:bg-white/[0.06]">Cancel</button>
              </div>
            </SurfacePanel>
          )}
        </div>
      )}
      {showBulkForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c101a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h2 className="text-xl font-bold text-white">Bulk Issue Certifications</h2>
              <button onClick={() => setShowBulkForm(false)} className="text-sm font-semibold text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Names (comma separated)</label>
                <textarea value={bulkForm.names} onChange={e => setBulkForm({ ...bulkForm, names: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1" rows={5}
                  placeholder="John Doe, Jane Smith, Bob Johnson" />
                <p className="mt-1 text-xs text-slate-500">{bulkForm.names.split(',').map(n => n.trim()).filter(Boolean).length} name(s) detected</p>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Template</label>
                <select value={bulkForm.template_id} onChange={e => setBulkForm({ ...bulkForm, template_id: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1">
                  <option value="" className="bg-[#0c101a]">Select a template...</option>
                  {templates.map(t => <option key={t.id} value={t.id} className="bg-[#0c101a]">{t.title}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-white/10 p-6">
              <button onClick={bulkIssue} disabled={bulkIssuing || !bulkForm.names.trim() || !bulkForm.template_id}
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">
                {bulkIssuing ? <><Loader2 size={14} className="animate-spin" /> Issuing...</> : <><ListChecks size={14} /> Issue All</>}
              </button>
              <button onClick={() => setShowBulkForm(false)} className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-slate-300 hover:bg-white/[0.06]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

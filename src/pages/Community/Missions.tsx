import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Rocket, FileText, ChevronRight, Loader2, Globe, Radio, Satellite, Mail, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CommunityNavbar } from '../../components/Community/CommunityNavbar';
import { ProjectDetail } from '../../components/Community/ProjectDetail';
import { fetchCrewProjects, fetchUserProjects, fetchPublicProjects, createProject, fetchFollowedCrews, fetchFollowedProjects, isTrackingProject, fetchUserInvites, respondToInvite, fetchProject } from '../../lib/missions-api';
import { fetchUserCrew } from '../../lib/crew-api';
import type { Project, TrackedProject, ProjectInvite } from '../../lib/missions-types';

const Missions = () => {
  const location = useLocation();
  const [userId, setUserId] = useState<string | undefined>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [myCrews, setMyCrews] = useState<{ id: string; name: string }[]>([]);
  const [myCrewId, setMyCrewId] = useState<string | undefined>();
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [trackedProjects, setTrackedProjects] = useState<TrackedProject[]>([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const session = await supabase.auth.getSession();
      const uid = session.data.session?.user?.id;
      setUserId(uid);
      if (!uid) { setLoading(false); return; }

      // Get user's crews
      const crew = await fetchUserCrew(uid);
      if (crew) setMyCrewId(crew.id);
      const followedCrewIds = await fetchFollowedCrews(uid);
      const crewIds = new Set<string>();
      if (crew) crewIds.add(crew.id);
      for (const cid of followedCrewIds) crewIds.add(cid);

      // Fetch crew names
      const crews: { id: string; name: string }[] = [];
      if (crewIds.size > 0) {
        const { data: crewsData } = await supabase
          .from('crews')
          .select('id, name')
          .in('id', [...crewIds]);
        if (crewsData) {
          for (const c of crewsData) crews.push(c);
        }
      }
      setMyCrews(crews);

      // Fetch projects
      const allProjects: Project[] = [];
      for (const c of crews) {
        const cp = await fetchCrewProjects(c.id);
        for (const p of cp) allProjects.push(p);
      }
      const up = await fetchUserProjects(uid);
      for (const p of up) allProjects.push(p);
      // Deduplicate
      const seen = new Set<string>();
      const unique = allProjects.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
      setProjects(unique);
      // Fetch public projects from other users
      const publicP = await fetchPublicProjects();
      const ownIds = new Set(unique.map(p => p.id));
      setPublicProjects(publicP.filter(p => !ownIds.has(p.id)));
      // Fetch tracked projects
      const tracked = await fetchFollowedProjects(uid);
      setTrackedProjects(tracked.filter(t => !ownIds.has(t.id)));
      // Fetch pending invites
      const userInvites = await fetchUserInvites(uid);
      setInvites(userInvites);
      // Handle incoming navigation from feed (project post click)
      const navState = (location as any).state as { openProjectPostId?: string } | null;
      if (navState?.openProjectPostId) {
        try {
          const { data: pp } = await supabase
            .from('project_posts')
            .select('project_id')
            .eq('id', navState.openProjectPostId)
            .maybeSingle();
          if (pp) {
            const project = await fetchProject(pp.project_id);
            if (project) { setSelectedProject(project); }
          }
        } catch (e) { console.error('Failed to open mission post from feed', e); }
        // Clear the state so it doesn't re-trigger
        window.history.replaceState({}, document.title);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !selectedOwner || !userId) return;
    setCreating(true);
    try {
      const isCrew = selectedOwner.startsWith('crew_');
      const ownerId = selectedOwner.replace('crew_', '');
      const project = await createProject(newName.trim(), newDesc.trim(), isCrew ? 'crew' : 'user', isCrew ? ownerId : userId);
      setProjects(prev => [project, ...prev]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      setSelectedOwner('');
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setResponding(inviteId);
    try {
      await respondToInvite(inviteId, accept);
      setInvites(prev => prev.filter(i => i.id !== inviteId));
      // Refetch projects to include newly joined ones
      if (userId) {
        const up = await fetchUserProjects(userId);
        const crew = await fetchUserCrew(userId);
        const allP: Project[] = [...up];
        if (crew) {
          const cp = await fetchCrewProjects(crew.id);
          allP.push(...cp);
        }
        const seen = new Set<string>();
        setProjects(allP.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; }));
      }
    } catch (err) {
      console.error('Failed to respond to invite', err);
    } finally {
      setResponding(null);
    }
  };

  if (selectedProject) {
    const isAdmin = selectedProject.owner_type === 'crew'
      ? myCrews.some(c => c.id === selectedProject.owner_id)
      : selectedProject.owner_id === userId;
    const isMember = selectedProject.owner_type === 'crew'
      ? selectedProject.owner_id === myCrewId
      : selectedProject.owner_id === userId;
    const handleBack = async () => {
      setSelectedProject(null);
      if (userId) {
        const tracked = await fetchFollowedProjects(userId);
        const ownIds = new Set(projects.map(p => p.id));
        setTrackedProjects(tracked.filter(t => !ownIds.has(t.id)));
      }
    };
    return (
      <div className="min-h-screen bg-[#05070d]">
        <CommunityNavbar />
        <div className="max-w-2xl mx-auto px-4 pb-20 lg:pb-8 pt-4">
            <ProjectDetail
              project={selectedProject}
              userId={userId}
              isAdmin={isAdmin}
              isMember={isMember}
              onBack={handleBack}
              initialPostId={(location.state as any)?.openProjectPostId}
              onUpdated={(updated) => {
              setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
              setTrackedProjects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } as TrackedProject : p));
              setSelectedProject(updated);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070d]">
      <CommunityNavbar />
      <div className="max-w-2xl mx-auto px-4 pb-20 lg:pb-8">
        <div className="pt-4 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center">
              <Globe size={20} className="text-amber-400" />
            </div>
            <h1 className="text-lg font-bold text-white">Missions</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">Track projects, stages, milestones, and progress.</p>
        </div>

        {userId && (
          <div className="mb-4">
            {showCreate ? (
              <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Project name"
                  className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none mb-2"
                />
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full bg-transparent text-xs text-slate-400 placeholder-slate-600 outline-none resize-none mb-3"
                />
                <select
                  value={selectedOwner}
                  onChange={e => setSelectedOwner(e.target.value)}
                  className="w-full bg-[#0f1120] text-xs text-slate-300 border border-white/10 rounded-lg p-2 mb-3 outline-none [color-scheme:dark]"
                >
                  <option value="">Select owner...</option>
                  <option value={`user_${userId}`}>Personal Project</option>
                  {myCrews.map(c => (
                    <option key={c.id} value={`crew_${c.id}`}>{c.name} (Crew)</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim() || !selectedOwner || creating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-xs font-bold text-white transition-all"
                  >
                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                  <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-sm font-bold text-white transition-all"
              >
                <Plus size={16} />
                New Project
              </button>
            )}
          </div>
        )}

        {invites.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Mail size={13} className="text-amber-400" />
              Pending Invitations
            </h3>
            <div className="space-y-2">
              {invites.map(inv => (
                <div key={inv.id} className="rounded-2xl border border-amber-500/10 bg-[#0f1120]/80 backdrop-blur-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{inv.project_name || 'Unknown Project'}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Invited by {inv.inviter_name || 'someone'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRespond(inv.id, true)}
                        disabled={responding === inv.id}
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-40"
                      >
                        {responding === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                      <button
                        onClick={() => handleRespond(inv.id, false)}
                        disabled={responding === inv.id}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-40"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <Rocket size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm text-slate-500">No projects yet</p>
            {!userId && <p className="text-xs text-slate-600 mt-1">Login to create or join projects.</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="w-full rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 hover:border-white/20 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{project.name}</h3>
                    {project.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{project.description}</p>
                    )}
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {project.owner_type === 'crew' ? 'Crew project' : 'Personal project'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}

        {trackedProjects.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3 flex items-center gap-1.5">
              <Satellite size={13} className="text-cyan-400" />
              Tracked Projects
            </h3>
            <div className="space-y-2">
              {trackedProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="w-full rounded-2xl border border-cyan-500/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 hover:border-cyan-500/30 transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <Radio size={18} className="text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{project.name}</h3>
                      {project.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{project.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                      <span className="text-[10px] font-bold text-cyan-400">{project.new_posts}</span>
                      <span className="text-[10px] text-slate-500">new</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${project.progress_pct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{project.progress_pct}%</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {publicProjects.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3">Discover Public Missions</h3>
            <div className="space-y-2">
              {publicProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 hover:border-white/20 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center shrink-0">
                      <Globe size={18} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{project.name}</h3>
                      {project.description && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{project.description}</p>
                      )}
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {project.owner_type === 'crew' ? 'Crew project' : 'Personal project'} · Public
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Missions;

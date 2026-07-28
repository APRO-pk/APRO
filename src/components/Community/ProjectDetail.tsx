import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Plus, Check, Circle, Loader2, Globe, Lock, Eye, Rocket, Send, ImagePlus, X, ChevronDown, ChevronRight, Settings as SettingsIcon, Users, Logs, Flame, Zap, MessageCircle, Repeat2, Trash2, Radio } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchPhases, createPhase, updatePhase, fetchMilestones, createMilestone, fetchChecklistItems, createChecklistItem, toggleChecklistItem, deleteChecklistItem, fetchProjectFeed, createProjectPost, getMilestoneProgress, getPhaseProgress, updateProject, fetchProjectMembers, removeProjectMember, deleteProjectPost, isTrackingProject, toggleProjectFollow, inviteToProject, fetchProjectInvites, cancelInvite } from '../../lib/missions-api';
import type { Project, ProjectPhase, ProjectMilestone, MilestoneChecklistItem, ProjectPost, ProjectMember, ProjectInvite } from '../../lib/missions-types';
import { PostDetail } from './PostDetail';
import { ImageGrid } from './ImageGrid';

interface Props {
  project: Project;
  userId?: string;
  isAdmin: boolean;
  isMember: boolean;
  onBack: () => void;
  onUpdated: (project: Project) => void;
  initialPostId?: string;
}

export function ProjectDetail({ project, userId, isAdmin, isMember, onBack, onUpdated, initialPostId }: Props) {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [milestones, setMilestones] = useState<Record<string, ProjectMilestone[]>>({});
  const [checklists, setChecklists] = useState<Record<string, MilestoneChecklistItem[]>>({});
  const [progress, setProgress] = useState<Record<string, { done: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  // Phase creation
  const [showNewPhase, setShowNewPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseDeadline, setNewPhaseDeadline] = useState('');

  // Milestone creation
  const [newMilestonePhase, setNewMilestonePhase] = useState<string | null>(null);
  const [newMilestoneName, setNewMilestoneName] = useState('');

  // Checklist item creation
  const [newChecklistMilestone, setNewChecklistMilestone] = useState<string | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Feed
  const [posts, setPosts] = useState<ProjectPost[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postPhase, setPostPhase] = useState('');
  const [postMilestone, setPostMilestone] = useState('');
  const [postVisibility, setPostVisibility] = useState<'private' | 'missions' | 'public'>('missions');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded sections
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  // Post Detail
  const [selectedPost, setSelectedPost] = useState<ProjectPost | null>(null);

  // Tracking
  const [tracking, setTracking] = useState(false);
  const [togglingTrack, setTogglingTrack] = useState(false);

  // Settings / Members
  const [activeTab, setActiveTab] = useState<'stages' | 'log' | 'settings'>(isMember ? 'stages' : 'log');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [editName, setEditName] = useState(project.name);
  const [editDesc, setEditDesc] = useState(project.description);
  const [editVisibility, setEditVisibility] = useState(project.visibility || 'missions');
  const [saving, setSaving] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [inviteUsername, setInviteUsername] = useState('');

  const loadData = async () => {
    const p = await fetchPhases(project.id);
    setPhases(p);
    const mMap: Record<string, ProjectMilestone[]> = {};
    const cMap: Record<string, MilestoneChecklistItem[]> = {};
    const prMap: Record<string, { done: number; total: number }> = {};
    for (const phase of p) {
      const ms = await fetchMilestones(phase.id);
      mMap[phase.id] = ms;
      for (const m of ms) {
        const ci = await fetchChecklistItems(m.id);
        cMap[m.id] = ci;
        prMap[m.id] = await getMilestoneProgress(m.id);
      }
      prMap[`phase_${phase.id}`] = await getPhaseProgress(phase.id);
    }
    setMilestones(mMap);
    setChecklists(cMap);
    setProgress(prMap);
    setLoading(false);
  };

  const loadFeed = async () => {
    setFeedLoading(true);
    try {
      const p = await fetchProjectFeed(project.id, userId);
      setPosts(p);
    } catch (err) {
      console.error('Failed to load feed', err);
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadFeed();
  }, [project.id]);

  // Open initial post if provided
  useEffect(() => {
    if (!initialPostId || posts.length === 0) return;
    const found = posts.find(p => p.id === initialPostId);
    if (found) {
      setSelectedPost(found);
      setActiveTab('log');
    }
  }, [initialPostId, posts]);

  const loadMembers = async () => {
    try {
      const m = await fetchProjectMembers(project.id);
      setMembers(m);
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'settings') { loadMembers(); loadInvites(); }
  }, [activeTab]);

  // Check tracking status
  useEffect(() => {
    if (!userId) return;
    isTrackingProject(userId, project.id).then(setTracking).catch(() => {});
  }, [userId, project.id]);

  const handleToggleTrack = async () => {
    if (!userId) return;
    setTogglingTrack(true);
    try {
      const nowTracking = await toggleProjectFollow(userId, project.id);
      setTracking(nowTracking);
    } catch (err) {
      console.error('Failed to toggle tracking', err);
    } finally {
      setTogglingTrack(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateProject(project.id, { name: editName.trim(), description: editDesc.trim(), visibility: editVisibility });
      onUpdated({ ...project, name: editName.trim(), description: editDesc.trim(), visibility: editVisibility as Project['visibility'] });
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteUsername.trim() || !userId) return;
    setAddingMember(true);
    try {
      const result = await inviteToProject(project.id, userId, inviteUsername.trim());
      if (!result.userId) {
        console.warn('User not found');
        return;
      }
      setInviteUsername('');
      await loadInvites();
    } catch (err) {
      console.error('Failed to invite member', err);
    } finally {
      setAddingMember(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await cancelInvite(inviteId);
      await loadInvites();
    } catch (err) {
      console.error('Failed to cancel invite', err);
    }
  };

  const loadInvites = async () => {
    try {
      const i = await fetchProjectInvites(project.id);
      setInvites(i);
    } catch {}
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeProjectMember(project.id, userId);
      await loadMembers();
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  const handleCreatePhase = async () => {
    if (!newPhaseName.trim()) return;
    const nextOrder = phases.length;
    await createPhase(project.id, newPhaseName.trim(), nextOrder, newPhaseDeadline || undefined);
    setNewPhaseName('');
    setNewPhaseDeadline('');
    setShowNewPhase(false);
    await loadData();
  };

  const handleCompletePhase = async (phase: ProjectPhase) => {
    await updatePhase(phase.id, { completed: !phase.completed });
    await loadData();
  };

  const handleCreateMilestone = async (phaseId: string) => {
    if (!newMilestoneName.trim()) return;
    await createMilestone(phaseId, newMilestoneName.trim());
    setNewMilestoneName('');
    setNewMilestonePhase(null);
    await loadData();
  };

  const handleCreateChecklist = async (milestoneId: string) => {
    if (!newChecklistText.trim()) return;
    await createChecklistItem(milestoneId, newChecklistText.trim());
    setNewChecklistText('');
    setNewChecklistMilestone(null);
    await loadData();
  };

  const handleToggleChecklist = async (item: MilestoneChecklistItem) => {
    await toggleChecklistItem(item.id, !item.completed);
    await loadData();
  };

  const handleDeleteChecklist = async (itemId: string) => {
    await deleteChecklistItem(itemId);
    await loadData();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `project_posts/${project.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('community_images').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('community_images').getPublicUrl(path);
      setPostImages(prev => [...prev, publicUrl]);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmitPost = async () => {
    if (!userId || !postContent.trim() || !postPhase || !postMilestone) return;
    setSubmitting(true);
    try {
      const post = await createProjectPost(project.id, userId, postContent.trim(), postImages, postPhase, postMilestone, postVisibility);
      setPosts(prev => [post, ...prev]);
      setPostContent('');
      setPostImages([]);
      setPostPhase('');
      setPostMilestone('');
      setPostVisibility('missions');
      setShowComposer(false);
    } catch (err) {
      console.error('Failed to create post', err);
    } finally {
      setSubmitting(false);
    }
  };

  const availableMilestones = postPhase ? milestones[postPhase] || [] : [];
  const totalProgress = phases.length > 0
    ? phases.reduce((acc, p) => {
        const pr = progress[`phase_${p.id}`];
        return { done: acc.done + (pr?.done || 0), total: acc.total + (pr?.total || 1) };
      }, { done: 0, total: 0 })
    : { done: 0, total: 1 };
  const progressPct = Math.round((totalProgress.done / totalProgress.total) * 100);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <button onClick={onBack} className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white truncate">{project.name}</h2>
            {userId && project.visibility === 'public' && (
              <button
                onClick={handleToggleTrack}
                disabled={togglingTrack}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  tracking
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:border-cyan-500/30 hover:text-cyan-400'
                }`}
              >
                <Radio size={12} />
                {togglingTrack ? '...' : tracking ? 'Tracking' : 'Track'}
              </button>
            )}
          </div>
          {project.description && <p className="text-xs text-slate-500 truncate">{project.description}</p>}
        </div>
      </div>

      {/* Rocket Progress Bar */}
      <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Rocket size={16} className="text-cyan-400" />
          <span className="text-xs font-semibold text-slate-400">Progress</span>
          <span className="text-xs text-slate-500 ml-auto">{progressPct}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-white/5">
        {isMember && (
          <button onClick={() => setActiveTab('stages')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all border-b-2 ${activeTab === 'stages' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
            <Rocket size={14} />
            Stages
          </button>
        )}
        <button onClick={() => setActiveTab('log')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all border-b-2 ${activeTab === 'log' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
          <Logs size={14} />
          Log
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all border-b-2 ${activeTab === 'settings' ? 'text-cyan-400 border-cyan-400' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
            <SettingsIcon size={14} />
            Settings
          </button>
        )}
      </div>

      {/* Stages Tab */}
      {activeTab === 'stages' && (
        <div className="space-y-2 mb-4">
          {phases.map(phase => (
          <div key={phase.id} className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm overflow-hidden">
            <button
              onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              {expandedPhase === phase.id ? <ChevronDown size={16} className="text-slate-500 shrink-0" /> : <ChevronRight size={16} className="text-slate-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{phase.name}</span>
                  {phase.completed && <Check size={14} className="text-green-400" />}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500">
                  {phase.start_date && <span>Started {new Date(phase.start_date).toLocaleDateString()}</span>}
                  {phase.deadline && <span>Deadline {new Date(phase.deadline).toLocaleDateString()}</span>}
                </div>
              </div>
              {isAdmin && !phase.completed && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCompletePhase(phase); }}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors"
                >
                  Complete
                </button>
              )}
            </button>

            {expandedPhase === phase.id && (
              <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                {/* Milestones */}
                {(milestones[phase.id] || []).map(m => (
                  <div key={m.id} className="pl-3 border-l-2 border-cyan-500/30">
                    <button
                      onClick={() => setExpandedMilestone(expandedMilestone === m.id ? null : m.id)}
                      className="w-full flex items-center gap-2 text-left"
                    >
                      {expandedMilestone === m.id ? <ChevronDown size={12} className="text-slate-500 shrink-0" /> : <ChevronRight size={12} className="text-slate-500 shrink-0" />}
                      <span className="text-xs font-semibold text-slate-300">{m.name}</span>
                      {progress[m.id] && progress[m.id].total > 0 && (
                        <span className="text-[10px] text-slate-500 ml-auto">{progress[m.id].done}/{progress[m.id].total}</span>
                      )}
                    </button>

                    {expandedMilestone === m.id && (
                      <div className="mt-2 space-y-1 pl-4">
                        {m.description && <p className="text-[10px] text-slate-500">{m.description}</p>}

                        {/* Checklist Items */}
                        {(checklists[m.id] || []).map(item => (
                          <div key={item.id} className="flex items-center gap-2 py-1">
                            <button onClick={() => handleToggleChecklist(item)} className="shrink-0">
                              {item.completed ? (
                                <Check size={12} className="text-green-400" />
                              ) : (
                                <Circle size={12} className="text-slate-600" />
                              )}
                            </button>
                            <span className={`text-[11px] ${item.completed ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                              {item.text}
                            </span>
                            {isAdmin && (
                              <button onClick={() => handleDeleteChecklist(item.id)} className="ml-auto text-slate-600 hover:text-red-400">
                                <X size={10} />
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Add Checklist Item */}
                        {isAdmin && !phase.completed && (
                          newChecklistMilestone === m.id ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                value={newChecklistText}
                                onChange={e => setNewChecklistText(e.target.value)}
                                placeholder="Checklist item..."
                                className="flex-1 bg-transparent text-[11px] text-slate-300 placeholder-slate-600 outline-none border-b border-white/10 pb-0.5"
                                onKeyDown={e => e.key === 'Enter' && handleCreateChecklist(m.id)}
                              />
                              <button onClick={() => handleCreateChecklist(m.id)} disabled={!newChecklistText.trim()} className="p-1 text-cyan-400 disabled:text-slate-600">
                                <Plus size={12} />
                              </button>
                              <button onClick={() => { setNewChecklistMilestone(null); setNewChecklistText(''); }} className="p-1 text-slate-600">
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setNewChecklistMilestone(m.id)}
                              className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-cyan-400 mt-1"
                            >
                              <Plus size={10} /> Add item
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Milestone */}
                {isAdmin && !phase.completed && (
                  newMilestonePhase === phase.id ? (
                    <div className="flex items-center gap-1 pl-3">
                      <input
                        value={newMilestoneName}
                        onChange={e => setNewMilestoneName(e.target.value)}
                        placeholder="Milestone name..."
                        className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none border-b border-white/10 pb-0.5"
                        onKeyDown={e => e.key === 'Enter' && handleCreateMilestone(phase.id)}
                      />
                      <button onClick={() => handleCreateMilestone(phase.id)} disabled={!newMilestoneName.trim()} className="p-1 text-cyan-400 disabled:text-slate-600">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => { setNewMilestonePhase(null); setNewMilestoneName(''); }} className="p-1 text-slate-600">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewMilestonePhase(phase.id)}
                      className="flex items-center gap-1 text-xs text-slate-600 hover:text-cyan-400 pl-3"
                    >
                      <Plus size={12} /> Add milestone
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}

        {/* Add Phase */}
        {isAdmin && (
          showNewPhase ? (
            <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4">
              <input
                value={newPhaseName}
                onChange={e => setNewPhaseName(e.target.value)}
                placeholder="Phase name"
                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none mb-2"
                onKeyDown={e => e.key === 'Enter' && handleCreatePhase()}
              />
              <input
                type="datetime-local"
                value={newPhaseDeadline}
                onChange={e => setNewPhaseDeadline(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-400 outline-none mb-3 [color-scheme:dark]"
              />
              <div className="flex gap-2">
                <button onClick={handleCreatePhase} disabled={!newPhaseName.trim()} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-xs font-bold text-white transition-all">
                  Add Stage
                </button>
                <button onClick={() => setShowNewPhase(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewPhase(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/10 hover:border-cyan-500/30 text-sm font-semibold text-slate-500 hover:text-cyan-400 transition-all w-full justify-center"
            >
              <Plus size={16} />
              Add Stage
            </button>
          )
        )}
      </div>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
      <>
      {/* Feed */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-400">Mission Log</h3>
        {isMember && (
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-[10px] font-bold text-white transition-all"
          >
            <Plus size={12} />
            New Log
          </button>
        )}
      </div>

      {/* Post Composer */}
      {showComposer && (
        <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 mb-4">
          <textarea
            value={postContent}
            onChange={e => setPostContent(e.target.value.slice(0, 1000))}
            placeholder="What's new on this mission?"
            rows={3}
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none resize-none"
          />

          {/* Phase selector */}
          <select
            value={postPhase}
            onChange={e => { setPostPhase(e.target.value); setPostMilestone(''); }}
            className="w-full bg-[#0f1120] text-xs text-slate-300 border border-white/10 rounded-lg p-2 mt-2 outline-none [color-scheme:dark]"
          >
            <option value="">Select phase...</option>
            {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          {/* Milestone selector */}
          <select
            value={postMilestone}
            onChange={e => setPostMilestone(e.target.value)}
            disabled={!postPhase}
            className="w-full bg-[#0f1120] text-xs text-slate-300 border border-white/10 rounded-lg p-2 mt-2 outline-none disabled:opacity-40 [color-scheme:dark]"
          >
            <option value="">Select milestone...</option>
            {availableMilestones.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          {/* Visibility */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setPostVisibility('private')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${postVisibility === 'private' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-slate-500'}`}
            >
              <Lock size={10} /> Private
            </button>
            <button
              onClick={() => setPostVisibility('missions')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${postVisibility === 'missions' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-500'}`}
            >
              <Eye size={10} /> Missions
            </button>
            <button
              onClick={() => setPostVisibility('public')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${postVisibility === 'public' ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-slate-500'}`}
            >
              <Globe size={10} /> Public
            </button>
          </div>

          {/* Images */}
          {postImages.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {postImages.map((url, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-white/[0.02]">
                    <img src={url} alt="" className="w-full h-full object-contain" />
                  <button onClick={() => setPostImages(prev => prev.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || postImages.length >= 12}
                className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all disabled:opacity-30"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowComposer(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
              <button onClick={handleSubmitPost} disabled={!postContent.trim() || !postPhase || !postMilestone || submitting} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-xs font-bold text-white transition-all">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Posts */}
      {/* Post Detail */}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          userId={userId}
          onBack={() => setSelectedPost(null)}
          onDeleted={(postId) => {
            setPosts(prev => prev.filter(p => p.id !== postId));
          }}
        />
      )}

      {!selectedPost && (
      <>
      {feedLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xs text-slate-500">No mission logs yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(post => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="w-full text-left rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{post.phase_name}</span>
                <span className="text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">{post.milestone_name}</span>
                {post.checklist_text && <span className="text-[10px] text-slate-500">— {post.checklist_text}</span>}
                {post.visibility === 'private' && <Lock size={10} className="text-red-400" />}
                {post.visibility === 'public' && <Globe size={10} className="text-green-400" />}
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap line-clamp-3">{post.content}</p>
              {post.images && post.images.length > 0 && (
                <div className="mt-2">
                  <ImageGrid images={post.images} />
                </div>
              )}
              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span>{post.author_name || 'Unknown'}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 ml-auto text-[10px] text-slate-600">
                  <span className="flex items-center gap-1"><Flame size={10} />{post.ignite_count || 0}</span>
                  <span className="flex items-center gap-1"><Zap size={10} />{post.abort_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={10} />{post.comment_count || 0}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      </>)}
      </>)}
      
      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Name */}
          <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
              maxLength={100}
            />
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-3 mb-1.5 block">Description</label>
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              rows={2}
              className="w-full bg-transparent text-xs text-slate-400 placeholder-slate-600 outline-none resize-none"
              maxLength={500}
            />
          </div>

          {/* Visibility */}
          <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Visibility</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setEditVisibility('public')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${editVisibility === 'public' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-slate-500 border border-transparent hover:bg-white/10'}`}
              >
                <Globe size={14} />
                <div className="text-left">
                  <div>Public</div>
                  <div className="text-[10px] font-normal text-slate-500">Visible to everyone</div>
                </div>
              </button>
              <button
                onClick={() => setEditVisibility('missions')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${editVisibility === 'missions' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-500 border border-transparent hover:bg-white/10'}`}
              >
                <Eye size={14} />
                <div className="text-left">
                  <div>Missions</div>
                  <div className="text-[10px] font-normal text-slate-500">Visible to members and crew</div>
                </div>
              </button>
              <button
                onClick={() => setEditVisibility('private')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${editVisibility === 'private' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-slate-500 border border-transparent hover:bg-white/10'}`}
              >
                <Lock size={14} />
                <div className="text-left">
                  <div>Private</div>
                  <div className="text-[10px] font-normal text-slate-500">Only project members</div>
                </div>
              </button>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSaveSettings}
            disabled={saving || !editName.trim()}
            className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-xs font-bold text-white transition-all"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {/* Members */}
          <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Members ({members.length})</span>
            </div>
            <div className="space-y-1.5">
              {members.map(m => (
                <div key={m.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {(m.display_name || m.user_id)[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-300 min-w-0 truncate">{m.display_name || m.user_id}</span>
                  <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded ${m.role === 'admin' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 bg-white/5'}`}>
                    {m.role}
                  </span>
                  {m.user_id !== userId && (
                    <button onClick={() => handleRemoveMember(m.user_id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {/* Pending Invites */}
            {invites.filter(i => i.status === 'pending').length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Pending Invites</span>
                <div className="space-y-1.5">
                  {invites.filter(i => i.status === 'pending').map(inv => (
                    <div key={inv.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02]">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
                        {(inv.user_name || inv.user_id)[0].toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-400">{inv.user_name || inv.user_id.slice(0, 8)}</span>
                      <span className="text-[10px] text-amber-400 ml-auto bg-amber-500/10 px-1.5 py-0.5 rounded">pending</span>
                      <button onClick={() => handleCancelInvite(inv.id)} className="p-1 text-slate-600 hover:text-red-400">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Invite by Username */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
              <input
                value={inviteUsername}
                onChange={e => setInviteUsername(e.target.value)}
                placeholder="Username to invite..."
                className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
                onKeyDown={e => e.key === 'Enter' && handleInviteMember()}
              />
              <button
                onClick={handleInviteMember}
                disabled={!inviteUsername.trim() || addingMember}
                className="px-2 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-500/40 disabled:opacity-40 text-[10px] font-semibold text-cyan-400 transition-all"
              >
                {addingMember ? <Loader2 size={12} className="animate-spin" /> : 'Invite'}
              </button>
            </div>
            {inviteUsername.trim() && !addingMember && (
              <p className="text-[10px] text-slate-600 mt-1">Enter the username to send an invite. They must accept before joining.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowBigUp, ArrowBigDown, Bug, Lightbulb, MessageSquare,
  Plus, CheckCircle, XCircle, Archive, Merge, Award,
  ChevronDown, ChevronRight, Clock
} from "lucide-react";
import { supabase } from "../src/lib/supabase";
import {
  PageHero, PageScaffold, SectionBand, SurfacePanel,
  GhostButton, formInputClass, formLabelClass
} from "../components/PageScaffold";

type FeatureRequest = {
  id: number;
  user_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  admin_reason: string;
  merged_into_id: number | null;
  created_at: string;
  updated_at: string;
};

type FeatureVote = {
  id: number;
  feature_id: number;
  user_id: string;
  vote_type: "up" | "down";
};

type BugReport = {
  id: number;
  user_id: string;
  title: string;
  description: string;
  status: string;
  duplicate_of_id: number | null;
  admin_note: string;
  created_at: string;
  updated_at: string;
};

type TabId = "active" | "declined" | "archived" | "candidates" | "bugs";

const TABS: { id: TabId; label: string }[] = [
  { id: "active", label: "Active Features" },
  { id: "declined", label: "Declined" },
  { id: "archived", label: "Archived" },
  { id: "candidates", label: "Candidates" },
  { id: "bugs", label: "Bugs" },
];

const categoryOptions = ["Uncategorized", "Software", "Platform Experience", "Module / Option"];

const FeedbackHub: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [votes, setVotes] = useState<FeatureVote[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeatureForm, setShowFeatureForm] = useState(false);
  const [showBugForm, setShowBugForm] = useState(false);
  const [expandedMerge, setExpandedMerge] = useState<number | null>(null);
  const [featureForm, setFeatureForm] = useState({ title: "", description: "", category: "Uncategorized" });
  const [bugForm, setBugForm] = useState({ title: "", description: "" });
  const [submitMsg, setSubmitMsg] = useState({ type: "", text: "" });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [featRes, voteRes, bugRes] = await Promise.all([
        supabase.from("feature_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("feature_votes").select("*"),
        supabase.from("bug_reports").select("*").order("created_at", { ascending: false }),
      ]);
      if (!featRes.error) setFeatures(featRes.data || []);
      if (!voteRes.error) setVotes(voteRes.data || []);
      if (!bugRes.error) setBugs(bugRes.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getVoteCounts = (featureId: number) => {
    const fVotes = votes.filter(v => v.feature_id === featureId);
    const up = fVotes.filter(v => v.vote_type === "up").length;
    const down = fVotes.filter(v => v.vote_type === "down").length;
    return { up, down, total: up - down };
  };

  const getUserVote = (featureId: number) => {
    return votes.find(v => v.feature_id === featureId && v.user_id === user?.id)?.vote_type || null;
  };

  const handleVote = async (featureId: number, voteType: "up" | "down") => {
    if (!user) return;
    const existing = votes.find(v => v.feature_id === featureId && v.user_id === user.id);
    if (existing) {
      if (existing.vote_type === voteType) return;
      await supabase.from("feature_votes").update({ vote_type: voteType }).eq("id", existing.id);
    } else {
      await supabase.from("feature_votes").insert({ feature_id: featureId, user_id: user.id, vote_type: voteType });
    }
    fetchData();
  };

  const checkCooldown = async () => {
    if (!user) return;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("feature_requests")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", twentyFourHoursAgo);
    if (data && data.length > 0) {
      setCooldown(data.length);
      return true;
    }
    return false;
  };

  const handleSubmitFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg({ type: "", text: "" });
    if (!user) { setSubmitMsg({ type: "error", text: "Please log in to submit a feature request." }); return; }
    const onCooldown = await checkCooldown();
    if (onCooldown) { setSubmitMsg({ type: "error", text: "You can only submit one feature request per 24 hours." }); return; }
    const { error } = await supabase.from("feature_requests").insert({
      user_id: user.id,
      title: featureForm.title,
      description: featureForm.description,
      category: featureForm.category,
      status: "pending_review",
    });
    if (error) { setSubmitMsg({ type: "error", text: error.message }); return; }
    setSubmitMsg({ type: "success", text: "Feature request submitted for admin review." });
    setFeatureForm({ title: "", description: "", category: "Uncategorized" });
    setShowFeatureForm(false);
    fetchData();
  };

  const handleSubmitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMsg({ type: "", text: "" });
    if (!user) { setSubmitMsg({ type: "error", text: "Please log in to report a bug." }); return; }
    const { error } = await supabase.from("bug_reports").insert({
      user_id: user.id,
      title: bugForm.title,
      description: bugForm.description,
      status: "open",
    });
    if (error) { setSubmitMsg({ type: "error", text: error.message }); return; }
    setSubmitMsg({ type: "success", text: "Bug report submitted." });
    setBugForm({ title: "", description: "" });
    setShowBugForm(false);
    fetchData();
  };

  const getFeaturesByStatus = (status: string) =>
    features.filter(f => f.status === status && !f.merged_into_id);

  const getMergeChildren = (parentId: number) =>
    features.filter(f => f.merged_into_id === parentId);

  const getMergeGroupVotes = (parentId: number) => {
    const children = getMergeChildren(parentId);
    return children.reduce((sum, child) => sum + getVoteCounts(child.id).up, 0);
  };

  const filteredFeatures = (() => {
    switch (activeTab) {
      case "active": return features.filter(f => f.status === "active" && !f.merged_into_id);
      case "declined": return getFeaturesByStatus("declined");
      case "archived": return getFeaturesByStatus("archived");
      case "candidates": return getFeaturesByStatus("candidate");
      case "bugs": return [];
    }
  })();

  const hasMerges = (featureId: number) => features.some(f => f.merged_into_id === featureId);

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: "bg-yellow-500/12 text-yellow-200 border-yellow-400/18",
      confirmed: "bg-blue-500/12 text-blue-200 border-blue-400/18",
      duplicate: "bg-slate-500/12 text-slate-200 border-slate-400/18",
      denied: "bg-red-500/12 text-red-200 border-red-400/18",
      squashed: "bg-green-500/12 text-green-200 border-green-400/18",
      pending_review: "bg-yellow-500/12 text-yellow-200 border-yellow-400/18",
      active: "bg-green-500/12 text-green-200 border-green-400/18",
      declined: "bg-red-500/12 text-red-200 border-red-400/18",
      merged: "bg-blue-500/12 text-blue-200 border-blue-400/18",
      archived: "bg-slate-500/12 text-slate-200 border-slate-400/18",
      candidate: "bg-violet-500/12 text-violet-200 border-violet-400/18",
    };
    return map[status] || "bg-slate-500/12 text-slate-200 border-slate-400/18";
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending_review: "Pending Review",
      active: "Active",
      declined: "Declined",
      merged: "Merged",
      archived: "Archived",
      candidate: "Candidate",
      open: "Open", confirmed: "Confirmed",
      duplicate: "Duplicate", denied: "Denied", squashed: "Squashed",
    };
    return map[status] || status;
  };

  const renderVoteButtons = (featureId: number) => {
    const c = getVoteCounts(featureId);
    const userVote = getUserVote(featureId);
    return (
      <div className="flex flex-col items-center gap-0.5 min-w-[48px]">
        <button onClick={() => handleVote(featureId, "up")} disabled={!user}
          className={`p-1 rounded transition ${userVote === "up" ? "text-violet-300" : "text-slate-500 hover:text-violet-200"} disabled:opacity-40`}>
          <ArrowBigUp size={20} />
        </button>
        <span className={`text-sm font-bold tabular-nums ${c.total > 0 ? "text-violet-200" : c.total < 0 ? "text-red-200" : "text-slate-400"}`}>
          {c.total}
        </span>
        <button onClick={() => handleVote(featureId, "down")} disabled={!user}
          className={`p-1 rounded transition ${userVote === "down" ? "text-red-300" : "text-slate-500 hover:text-red-200"} disabled:opacity-40`}>
          <ArrowBigDown size={20} />
        </button>
      </div>
    );
  };

  const renderFeatureCard = (feature: FeatureRequest, isChild = false) => {
    const hasChildren = hasMerges(feature.id);
    const isExpanded = expandedMerge === feature.id;
    const children = hasChildren ? getMergeChildren(feature.id) : [];
    const mergeUpvotes = hasChildren ? getMergeGroupVotes(feature.id) : 0;

    return (
      <div key={feature.id} className={`${isChild ? "ml-12 border-l-2 border-violet-500/20 pl-6" : ""}`}>
        <SurfacePanel className={`p-5 ${feature.status === "merged" ? "bg-[linear-gradient(180deg,rgba(30,21,56,0.86),rgba(8,10,18,0.94))]" : ""}`}>
          <div className="flex gap-4">
            {(activeTab === "active" && feature.status !== "merged") ? (
              renderVoteButtons(feature.id)
            ) : null}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${statusBadge(feature.status)}`}>
                  {getStatusLabel(feature.status)}
                </span>
                {feature.category !== "Uncategorized" ? (
                  <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{feature.category}</span>
                ) : null}
                {feature.merged_into_id ? (
                  <span className="flex items-center gap-1 text-[10px] text-blue-300"><Merge size={10} /> Merged</span>
                ) : null}
              </div>

              {feature.status === "merged" ? (
                <button onClick={() => setExpandedMerge(isExpanded ? null : feature.id)}
                  className="flex items-center gap-2 text-left w-full">
                  {isExpanded ? <ChevronDown size={16} className="text-violet-300 shrink-0" /> : <ChevronRight size={16} className="text-violet-300 shrink-0" />}
                  <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                  <span className="text-sm text-violet-200 font-bold ml-auto">{mergeUpvotes}</span>
                </button>
              ) : (
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
              )}

              {feature.description ? (
                <p className="mt-2 text-sm leading-7 text-slate-300/76">{feature.description}</p>
              ) : null}

              {feature.admin_reason ? (
                <p className="mt-2 text-sm text-slate-400 italic">Admin note: {feature.admin_reason}</p>
              ) : null}

              <p className="mt-2 text-[11px] text-slate-500">
                {new Date(feature.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </SurfacePanel>

        {feature.status === "merged" && isExpanded && children.length > 0 && (
          <div className="mt-3 space-y-3">
            {children.map(child => renderFeatureCard({ ...child, status: "active" }, true))}
          </div>
        )}
      </div>
    );
  };

  const renderBugCard = (bug: BugReport) => (
    <SurfacePanel key={bug.id} className="p-5">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${statusBadge(bug.status)}`}>
              {getStatusLabel(bug.status)}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">{bug.title}</h3>
          {bug.description ? (
            <p className="mt-2 text-sm leading-7 text-slate-300/76">{bug.description}</p>
          ) : null}
          {bug.admin_note ? (
            <p className="mt-2 text-sm text-slate-400 italic">Admin: {bug.admin_note}</p>
          ) : null}
          <p className="mt-2 text-[11px] text-slate-500">{new Date(bug.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </SurfacePanel>
  );

  return (
    <PageScaffold>
      <PageHero
        eyebrow="Feedback"
        title="Shape the platform."
        description="Submit feature requests, report bugs, and vote on what gets built next."
        actions={
          user ? (
            <>
              <button onClick={() => { setShowFeatureForm(true); setShowBugForm(false); setSubmitMsg({ type: "", text: "" }); }}
                className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">
                <Plus size={16} /> Feature Request
              </button>
              <button onClick={() => { setShowBugForm(true); setShowFeatureForm(false); setSubmitMsg({ type: "", text: "" }); }}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-100 hover:border-white/18 hover:bg-white/[0.07]">
                <Bug size={16} /> Report Bug
              </button>
            </>
          ) : (
            <GhostButton to="/login">Log in to submit</GhostButton>
          )
        }
      />

      <SectionBand>
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab.id ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {submitMsg.text ? (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${submitMsg.type === "error" ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-violet-200/24 bg-violet-400/10 text-violet-100"}`}>
            {submitMsg.text}
          </div>
        ) : null}

        {showFeatureForm ? (
          <SurfacePanel className="mb-6 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Submit a Feature Request</h3>
            <form onSubmit={handleSubmitFeature} className="space-y-4">
              <div>
                <label className={formLabelClass}>Title</label>
                <input className={formInputClass} required value={featureForm.title}
                  onChange={e => setFeatureForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className={formLabelClass}>Description (optional)</label>
                <textarea className={`${formInputClass} min-h-[100px] resize-y`} value={featureForm.description}
                  onChange={e => setFeatureForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className={formLabelClass}>Category (optional)</label>
                <select className={formInputClass} value={featureForm.category}
                  onChange={e => setFeatureForm(p => ({ ...p, category: e.target.value }))}>
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">
                  Submit
                </button>
                <button type="button" onClick={() => setShowFeatureForm(false)}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-100">
                  Cancel
                </button>
              </div>
            </form>
          </SurfacePanel>
        ) : null}

        {showBugForm ? (
          <SurfacePanel className="mb-6 p-6">
            <h3 className="text-lg font-bold text-white mb-4">Report a Bug</h3>
            <form onSubmit={handleSubmitBug} className="space-y-4">
              <div>
                <label className={formLabelClass}>Title</label>
                <input className={formInputClass} required value={bugForm.title}
                  onChange={e => setBugForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className={formLabelClass}>Description (optional)</label>
                <textarea className={`${formInputClass} min-h-[100px] resize-y`} value={bugForm.description}
                  onChange={e => setBugForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">
                  Submit
                </button>
                <button type="button" onClick={() => setShowBugForm(false)}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-100">
                  Cancel
                </button>
              </div>
            </form>
          </SurfacePanel>
        ) : null}

        {loading ? (
          <SurfacePanel>Loading...</SurfacePanel>
        ) : activeTab === "bugs" ? (
          bugs.length === 0 ? (
            <SurfacePanel>No bug reports yet.</SurfacePanel>
          ) : (
            <div className="space-y-4">{bugs.map(renderBugCard)}</div>
          )
        ) : filteredFeatures.length === 0 ? (
          <SurfacePanel>No items in this list.</SurfacePanel>
        ) : (
          <div className="space-y-4">
            {filteredFeatures.map(f => renderFeatureCard(f))}
            {activeTab === "active" && features.filter(f => f.status === "merged").map(f => renderFeatureCard(f))}
          </div>
        )}
      </SectionBand>
    </PageScaffold>
  );
};

export default FeedbackHub;
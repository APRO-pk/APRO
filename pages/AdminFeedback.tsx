import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle, XCircle, Merge, Archive, Award,
  Bug, RefreshCw, CornerDownRight
} from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { AdminShell, GhostButton, SurfacePanel, formInputClass, formLabelClass } from "../components/PageScaffold";

type FeatureRequest = {
  id: number; user_id: string; title: string; description: string;
  category: string; status: string; admin_reason: string;
  merged_into_id: number | null; created_at: string; updated_at: string;
};

type BugReport = {
  id: number; user_id: string; title: string; description: string;
  status: string; duplicate_of_id: number | null; admin_note: string;
  created_at: string; updated_at: string;
};

type AdminTab = "pending" | "manage" | "bugs";
const ADMIN_TABS: { id: AdminTab; label: string }[] = [
  { id: "pending", label: "Pending Features" },
  { id: "manage", label: "Manage Features" },
  { id: "bugs", label: "Bug Queue" },
];

const AdminFeedback: React.FC = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("pending");
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [mergeMode, setMergeMode] = useState<{ target: number; heading: string } | null>(null);
  const [declineReason, setDeclineReason] = useState<{ id: number; reason: string } | null>(null);
  const [bugNote, setBugNote] = useState<{ id: number; note: string } | null>(null);
  const [archiveReason, setArchiveReason] = useState<{ id: number; reason: string } | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return navigate("/admin");
      const { data: row, error } = await supabase.from("admins").select("id, username").eq("auth_id", session.user.id).single();
      if (error || !row) { await supabase.auth.signOut(); navigate("/admin"); return; }
      setAdmin(row);
    };
    check();
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, bRes] = await Promise.all([
        supabase.from("feature_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("bug_reports").select("*").order("created_at", { ascending: false }),
      ]);
      if (!fRes.error) setFeatures(fRes.data || []);
      if (!bRes.error) setBugs(bRes.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createNotification = async (userId: string, type: string, message: string, featureId?: number, bugId?: number) => {
    await supabase.from("notifications").insert({ user_id: userId, type, message, feature_id: featureId, bug_id: bugId });
  };

  const updateFeature = async (id: number, updates: Partial<FeatureRequest>, notifyMsg?: string) => {
    setActionLoading(id);
    setActionMsg({ type: "", text: "" });
    const { error } = await supabase.from("feature_requests").update(updates).eq("id", id);
    if (error) { setActionMsg({ type: "error", text: error.message }); setActionLoading(null); return false; }
    if (notifyMsg) {
      const feature = features.find(f => f.id === id);
      if (feature) await createNotification(feature.user_id, updates.status || "update", notifyMsg, id);
    }
    await fetchData();
    setActionLoading(null);
    return true;
  };

  const updateBug = async (id: number, updates: Partial<BugReport>, notifyMsg?: string) => {
    setActionLoading(id);
    setActionMsg({ type: "", text: "" });
    const { error } = await supabase.from("bug_reports").update(updates).eq("id", id);
    if (error) { setActionMsg({ type: "error", text: error.message }); setActionLoading(null); return false; }
    if (notifyMsg) {
      const bug = bugs.find(b => b.id === id);
      if (bug) await createNotification(bug.user_id, updates.status || "update", notifyMsg, undefined, id);
    }
    await fetchData();
    setActionLoading(null);
    return true;
  };

  const handleApprove = async (id: number) => {
    await updateFeature(id, { status: "active" }, "Your feature request has been approved and is now live.");
  };

  const handleDecline = async (id: number) => {
    if (!declineReason || declineReason.id !== id) { setDeclineReason({ id, reason: "" }); return; }
    if (!declineReason.reason.trim()) { setActionMsg({ type: "error", text: "Please provide a reason." }); return; }
    const ok = await updateFeature(id, { status: "declined", admin_reason: declineReason.reason }, `Your feature request was declined: ${declineReason.reason}`);
    if (ok) setDeclineReason(null);
  };

  const handleMerge = async (sourceId: number) => {
    if (!mergeMode) { setMergeMode({ target: sourceId, heading: "" }); return; }
    if (!mergeMode.heading.trim()) { setActionMsg({ type: "error", text: "Please provide a group heading." }); return; }
    setActionLoading(sourceId);
    const { error: updateParent } = await supabase.from("feature_requests").update({
      title: mergeMode.heading, status: "merged",
    }).eq("id", mergeMode.target);
    if (updateParent) { setActionMsg({ type: "error", text: updateParent.message }); setActionLoading(null); return; }
    const { error: updateChild } = await supabase.from("feature_requests").update({
      merged_into_id: mergeMode.target, status: "merged",
    }).eq("id", sourceId);
    if (updateChild) { setActionMsg({ type: "error", text: updateChild.message }); setActionLoading(null); return; }
    const child = features.find(f => f.id === sourceId);
    if (child) await createNotification(child.user_id, "merged", `Your feature request was merged into "${mergeMode.heading}".`, sourceId);
    setMergeMode(null);
    await fetchData();
    setActionLoading(null);
  };

  const handleArchive = async (id: number) => {
    if (!archiveReason || archiveReason.id !== id) { setArchiveReason({ id, reason: "" }); return; }
    if (!archiveReason.reason.trim()) { setActionMsg({ type: "error", text: "Please provide a reason." }); return; }
    const ok = await updateFeature(id, { status: "archived", admin_reason: archiveReason.reason }, `Your feature request was archived: ${archiveReason.reason}`);
    if (ok) setArchiveReason(null);
  };

  const handlePromote = async (id: number) => {
    await updateFeature(id, { status: "candidate" }, "Your feature request has been promoted to Candidate for Update.");
  };

  const handleBugStatus = async (id: number, status: string, notifyMsg: string) => {
    let updates: Partial<BugReport> = { status: status as BugReport["status"] };
    if (status === "denied" || status === "duplicate") {
      if (!bugNote || bugNote.id !== id) { setBugNote({ id, note: "" }); return; }
      updates.admin_note = bugNote.note;
    }
    const ok = await updateBug(id, updates, notifyMsg);
    if (ok && (status === "denied" || status === "duplicate")) setBugNote(null);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin"); };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending_review: "bg-yellow-500/12 text-yellow-200 border-yellow-400/18",
      active: "bg-green-500/12 text-green-200 border-green-400/18",
      declined: "bg-red-500/12 text-red-200 border-red-400/18",
      merged: "bg-blue-500/12 text-blue-200 border-blue-400/18",
      archived: "bg-slate-500/12 text-slate-200 border-slate-400/18",
      candidate: "bg-violet-500/12 text-violet-200 border-violet-400/18",
      open: "bg-yellow-500/12 text-yellow-200 border-yellow-400/18",
      confirmed: "bg-blue-500/12 text-blue-200 border-blue-400/18",
      duplicate: "bg-slate-500/12 text-slate-200 border-slate-400/18",
      denied: "bg-red-500/12 text-red-200 border-red-400/18",
      squashed: "bg-green-500/12 text-green-200 border-green-400/18",
    };
    return map[status] || "bg-slate-500/12 text-slate-200 border-slate-400/18";
  };

  const getStatusLabel = (s: string) => ({
    pending_review: "Pending Review", active: "Active", declined: "Declined",
    merged: "Merged", archived: "Archived", candidate: "Candidate",
    open: "Open", confirmed: "Confirmed", duplicate: "Duplicate",
    denied: "Denied", squashed: "Squashed",
  })[s] || s;

  const renderFeatureCard = (feature: FeatureRequest) => (
    <SurfacePanel key={feature.id} className="p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${statusBadge(feature.status)}`}>
            {getStatusLabel(feature.status)}
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{feature.category}</span>
        </div>
        <h3 className="text-lg font-bold text-white">{feature.title}</h3>
        {feature.description ? <p className="text-sm text-slate-300/76">{feature.description}</p> : null}
        <p className="text-[11px] text-slate-500">Submitted: {new Date(feature.created_at).toLocaleString()}</p>

        {feature.status === "pending_review" ? (
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={() => handleApprove(feature.id)} disabled={actionLoading === feature.id}
              className="inline-flex items-center gap-1 rounded-full bg-green-600 hover:bg-green-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50">
              <CheckCircle size={14} /> Approve
            </button>

            {declineReason?.id === feature.id ? (
              <div className="flex gap-2 items-center w-full">
                <input className={formInputClass} placeholder="Reason for declining..." value={declineReason.reason}
                  onChange={e => setDeclineReason(p => p ? { ...p, reason: e.target.value } : null)} />
                <button onClick={() => handleDecline(feature.id)} disabled={actionLoading === feature.id}
                  className="rounded-full bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition">Confirm</button>
                <button onClick={() => setDeclineReason(null)} className="text-xs text-slate-400">Cancel</button>
              </div>
            ) : (
              <button onClick={() => handleDecline(feature.id)} disabled={actionLoading === feature.id}
                className="inline-flex items-center gap-1 rounded-full bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50">
                <XCircle size={14} /> Decline
              </button>
            )}

            {mergeMode && mergeMode.target !== feature.id ? (
              <button onClick={() => handleMerge(feature.id)} disabled={actionLoading === feature.id}
                className="inline-flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 text-xs font-bold text-blue-200 transition">
                <Merge size={14} /> Merge into selected
              </button>
            ) : mergeMode?.target === feature.id ? (
              <div className="flex gap-2 items-center w-full">
                <span className="text-xs text-blue-300">Merge target</span>
                <input className={formInputClass} placeholder="Group heading..." value={mergeMode.heading}
                  onChange={e => setMergeMode(p => p ? { ...p, heading: e.target.value } : null)} />
                <span className="text-xs text-slate-400">Select feature to merge into this one</span>
                <button onClick={() => setMergeMode(null)} className="text-xs text-slate-400">Cancel</button>
              </div>
            ) : null}
          </div>
        ) : null}

        {(feature.status === "active" || feature.status === "merged") ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {archiveReason?.id === feature.id ? (
              <div className="flex gap-2 items-center w-full">
                <input className={formInputClass} placeholder="Reason for archiving..." value={archiveReason.reason}
                  onChange={e => setArchiveReason(p => p ? { ...p, reason: e.target.value } : null)} />
                <button onClick={() => handleArchive(feature.id)} disabled={actionLoading === feature.id}
                  className="rounded-full bg-slate-600 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition">Confirm</button>
                <button onClick={() => setArchiveReason(null)} className="text-xs text-slate-400">Cancel</button>
              </div>
            ) : (
              <button onClick={() => handleArchive(feature.id)} disabled={actionLoading === feature.id}
                className="inline-flex items-center gap-1 rounded-full border border-slate-400/30 bg-slate-500/10 hover:bg-slate-500/20 px-4 py-2 text-xs font-bold text-slate-200 transition disabled:opacity-50">
                <Archive size={14} /> Archive
              </button>
            )}
            <button onClick={() => handlePromote(feature.id)} disabled={actionLoading === feature.id}
              className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/10 hover:bg-violet-500/20 px-4 py-2 text-xs font-bold text-violet-200 transition disabled:opacity-50">
              <Award size={14} /> Promote to Candidate
            </button>
          </div>
        ) : null}

        {feature.status === "candidate" ? (
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={() => handleArchive(feature.id)} disabled={actionLoading === feature.id}
              className="inline-flex items-center gap-1 rounded-full border border-slate-400/30 bg-slate-500/10 hover:bg-slate-500/20 px-4 py-2 text-xs font-bold text-slate-200 transition">
              <Archive size={14} /> Archive
            </button>
            <button onClick={() => updateFeature(feature.id, { status: "active" }, "Your feature has been returned to the active list.")}
              disabled={actionLoading === feature.id}
              className="inline-flex items-center gap-1 rounded-full border border-green-400/30 bg-green-500/10 hover:bg-green-500/20 px-4 py-2 text-xs font-bold text-green-200 transition">
              <RefreshCw size={14} /> Move to Active
            </button>
          </div>
        ) : null}
      </div>
    </SurfacePanel>
  );

  const renderBugCard = (bug: BugReport) => (
    <SurfacePanel key={bug.id} className="p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${statusBadge(bug.status)}`}>
            {getStatusLabel(bug.status)}
          </span>
        </div>
        <h3 className="text-lg font-bold text-white">{bug.title}</h3>
        {bug.description ? <p className="text-sm text-slate-300/76">{bug.description}</p> : null}
        <p className="text-[11px] text-slate-500">Submitted: {new Date(bug.created_at).toLocaleString()}</p>

        {bug.status === "open" || bug.status === "confirmed" ? (
          <div className="flex flex-wrap gap-2 mt-2">
            <button onClick={() => updateBug(bug.id, { status: "confirmed" }, "Your bug report has been confirmed.")}
              disabled={actionLoading === bug.id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50">
              <CheckCircle size={14} /> Confirm
            </button>

            {(bugNote?.id === bug.id) ? (
              <div className="flex gap-2 items-center w-full">
                <input className={formInputClass} placeholder="Note..." value={bugNote?.note || ""}
                  onChange={e => setBugNote(p => p ? { ...p, note: e.target.value } : null)} />
                <button onClick={() => handleBugStatus(bug.id, "duplicate", "Your bug report has been marked as a duplicate.")}
                  disabled={actionLoading === bug.id}
                  className="rounded-full bg-slate-600 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition">Confirm</button>
                <button onClick={() => setBugNote(null)} className="text-xs text-slate-400">Cancel</button>
              </div>
            ) : (
              <button onClick={() => handleBugStatus(bug.id, "duplicate", "")}
                disabled={actionLoading === bug.id}
                className="inline-flex items-center gap-1 rounded-full border border-slate-400/30 bg-slate-500/10 hover:bg-slate-500/20 px-4 py-2 text-xs font-bold text-slate-200 transition disabled:opacity-50">
                <CornerDownRight size={14} /> Duplicate
              </button>
            )}

            {(bugNote?.id === bug.id) ? (
              <div className="flex gap-2 items-center w-full">
                <input className={formInputClass} placeholder="Note..." value={bugNote?.note || ""}
                  onChange={e => setBugNote(p => p ? { ...p, note: e.target.value } : null)} />
                <button onClick={() => handleBugStatus(bug.id, "denied", "Your bug report has been marked as not a bug.")}
                  className="rounded-full bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition">Confirm</button>
                <button onClick={() => setBugNote(null)} className="text-xs text-slate-400">Cancel</button>
              </div>
            ) : (
              <button onClick={() => handleBugStatus(bug.id, "denied", "")}
                disabled={actionLoading === bug.id}
                className="inline-flex items-center gap-1 rounded-full bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50">
                <XCircle size={14} /> Deny
              </button>
            )}

            {bug.status === "confirmed" ? (
              <button onClick={() => updateBug(bug.id, { status: "squashed" }, "Your bug report has been resolved.")}
                disabled={actionLoading === bug.id}
                className="inline-flex items-center gap-1 rounded-full bg-green-600 hover:bg-green-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50">
                <CheckCircle size={14} /> Squash
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </SurfacePanel>
  );

  const getPendingFeatures = () => features.filter(f => f.status === "pending_review");
  const getManageableFeatures = () => features.filter(f => ["active", "merged", "candidate"].includes(f.status));
  const getOpenBugs = () => bugs.filter(b => ["open", "confirmed"].includes(b.status));

  return (
    <AdminShell
      eyebrow="Admin / Feedback"
      title="Feedback Management"
      description={admin ? `Review feature requests, manage submissions, and triage bug reports.` : ""}
      actions={
        <>
          <GhostButton to="/feedback">View feedback hub</GhostButton>
          <GhostButton to="/admin/dashboard">Dashboard</GhostButton>
          <button onClick={handleLogout}
            className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">
            Logout
          </button>
        </>
      }
    >
      <div className="flex flex-wrap gap-2 mb-6">
        {ADMIN_TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab.id ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}>
            {tab.label}
            {tab.id === "pending" ? ` (${getPendingFeatures().length})` : tab.id === "bugs" ? ` (${getOpenBugs().length})` : ""}
          </button>
        ))}
      </div>

      {actionMsg.text ? (
        <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${actionMsg.type === "error" ? "border-red-400/20 bg-red-400/10 text-red-100" : "border-violet-200/24 bg-violet-400/10 text-violet-100"}`}>
          {actionMsg.text}
        </div>
      ) : null}

      {loading ? (
        <SurfacePanel>Loading...</SurfacePanel>
      ) : activeTab === "pending" ? (
        getPendingFeatures().length === 0 ? (
          <SurfacePanel>No pending feature requests.</SurfacePanel>
        ) : (
          <div className="space-y-4">{getPendingFeatures().map(renderFeatureCard)}</div>
        )
      ) : activeTab === "manage" ? (
        getManageableFeatures().length === 0 ? (
          <SurfacePanel>No active features to manage.</SurfacePanel>
        ) : (
          <div className="space-y-4">{getManageableFeatures().map(renderFeatureCard)}</div>
        )
      ) : (
        getOpenBugs().length === 0 ? (
          <SurfacePanel>No open bug reports.</SurfacePanel>
        ) : (
          <div className="space-y-4">{getOpenBugs().map(renderBugCard)}</div>
        )
      )}
    </AdminShell>
  );
};

export default AdminFeedback;
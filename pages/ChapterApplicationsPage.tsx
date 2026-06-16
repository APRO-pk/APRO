import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { AdminShell, GhostButton, SurfacePanel } from "../components/PageScaffold";

type ChapterDetails = { application_id: number; unit_name: string; institution: string; advisor_name: string; advisor_email: string; advisor_phone: string; lead_name: string; member_count: number; };
type ComplianceAnswers = { application_id: number; explosives_history: string; anti_weaponization: string; campus_approval: string; };
type ChapterApplication = { id: number; applicant_type: string; member_id: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; submitted_at: string; chapter_details: ChapterDetails[] | ChapterDetails | null; compliance_answers: ComplianceAnswers[] | ComplianceAnswers | null; };
type TabStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
const TABS: TabStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const ChapterApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ChapterApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<ChapterApplication | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING");
  const [counts, setCounts] = useState({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });

  const getChapterDetails = (app: ChapterApplication) => !app.chapter_details ? null : Array.isArray(app.chapter_details) ? app.chapter_details[0] || null : app.chapter_details;
  const getComplianceAnswers = (app: ChapterApplication) => !app.compliance_answers ? null : Array.isArray(app.compliance_answers) ? app.compliance_answers[0] || null : app.compliance_answers;

  const fetchCounts = async () => {
    const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_type", "CHAPTER"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_type", "CHAPTER").eq("status", "PENDING"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_type", "CHAPTER").eq("status", "APPROVED"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_type", "CHAPTER").eq("status", "REJECTED"),
    ]);
    setCounts({ ALL: allRes.count || 0, PENDING: pendingRes.count || 0, APPROVED: approvedRes.count || 0, REJECTED: rejectedRes.count || 0 });
  };

  const fetchApplications = async (statusFilter: TabStatus = activeTab) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return navigate("/admin/login");
      const { data: adminRow, error: adminError } = await supabase.from("admins").select("id").eq("auth_id", session.user.id).single();
      if (adminError || !adminRow) {
        await supabase.auth.signOut();
        return navigate("/admin/login");
      }
      let query = supabase.from("applications").select(`
        id, applicant_type, member_id, status, submitted_at,
        chapter_details (application_id, unit_name, institution, advisor_name, advisor_email, advisor_phone, lead_name, member_count),
        compliance_answers (application_id, explosives_history, anti_weaponization, campus_approval)
      `).eq("applicant_type", "CHAPTER").order("submitted_at", { ascending: false });
      if (statusFilter !== "ALL") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) return setApplications([]);
      setApplications((data || []) as ChapterApplication[]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchCounts(); }, []);
  useEffect(() => { fetchApplications(activeTab); }, [activeTab]);
  const updateApplicationStatus = async (applicationId: number, newStatus: "APPROVED" | "REJECTED" | "PENDING") => {
    setActionLoadingId(applicationId);
    try {
      const { error } = await supabase.from("applications").update({ status: newStatus }).eq("id", applicationId);
      if (error) return;
      if (selectedApplication?.id === applicationId) setSelectedApplication(null);
      await fetchCounts();
      await fetchApplications(activeTab);
    } finally {
      setActionLoadingId(null);
    }
  };
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  return (
    <AdminShell eyebrow="Admin / Chapters" title="Chapter Applications" description="Review chapter applications submitted to APRO." actions={<><GhostButton to="/admin/dashboard">Back to dashboard</GhostButton><button onClick={handleLogout} className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">Logout</button></>}>
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap gap-2">{TABS.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}>{tab.charAt(0) + tab.slice(1).toLowerCase()} ({counts[tab]})</button>)}</div>
      </div>
      <div className="mt-6">{loading ? <SurfacePanel>Loading chapter applications...</SurfacePanel> : applications.length === 0 ? <SurfacePanel>No chapter applications found for this filter.</SurfacePanel> : <div className="space-y-4">{applications.map((app) => { const details = getChapterDetails(app); return <SurfacePanel key={app.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold text-white">{details?.unit_name || "Unnamed Chapter"}</h2><StatusPill status={app.status} /></div><p className="mt-1 text-sm text-slate-400">{details?.institution || "No institution"}{details?.lead_name ? ` - Lead: ${details.lead_name}` : ""}</p><p className="mt-1 text-sm text-slate-400">Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleString() : "N/A"}</p></div><div className="flex flex-wrap gap-2"><ActionButton label="View Details" onClick={() => setSelectedApplication(app)} />{app.status !== "APPROVED" && <DecisionButton color="green" label={actionLoadingId === app.id ? "Updating..." : "Approve"} onClick={() => updateApplicationStatus(app.id, "APPROVED")} />}{app.status !== "REJECTED" && <DecisionButton color="red" label={actionLoadingId === app.id ? "Updating..." : "Reject"} onClick={() => updateApplicationStatus(app.id, "REJECTED")} />}{app.status !== "PENDING" && <DecisionButton color="yellow" label={actionLoadingId === app.id ? "Updating..." : "Mark Pending"} onClick={() => updateApplicationStatus(app.id, "PENDING")} />}</div></div></SurfacePanel>; })}</div>}</div>
      {selectedApplication ? <ChapterDetailsModal application={selectedApplication} onClose={() => setSelectedApplication(null)} onApprove={() => updateApplicationStatus(selectedApplication.id, "APPROVED")} onReject={() => updateApplicationStatus(selectedApplication.id, "REJECTED")} onMarkPending={() => updateApplicationStatus(selectedApplication.id, "PENDING")} loading={actionLoadingId === selectedApplication.id} /> : null}
    </AdminShell>
  );
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${status === "APPROVED" ? "bg-green-500/12 text-green-200 border-green-400/18" : status === "REJECTED" ? "bg-red-500/12 text-red-200 border-red-400/18" : "bg-yellow-500/12 text-yellow-200 border-yellow-400/18"}`}>{status}</span>;
const ActionButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => <button onClick={onClick} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.07] transition">{label}</button>;
const DecisionButton: React.FC<{ color: "green" | "red" | "yellow"; label: string; onClick: () => void }> = ({ color, label, onClick }) => <button onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-bold text-white transition ${color === "green" ? "bg-green-600 hover:bg-green-700" : color === "red" ? "bg-red-600 hover:bg-red-700" : "bg-yellow-500 hover:bg-yellow-600"}`}>{label}</button>;

const ChapterDetailsModal: React.FC<{
  application: ChapterApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkPending: () => void;
  loading: boolean;
}> = ({ application, onClose, onApprove, onReject, onMarkPending, loading }) => {
  const details = Array.isArray(application.chapter_details) ? application.chapter_details[0] : application.chapter_details;
  const compliance = Array.isArray(application.compliance_answers) ? application.compliance_answers[0] : application.compliance_answers;
  if (!details) return null;
  const Item = ({ label, value }: { label: string; value: React.ReactNode }) => <div className="border-b border-white/10 py-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm text-slate-100">{value || "N/A"}</p></div>;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"><div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c101a] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-6"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-bold text-white">Chapter Application Details</h2><StatusPill status={application.status} /></div><p className="mt-1 text-sm text-slate-400">Application ID: {application.id}</p></div><button onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-white">Close</button></div><div className="overflow-y-auto p-6"><div className="grid gap-x-8 md:grid-cols-2"><Item label="Unit Name" value={details.unit_name} /><Item label="Institution" value={details.institution} /><Item label="Lead Name" value={details.lead_name} /><Item label="Member Count" value={details.member_count} /><Item label="Advisor Name" value={details.advisor_name} /><Item label="Advisor Email" value={details.advisor_email} /><Item label="Advisor Phone" value={details.advisor_phone} /><Item label="Explosives History" value={compliance?.explosives_history || "N/A"} /><Item label="Anti-Weaponization" value={compliance?.anti_weaponization || "N/A"} /><Item label="Campus Approval" value={compliance?.campus_approval || "N/A"} /></div></div><div className="flex flex-wrap justify-end gap-3 border-t border-white/10 bg-white/[0.03] p-6">{application.status !== "PENDING" && <DecisionButton color="yellow" label={loading ? "Updating..." : "Mark Pending"} onClick={onMarkPending} />}{application.status !== "REJECTED" && <DecisionButton color="red" label={loading ? "Updating..." : "Reject"} onClick={onReject} />}{application.status !== "APPROVED" && <DecisionButton color="green" label={loading ? "Updating..." : "Approve"} onClick={onApprove} />}</div></div></div>;
};

export default ChapterApplicationsPage;

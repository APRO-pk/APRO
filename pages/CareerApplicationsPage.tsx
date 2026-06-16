import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { AdminShell, GhostButton, SurfacePanel } from "../components/PageScaffold";

type CareerApplication = { id: number; full_name: string; email: string; phone: string; role_type: string; why_join: string; resume_path: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; submitted_at: string; };
type TabStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
const TABS: TabStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const CareerApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<CareerApplication | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING");
  const [counts, setCounts] = useState({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });

  const fetchCounts = async () => {
    const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
      supabase.from("career_applications").select("id", { count: "exact", head: true }),
      supabase.from("career_applications").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
      supabase.from("career_applications").select("id", { count: "exact", head: true }).eq("status", "APPROVED"),
      supabase.from("career_applications").select("id", { count: "exact", head: true }).eq("status", "REJECTED"),
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
      let query = supabase.from("career_applications").select("id, full_name, email, phone, role_type, why_join, resume_path, status, submitted_at").order("submitted_at", { ascending: false });
      if (statusFilter !== "ALL") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) return setApplications([]);
      setApplications((data || []) as CareerApplication[]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchCounts(); }, []);
  useEffect(() => { fetchApplications(activeTab); }, [activeTab]);
  const updateApplicationStatus = async (applicationId: number, newStatus: "APPROVED" | "REJECTED" | "PENDING") => {
    setActionLoadingId(applicationId);
    try {
      const { error } = await supabase.from("career_applications").update({ status: newStatus }).eq("id", applicationId);
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
    <AdminShell eyebrow="Admin / Careers" title="Career Applications" description="Review career applications submitted to APRO." actions={<><GhostButton to="/admin/dashboard">Back to dashboard</GhostButton><button onClick={handleLogout} className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">Logout</button></>}>
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap gap-2">{TABS.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}>{tab.charAt(0) + tab.slice(1).toLowerCase()} ({counts[tab]})</button>)}</div>
      </div>
      <div className="mt-6">{loading ? <SurfacePanel>Loading career applications...</SurfacePanel> : applications.length === 0 ? <SurfacePanel>No career applications found for this filter.</SurfacePanel> : <div className="space-y-4">{applications.map((app) => <SurfacePanel key={app.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold text-white">{app.full_name || "Unnamed Applicant"}</h2><StatusPill status={app.status} /></div><p className="mt-1 text-sm text-slate-400">{app.email || "No email"}{app.role_type ? ` - ${app.role_type}` : ""}</p><p className="mt-1 text-sm text-slate-400">Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleString() : "N/A"}</p></div><div className="flex flex-wrap gap-2"><ActionButton label="View Details" onClick={() => setSelectedApplication(app)} />{app.status !== "APPROVED" && <DecisionButton color="green" label={actionLoadingId === app.id ? "Updating..." : "Approve"} onClick={() => updateApplicationStatus(app.id, "APPROVED")} />}{app.status !== "REJECTED" && <DecisionButton color="red" label={actionLoadingId === app.id ? "Updating..." : "Reject"} onClick={() => updateApplicationStatus(app.id, "REJECTED")} />}{app.status !== "PENDING" && <DecisionButton color="yellow" label={actionLoadingId === app.id ? "Updating..." : "Mark Pending"} onClick={() => updateApplicationStatus(app.id, "PENDING")} />}</div></div></SurfacePanel>)}</div>}</div>
      {selectedApplication ? <CareerDetailsModal application={selectedApplication} onClose={() => setSelectedApplication(null)} onApprove={() => updateApplicationStatus(selectedApplication.id, "APPROVED")} onReject={() => updateApplicationStatus(selectedApplication.id, "REJECTED")} onMarkPending={() => updateApplicationStatus(selectedApplication.id, "PENDING")} loading={actionLoadingId === selectedApplication.id} /> : null}
    </AdminShell>
  );
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${status === "APPROVED" ? "bg-green-500/12 text-green-200 border-green-400/18" : status === "REJECTED" ? "bg-red-500/12 text-red-200 border-red-400/18" : "bg-yellow-500/12 text-yellow-200 border-yellow-400/18"}`}>{status}</span>;
const ActionButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => <button onClick={onClick} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.07] transition">{label}</button>;
const DecisionButton: React.FC<{ color: "green" | "red" | "yellow"; label: string; onClick: () => void }> = ({ color, label, onClick }) => <button onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-bold text-white transition ${color === "green" ? "bg-green-600 hover:bg-green-700" : color === "red" ? "bg-red-600 hover:bg-red-700" : "bg-yellow-500 hover:bg-yellow-600"}`}>{label}</button>;

const CareerDetailsModal: React.FC<{
  application: CareerApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkPending: () => void;
  loading: boolean;
}> = ({ application, onClose, onApprove, onReject, onMarkPending, loading }) => {
  const Item = ({ label, value }: { label: string; value: React.ReactNode }) => <div className="border-b border-white/10 py-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 break-words text-sm text-slate-100">{value || "N/A"}</p></div>;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"><div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c101a] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-6"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-bold text-white">Career Application Details</h2><StatusPill status={application.status} /></div><p className="mt-1 text-sm text-slate-400">Application ID: {application.id}</p></div><button onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-white">Close</button></div><div className="overflow-y-auto p-6"><div className="grid gap-x-8 md:grid-cols-2"><Item label="Full Name" value={application.full_name} /><Item label="Email" value={application.email} /><Item label="Phone" value={application.phone} /><Item label="Role Type" value={application.role_type} /><Item label="Status" value={application.status} /><Item label="Submitted At" value={application.submitted_at ? new Date(application.submitted_at).toLocaleString() : "N/A"} /><div className="md:col-span-2"><Item label="Why Join" value={application.why_join} /></div><div className="md:col-span-2 border-b border-white/10 py-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Resume</p>{application.resume_path ? <button onClick={async () => { const { data, error } = await supabase.storage.from("resumes").createSignedUrl(application.resume_path!, 60); if (!error) window.open(data.signedUrl, "_blank"); }} className="mt-1 inline-block text-sm font-semibold text-violet-200 hover:underline">View Resume</button> : <p className="mt-1 text-sm text-slate-100">N/A</p>}</div></div></div><div className="flex flex-wrap justify-end gap-3 border-t border-white/10 bg-white/[0.03] p-6">{application.status !== "PENDING" && <DecisionButton color="yellow" label={loading ? "Updating..." : "Mark Pending"} onClick={onMarkPending} />}{application.status !== "REJECTED" && <DecisionButton color="red" label={loading ? "Updating..." : "Reject"} onClick={onReject} />}{application.status !== "APPROVED" && <DecisionButton color="green" label={loading ? "Updating..." : "Approve"} onClick={onApprove} />}</div></div></div>;
};

export default CareerApplicationsPage;

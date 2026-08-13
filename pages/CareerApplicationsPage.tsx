import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { AdminShell, GhostButton, SurfacePanel } from "../components/PageScaffold";

type CareerApplication = { id: number; full_name: string; email: string; phone: string; role_type: string; why_join: string; resume_path: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; submitted_at: string; job_opening_id: string | null; opening?: { title: string } | null };
type JobOpening = { id: string; title: string; category: string; description: string; status: "OPEN" | "CLOSED"; created_at: string };
type TabStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
const TABS: TabStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];
const CATEGORIES = ["Internship", "Part-Time Role", "Full-Time Role", "Freelance / Contract"];

const CareerApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"applications" | "openings">("applications");
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<CareerApplication | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING");
  const [counts, setCounts] = useState({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });
  const [showOpeningForm, setShowOpeningForm] = useState(false);
  const [editingOpening, setEditingOpening] = useState<JobOpening | null>(null);
  const [savingOpening, setSavingOpening] = useState(false);
  const [openingForm, setOpeningForm] = useState({ title: "", category: CATEGORIES[0], description: "", status: "OPEN" as "OPEN" | "CLOSED" });
  const resetOpeningForm = () => setOpeningForm({ title: "", category: CATEGORIES[0], description: "", status: "OPEN" });

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
      let query = supabase.from("career_applications").select("id, full_name, email, phone, role_type, why_join, resume_path, status, submitted_at, job_opening_id, opening:job_opening_id(title)").order("submitted_at", { ascending: false });
      if (statusFilter !== "ALL") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) return setApplications([]);
      setApplications((data || []) as unknown as CareerApplication[]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchCounts(); }, []);
  useEffect(() => { if (view === "applications") fetchApplications(activeTab); }, [activeTab, view]);

  const fetchOpenings = async () => {
    const { data } = await supabase.from("job_openings").select("*").order("created_at", { ascending: false });
    if (data) setOpenings(data as JobOpening[]);
  };
  useEffect(() => { if (view === "openings") fetchOpenings(); }, [view]);

  const saveOpening = async () => {
    if (!openingForm.title.trim()) return;
    setSavingOpening(true);
    try {
      const payload = {
        title: openingForm.title.trim(),
        category: openingForm.category,
        description: openingForm.description.trim(),
        status: openingForm.status,
      };
      let error: { message?: string } | null = null;
      if (editingOpening) {
        const res = await supabase.from("job_openings").update(payload).eq("id", editingOpening.id);
        error = res.error;
        if (!res.error) {
          setOpenings(prev => prev.map(o => o.id === editingOpening.id ? { ...o, ...payload } : o));
        }
      } else {
        const res = await supabase.from("job_openings").insert(payload);
        error = res.error;
        if (!res.error) await fetchOpenings();
      }
      if (!error) {
        setShowOpeningForm(false);
        setEditingOpening(null);
        resetOpeningForm();
      }
    } finally {
      setSavingOpening(false);
    }
  };

  const toggleOpeningStatus = async (opening: JobOpening) => {
    const newStatus = opening.status === "OPEN" ? "CLOSED" : "OPEN";
    const { error } = await supabase.from("job_openings").update({ status: newStatus }).eq("id", opening.id);
    if (!error) setOpenings(prev => prev.map(o => o.id === opening.id ? { ...o, status: newStatus } : o));
  };

  const deleteOpening = async (opening: JobOpening) => {
    if (!window.confirm(`Delete job opening "${opening.title}"?`)) return;
    const { error } = await supabase.from("job_openings").delete().eq("id", opening.id);
    if (!error) setOpenings(prev => prev.filter(o => o.id !== opening.id));
  };

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

  const inputClass = "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none focus:border-violet-500/30 mt-1";

  return (
    <AdminShell eyebrow="Admin / Careers" title="Career Applications" description="Review career applications submitted to APRO." actions={<><GhostButton to="/admin/dashboard">Back to dashboard</GhostButton><button onClick={handleLogout} className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">Logout</button></>}>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setView("applications")} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${view === "applications" ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}>Applications</button>
        <button onClick={() => setView("openings")} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${view === "openings" ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}><Briefcase size={14} className="inline mr-1" /> Job Openings</button>
      </div>

      {view === "applications" ? (
        <>
          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-wrap gap-2">{TABS.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}>{tab.charAt(0) + tab.slice(1).toLowerCase()} ({counts[tab]})</button>)}</div>
          </div>
          <div className="mt-6">{loading ? <SurfacePanel>Loading career applications...</SurfacePanel> : applications.length === 0 ? <SurfacePanel>No career applications found for this filter.</SurfacePanel> : <div className="space-y-4">{applications.map((app) => <SurfacePanel key={app.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold text-white">{app.full_name || "Unnamed Applicant"}</h2><StatusPill status={app.status} /></div><p className="mt-1 text-sm text-slate-400">{app.email || "No email"}{app.role_type ? ` - ${app.role_type}` : ""}{app.opening?.title ? ` - ${app.opening.title}` : ""}</p><p className="mt-1 text-sm text-slate-400">Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleString() : "N/A"}</p></div><div className="flex flex-wrap gap-2"><ActionButton label="View Details" onClick={() => setSelectedApplication(app)} />{app.status !== "APPROVED" && <DecisionButton color="green" label={actionLoadingId === app.id ? "Updating..." : "Approve"} onClick={() => updateApplicationStatus(app.id, "APPROVED")} />}{app.status !== "REJECTED" && <DecisionButton color="red" label={actionLoadingId === app.id ? "Updating..." : "Reject"} onClick={() => updateApplicationStatus(app.id, "REJECTED")} />}{app.status !== "PENDING" && <DecisionButton color="yellow" label={actionLoadingId === app.id ? "Updating..." : "Mark Pending"} onClick={() => updateApplicationStatus(app.id, "PENDING")} />}</div></div></SurfacePanel>)}</div>}</div>
          {selectedApplication ? <CareerDetailsModal application={selectedApplication} onClose={() => setSelectedApplication(null)} onApprove={() => updateApplicationStatus(selectedApplication.id, "APPROVED")} onReject={() => updateApplicationStatus(selectedApplication.id, "REJECTED")} onMarkPending={() => updateApplicationStatus(selectedApplication.id, "PENDING")} loading={actionLoadingId === selectedApplication.id} /> : null}
        </>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Job Openings</h2>
            <button onClick={() => { setEditingOpening(null); resetOpeningForm(); setShowOpeningForm(true); }} className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-5 py-2.5 text-xs font-semibold text-white"><Plus size={14} /> Add Opening</button>
          </div>
          <div className="mt-4 space-y-4">
            {openings.length === 0 ? <SurfacePanel>No job openings yet. Add one to show it in the career application form.</SurfacePanel> : openings.map((o) => <SurfacePanel key={o.id} className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-bold text-white">{o.title}</h3><StatusPill status={o.status} /><span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-300">{o.category}</span></div>{o.description ? <p className="mt-1 text-sm text-slate-400 line-clamp-2">{o.description}</p> : null}<p className="mt-1 text-xs text-slate-500">Posted: {new Date(o.created_at).toLocaleString()}</p></div><div className="flex flex-wrap gap-2 shrink-0"><button onClick={() => { setOpeningForm({ title: o.title, category: o.category, description: o.description, status: o.status }); setEditingOpening(o); setShowOpeningForm(true); }} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/[0.07] transition"><Pencil size={13} /> Edit</button><button onClick={() => toggleOpeningStatus(o)} className={`rounded-full px-4 py-2 text-xs font-bold text-white transition ${o.status === "OPEN" ? "bg-yellow-600 hover:bg-yellow-700" : "bg-green-600 hover:bg-green-700"}`}>{o.status === "OPEN" ? "Close Opening" : "Reopen"}</button><button onClick={() => deleteOpening(o)} className="inline-flex items-center gap-1 rounded-full border border-red-400/20 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-400/10 transition"><Trash2 size={13} /> Delete</button></div></div></SurfacePanel>)}
          </div>
        </>
      )}

      {showOpeningForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c101a] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h2 className="text-xl font-bold text-white">{editingOpening ? "Edit Job Opening" : "Add Job Opening"}</h2>
              <button onClick={() => setShowOpeningForm(false)} className="text-sm font-semibold text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Title</label>
                <input value={openingForm.title} onChange={e => setOpeningForm({ ...openingForm, title: e.target.value })} className={inputClass} placeholder="e.g. Aerospace Engineering Intern" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Category</label>
                <select value={openingForm.category} onChange={e => setOpeningForm({ ...openingForm, category: e.target.value })} className={inputClass}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0c101a]">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Description</label>
                <textarea value={openingForm.description} onChange={e => setOpeningForm({ ...openingForm, description: e.target.value })} className={`${inputClass} min-h-[120px] resize-y`} placeholder="What does this role involve?" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.15em] text-slate-500">Status</label>
                <select value={openingForm.status} onChange={e => setOpeningForm({ ...openingForm, status: e.target.value as "OPEN" | "CLOSED" })} className={inputClass}>
                  <option value="OPEN" className="bg-[#0c101a]">Open</option>
                  <option value="CLOSED" className="bg-[#0c101a]">Closed</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 border-t border-white/10 p-6">
              <button onClick={saveOpening} disabled={savingOpening || !openingForm.title.trim()} className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50">{savingOpening ? "Saving..." : editingOpening ? <><Pencil size={14} /> Save Changes</> : <><Plus size={14} /> Add Opening</>}</button>
              <button onClick={() => setShowOpeningForm(false)} className="rounded-full border border-white/10 px-5 py-2.5 text-xs text-slate-300 hover:bg-white/[0.06]">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${status === "APPROVED" || status === "OPEN" ? "bg-green-500/12 text-green-200 border-green-400/18" : status === "REJECTED" || status === "CLOSED" ? "bg-red-500/12 text-red-200 border-red-400/18" : "bg-yellow-500/12 text-yellow-200 border-yellow-400/18"}`}>{status}</span>;
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
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"><div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c101a] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 p-6"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl font-bold text-white">Career Application Details</h2><StatusPill status={application.status} /></div><p className="mt-1 text-sm text-slate-400">Application ID: {application.id}</p></div><button onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-white">Close</button></div><div className="overflow-y-auto p-6"><div className="grid gap-x-8 md:grid-cols-2"><Item label="Full Name" value={application.full_name} /><Item label="Email" value={application.email} /><Item label="Phone" value={application.phone} /><Item label="Role Type" value={application.role_type} /><Item label="Job Opening" value={application.opening?.title} /><Item label="Status" value={application.status} /><Item label="Submitted At" value={application.submitted_at ? new Date(application.submitted_at).toLocaleString() : "N/A"} /><div className="md:col-span-2"><Item label="Why Join" value={application.why_join} /></div><div className="md:col-span-2 border-b border-white/10 py-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Resume</p>{application.resume_path ? <button onClick={async () => { const { data, error } = await supabase.storage.from("resumes").createSignedUrl(application.resume_path!, 60); if (!error) window.open(data.signedUrl, "_blank"); }} className="mt-1 inline-block text-sm font-semibold text-violet-200 hover:underline">View Resume</button> : <p className="mt-1 text-sm text-slate-100">N/A</p>}</div></div></div><div className="flex flex-wrap justify-end gap-3 border-t border-white/10 bg-white/[0.03] p-6">{application.status !== "PENDING" && <DecisionButton color="yellow" label={loading ? "Updating..." : "Mark Pending"} onClick={onMarkPending} />}{application.status !== "APPROVED" && <DecisionButton color="green" label={loading ? "Updating..." : "Approve"} onClick={onApprove} />}{application.status !== "REJECTED" && <DecisionButton color="red" label={loading ? "Updating..." : "Reject"} onClick={onReject} />}</div></div></div>;
};

export default CareerApplicationsPage;

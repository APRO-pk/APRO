import React, { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabase";
import { useNavigate } from "react-router-dom";
import { AdminShell, GhostButton, SurfacePanel } from "../components/PageScaffold";

type StudentDetails = {
  application_id: number;
  full_name: string;
  email: string;
  phone: string;
  institution: string;
  date_of_birth: string;
  has_explosives_history: boolean;
  agrees_to_safety_code: boolean;
  agrees_to_legal: boolean;
  agrees_to_pledge: boolean;
  cnic: string;
  major_or_title: string;
  cert_level: string;
  emergency_contact: string;
};

type StudentApplication = {
  id: number;
  applicant_type: string;
  member_id: number | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submitted_at: string;
  student_details: StudentDetails[] | StudentDetails | null;
};

type TabStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";
const TABS: TabStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const StudentApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<StudentApplication | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING");
  const [counts, setCounts] = useState({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });

  const getStudentDetails = (app: StudentApplication) =>
    !app.student_details ? null : Array.isArray(app.student_details) ? app.student_details[0] || null : app.student_details;

  const fetchCounts = async () => {
    const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_type", "STUDENT"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_type", "STUDENT").eq("status", "PENDING"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_type", "STUDENT").eq("status", "APPROVED"),
      supabase.from("applications").select("id", { count: "exact", head: true }).eq("applicant_type", "STUDENT").eq("status", "REJECTED"),
    ]);
    setCounts({
      ALL: allRes.count || 0,
      PENDING: pendingRes.count || 0,
      APPROVED: approvedRes.count || 0,
      REJECTED: rejectedRes.count || 0,
    });
  };

  const fetchApplications = async (statusFilter: TabStatus = activeTab) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/admin/login");
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("admins").select("id").eq("auth_id", session.user.id).single();
      if (adminError || !adminRow) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      let query = supabase.from("applications").select(`
        id, applicant_type, member_id, status, submitted_at,
        student_details (
          application_id, full_name, email, phone, institution, date_of_birth,
          has_explosives_history, agrees_to_safety_code, agrees_to_legal, agrees_to_pledge,
          cnic, major_or_title, cert_level, emergency_contact
        )
      `).eq("applicant_type", "STUDENT").order("submitted_at", { ascending: false });

      if (statusFilter !== "ALL") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) {
        console.error(error);
        setApplications([]);
        return;
      }
      setApplications((data || []) as StudentApplication[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCounts(); }, []);
  useEffect(() => { fetchApplications(activeTab); }, [activeTab]);

  const updateApplicationStatus = async (applicationId: number, newStatus: "APPROVED" | "REJECTED" | "PENDING") => {
    setActionLoadingId(applicationId);
    setActionError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setActionError("Your admin session has expired. Please sign in again.");
        navigate("/admin/login");
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("admins").select("id").eq("auth_id", session.user.id).single();
      if (adminError || !adminRow) {
        await supabase.auth.signOut();
        setActionError("You are not authorized to update applications.");
        navigate("/admin/login");
        return;
      }

      const targetApp = applications.find((app) => app.id === applicationId);
      if (!targetApp?.member_id) {
        setActionError("This application is not linked to a member record.");
        return;
      }

      const { data: updatedApplications, error: applicationError } = await supabase
        .from("applications").update({ status: newStatus }).eq("id", applicationId).select("id, status, member_id");
      if (applicationError || !updatedApplications?.length) {
        setActionError(applicationError?.message || "Application status was not updated.");
        return;
      }

      const { data: updatedMembers, error: memberError } = await supabase
        .from("members").update({ account_status: newStatus }).eq("id", targetApp.member_id).select("id, account_status");
      if (memberError || !updatedMembers?.length) {
        setActionError(memberError?.message || "Member account status was not updated.");
        return;
      }

      if (selectedApplication?.id === applicationId) setSelectedApplication((prev) => prev ? { ...prev, status: newStatus } : prev);
      await fetchCounts();
      await fetchApplications(activeTab);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unexpected update error.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <AdminShell
      eyebrow="Admin / Students"
      title="Student Applications"
      description="Review student applications submitted to APRO."
      actions={
        <>
          <GhostButton to="/admin/dashboard">Back to dashboard</GhostButton>
          <button onClick={handleLogout} className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">Logout</button>
        </>
      }
    >
      <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()} ({counts[tab]})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {actionError ? <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{actionError}</div> : null}
        {loading ? (
          <SurfacePanel>Loading student applications...</SurfacePanel>
        ) : applications.length === 0 ? (
          <SurfacePanel>No student applications found for this filter.</SurfacePanel>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const details = getStudentDetails(app);
              return (
                <SurfacePanel key={app.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-bold text-white">{details?.full_name || "Unnamed Applicant"}</h2>
                        <StatusPill status={app.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{details?.email || "No email"} {details?.institution ? `- ${details.institution}` : ""}</p>
                      <p className="mt-1 text-sm text-slate-400">Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleString() : "N/A"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ActionButton label="View Details" onClick={() => setSelectedApplication(app)} />
                      {app.status !== "APPROVED" && <DecisionButton color="green" label={actionLoadingId === app.id ? "Updating..." : "Approve"} onClick={() => updateApplicationStatus(app.id, "APPROVED")} />}
                      {app.status !== "REJECTED" && <DecisionButton color="red" label={actionLoadingId === app.id ? "Updating..." : "Reject"} onClick={() => updateApplicationStatus(app.id, "REJECTED")} />}
                      {app.status !== "PENDING" && <DecisionButton color="yellow" label={actionLoadingId === app.id ? "Updating..." : "Mark Pending"} onClick={() => updateApplicationStatus(app.id, "PENDING")} />}
                    </div>
                  </div>
                </SurfacePanel>
              );
            })}
          </div>
        )}
      </div>

      {selectedApplication ? (
        <StudentDetailsModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onApprove={() => updateApplicationStatus(selectedApplication.id, "APPROVED")}
          onReject={() => updateApplicationStatus(selectedApplication.id, "REJECTED")}
          onMarkPending={() => updateApplicationStatus(selectedApplication.id, "PENDING")}
          loading={actionLoadingId === selectedApplication.id}
        />
      ) : null}
    </AdminShell>
  );
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cls = status === "APPROVED" ? "bg-green-500/12 text-green-200 border-green-400/18" : status === "REJECTED" ? "bg-red-500/12 text-red-200 border-red-400/18" : "bg-yellow-500/12 text-yellow-200 border-yellow-400/18";
  return <span className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${cls}`}>{status}</span>;
};

const ActionButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button onClick={onClick} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.07] transition">{label}</button>
);

const DecisionButton: React.FC<{ color: "green" | "red" | "yellow"; label: string; onClick: () => void }> = ({ color, label, onClick }) => {
  const cls = color === "green" ? "bg-green-600 hover:bg-green-700" : color === "red" ? "bg-red-600 hover:bg-red-700" : "bg-yellow-500 hover:bg-yellow-600";
  return <button onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-bold text-white transition ${cls}`}>{label}</button>;
};

const StudentDetailsModal: React.FC<{
  application: StudentApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkPending: () => void;
  loading: boolean;
}> = ({ application, onClose, onApprove, onReject, onMarkPending, loading }) => {
  const details = Array.isArray(application.student_details) ? application.student_details[0] : application.student_details;
  if (!details) return null;
  const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="border-b border-white/10 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-100">{value || "N/A"}</p>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0c101a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Student Application Details</h2>
            <p className="mt-1 text-sm text-slate-400">Application ID: {application.id}</p>
          </div>
          <button onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-white">Close</button>
        </div>
        <div className="overflow-y-auto p-6">
          <div className="grid gap-x-8 md:grid-cols-2">
            <Item label="Full Name" value={details.full_name} />
            <Item label="Email" value={details.email} />
            <Item label="Phone" value={details.phone} />
            <Item label="Institution" value={details.institution} />
            <Item label="Date of Birth" value={details.date_of_birth} />
            <Item label="CNIC" value={details.cnic} />
            <Item label="Major / Title" value={details.major_or_title} />
            <Item label="Certificate Level" value={details.cert_level} />
            <Item label="Emergency Contact" value={details.emergency_contact} />
            <Item label="Explosives History" value={details.has_explosives_history ? "Yes" : "No"} />
            <Item label="Agrees to Safety Code" value={details.agrees_to_safety_code ? "Yes" : "No"} />
            <Item label="Agrees to Legal Terms" value={details.agrees_to_legal ? "Yes" : "No"} />
            <Item label="Agrees to Pledge" value={details.agrees_to_pledge ? "Yes" : "No"} />
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 bg-white/[0.03] p-6">
          {application.status !== "PENDING" && <DecisionButton color="yellow" label={loading ? "Updating..." : "Mark Pending"} onClick={onMarkPending} />}
          {application.status !== "REJECTED" && <DecisionButton color="red" label={loading ? "Updating..." : "Reject"} onClick={onReject} />}
          {application.status !== "APPROVED" && <DecisionButton color="green" label={loading ? "Updating..." : "Approve"} onClick={onApprove} />}
        </div>
      </div>
    </div>
  );
};

export default StudentApplicationsPage;

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";

type ChapterDetails = {
  application_id: number;
  unit_name: string;
  institution: string;
  advisor_name: string;
  advisor_email: string;
  advisor_phone: string;
  lead_name: string;
  member_count: number;
};

type ComplianceAnswers = {
  application_id: number;
  explosives_history: string;
  anti_weaponization: string;
  campus_approval: string;
};

type ChapterApplication = {
  id: number;
  applicant_type: string;
  member_id: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submitted_at: string;
  chapter_details: ChapterDetails[] | ChapterDetails | null;
  compliance_answers: ComplianceAnswers[] | ComplianceAnswers | null;
};

type TabStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const TABS: TabStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const ChapterApplicationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ChapterApplication[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<ChapterApplication | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING");
  const [counts, setCounts] = useState({
    ALL: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  const getChapterDetails = (
    app: ChapterApplication
  ): ChapterDetails | null => {
    if (!app.chapter_details) return null;
    if (Array.isArray(app.chapter_details)) {
      return app.chapter_details[0] || null;
    }
    return app.chapter_details;
  };

  const getComplianceAnswers = (
    app: ChapterApplication
  ): ComplianceAnswers | null => {
    if (!app.compliance_answers) return null;
    if (Array.isArray(app.compliance_answers)) {
      return app.compliance_answers[0] || null;
    }
    return app.compliance_answers;
  };

  const fetchCounts = async () => {
    try {
      const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("applicant_type", "CHAPTER"),

        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("applicant_type", "CHAPTER")
          .eq("status", "PENDING"),

        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("applicant_type", "CHAPTER")
          .eq("status", "APPROVED"),

        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("applicant_type", "CHAPTER")
          .eq("status", "REJECTED"),
      ]);

      setCounts({
        ALL: allRes.count || 0,
        PENDING: pendingRes.count || 0,
        APPROVED: approvedRes.count || 0,
        REJECTED: rejectedRes.count || 0,
      });
    } catch (err) {
      console.error("Error fetching chapter counts:", err);
    }
  };

  const fetchApplications = async (statusFilter: TabStatus = activeTab) => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/admin/login");
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();

      if (adminError || !adminRow) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      let query = supabase
        .from("applications")
        .select(`
          id,
          applicant_type,
          member_id,
          status,
          submitted_at,
          chapter_details (
            application_id,
            unit_name,
            institution,
            advisor_name,
            advisor_email,
            advisor_phone,
            lead_name,
            member_count
          ),
          compliance_answers (
            application_id,
            explosives_history,
            anti_weaponization,
            campus_approval
          )
        `)
        .eq("applicant_type", "CHAPTER")
        .order("submitted_at", { ascending: false });

      if (statusFilter !== "ALL") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      console.log("chapter list data:", data);
      console.log("chapter list error:", error);

      if (error) {
        console.error("Error fetching chapter applications:", error);
        setApplications([]);
        return;
      }

      setApplications((data || []) as ChapterApplication[]);
    } catch (err) {
      console.error("Unexpected error:", err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchApplications(activeTab);
  }, [activeTab]);

  const updateApplicationStatus = async (
    applicationId: number,
    newStatus: "APPROVED" | "REJECTED" | "PENDING"
  ) => {
    setActionLoadingId(applicationId);

    try {
      const { error } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) {
        console.error("Error updating chapter application:", error);
        return;
      }

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(null);
      }

      await fetchCounts();
      await fetchApplications(activeTab);
    } catch (err) {
      console.error("Unexpected update error:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="min-h-screen relative bg-gray-50">
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "grayscale(100%) contrast(150%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-2xl border-t-4 border-apra-dark overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-gray-100">
            <div>
              <h1 className="text-3xl font-bold font-heading text-apra-dark">
                Chapter Applications
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Review chapter applications submitted to APRO.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Back to Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-apra-blue text-white rounded font-bold hover:bg-apra-dark transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded font-semibold text-sm transition ${
                    activeTab === tab
                      ? "bg-apra-blue text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.charAt(0) + tab.slice(1).toLowerCase()} ({counts[tab]})
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
                Loading chapter applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
                No chapter applications found for this filter.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const details = getChapterDetails(app);

                  return (
                    <div
                      key={app.id}
                      className="border border-gray-200 rounded-lg bg-white shadow-sm p-5"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-apra-dark">
                              {details?.unit_name || "Unnamed Chapter"}
                            </h2>

                            <span
                              className={`px-3 py-1 rounded-full border text-xs font-bold tracking-wide ${getStatusBadgeClass(
                                app.status
                              )}`}
                            >
                              {app.status}
                            </span>
                          </div>

                          <p className="text-sm text-gray-500 mt-1">
                            {details?.institution || "No institution"}
                            {details?.lead_name ? ` • Lead: ${details.lead_name}` : ""}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            Submitted:{" "}
                            {app.submitted_at
                              ? new Date(app.submitted_at).toLocaleString()
                              : "N/A"}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedApplication(app)}
                            className="px-4 py-2 border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                          >
                            View Details
                          </button>

                          {app.status !== "APPROVED" && (
                            <button
                              onClick={() =>
                                updateApplicationStatus(app.id, "APPROVED")
                              }
                              disabled={actionLoadingId === app.id}
                              className="px-4 py-2 bg-green-600 text-white rounded text-sm font-bold hover:bg-green-700 transition disabled:opacity-60"
                            >
                              {actionLoadingId === app.id ? "Updating..." : "Approve"}
                            </button>
                          )}

                          {app.status !== "REJECTED" && (
                            <button
                              onClick={() =>
                                updateApplicationStatus(app.id, "REJECTED")
                              }
                              disabled={actionLoadingId === app.id}
                              className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 transition disabled:opacity-60"
                            >
                              {actionLoadingId === app.id ? "Updating..." : "Reject"}
                            </button>
                          )}

                          {app.status !== "PENDING" && (
                            <button
                              onClick={() =>
                                updateApplicationStatus(app.id, "PENDING")
                              }
                              disabled={actionLoadingId === app.id}
                              className="px-4 py-2 bg-yellow-500 text-white rounded text-sm font-bold hover:bg-yellow-600 transition disabled:opacity-60"
                            >
                              {actionLoadingId === app.id ? "Updating..." : "Mark Pending"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
            Restricted APRO administrative interface.
          </div>
        </div>
      </div>

      {selectedApplication && (
        <ChapterDetailsModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onApprove={() =>
            updateApplicationStatus(selectedApplication.id, "APPROVED")
          }
          onReject={() =>
            updateApplicationStatus(selectedApplication.id, "REJECTED")
          }
          onMarkPending={() =>
            updateApplicationStatus(selectedApplication.id, "PENDING")
          }
          loading={actionLoadingId === selectedApplication.id}
        />
      )}
    </div>
  );
};

type ModalProps = {
  application: ChapterApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkPending: () => void;
  loading: boolean;
};

const ChapterDetailsModal: React.FC<ModalProps> = ({
  application,
  onClose,
  onApprove,
  onReject,
  onMarkPending,
  loading,
}) => {
  const details = Array.isArray(application.chapter_details)
    ? application.chapter_details[0]
    : application.chapter_details;

  const compliance = Array.isArray(application.compliance_answers)
    ? application.compliance_answers[0]
    : application.compliance_answers;

  if (!details) return null;

  const Item = ({
    label,
    value,
  }: {
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="border-b border-gray-100 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="text-sm text-gray-800 mt-1 break-words">
        {value || "N/A"}
      </p>
    </div>
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-700 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-2xl border-t-4 border-apra-dark overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-apra-dark">
                Chapter Application Details
              </h2>

              <span
                className={`px-3 py-1 rounded-full border text-xs font-bold tracking-wide ${getStatusBadgeClass(
                  application.status
                )}`}
              >
                {application.status}
              </span>
            </div>

            <p className="text-sm text-gray-500 mt-1">
              Application ID: {application.id}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm font-semibold"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-x-8">
            <Item label="Unit Name" value={details.unit_name} />
            <Item label="Institution" value={details.institution} />
            <Item label="Lead Name" value={details.lead_name} />
            <Item label="Member Count" value={details.member_count} />
            <Item label="Advisor Name" value={details.advisor_name} />
            <Item label="Advisor Email" value={details.advisor_email} />
            <Item label="Advisor Phone" value={details.advisor_phone} />
            <Item
              label="Explosives History"
              value={compliance?.explosives_history || "N/A"}
            />
            <Item
              label="Anti-Weaponization"
              value={compliance?.anti_weaponization || "N/A"}
            />
            <Item
              label="Campus Approval"
              value={compliance?.campus_approval || "N/A"}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-wrap justify-end gap-3">
          {application.status !== "PENDING" && (
            <button
              onClick={onMarkPending}
              disabled={loading}
              className="px-4 py-2 bg-yellow-500 text-white rounded font-bold hover:bg-yellow-600 transition disabled:opacity-60"
            >
              {loading ? "Updating..." : "Mark Pending"}
            </button>
          )}

          {application.status !== "REJECTED" && (
            <button
              onClick={onReject}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition disabled:opacity-60"
            >
              {loading ? "Updating..." : "Reject"}
            </button>
          )}

          {application.status !== "APPROVED" && (
            <button
              onClick={onApprove}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition disabled:opacity-60"
            >
              {loading ? "Updating..." : "Approve"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterApplicationsPage;
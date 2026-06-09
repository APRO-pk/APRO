import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";

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
  const [selectedApplication, setSelectedApplication] =
    useState<StudentApplication | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING");
  const [counts, setCounts] = useState({
    ALL: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  const getStudentDetails = (app: StudentApplication): StudentDetails | null => {
    if (!app.student_details) return null;
    if (Array.isArray(app.student_details)) {
      return app.student_details[0] || null;
    }
    return app.student_details;
  };

  const fetchCounts = async () => {
    try {
      const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("applicant_type", "STUDENT"),

        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("applicant_type", "STUDENT")
          .eq("status", "PENDING"),

        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("applicant_type", "STUDENT")
          .eq("status", "APPROVED"),

        supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("applicant_type", "STUDENT")
          .eq("status", "REJECTED"),
      ]);

      setCounts({
        ALL: allRes.count || 0,
        PENDING: pendingRes.count || 0,
        APPROVED: approvedRes.count || 0,
        REJECTED: rejectedRes.count || 0,
      });
    } catch (err) {
      console.error("Error fetching counts:", err);
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
        student_details (
          application_id,
          full_name,
          email,
          phone,
          institution,
          date_of_birth,
          has_explosives_history,
          agrees_to_safety_code,
          agrees_to_legal,
          agrees_to_pledge,
          cnic,
          major_or_title,
          cert_level,
          emergency_contact
        )
      `)
      .eq("applicant_type", "STUDENT")
      .order("submitted_at", { ascending: false });

    if (statusFilter !== "ALL") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    console.log("student list data:", data);
    console.log("student list error:", error);

    if (error) {
      console.error("Error fetching student applications:", error);
      setApplications([]);
      return;
    }

    setApplications((data || []) as StudentApplication[]);
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
    setActionError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setActionError("Your admin session has expired. Please sign in again.");
        navigate("/admin/login");
        return;
      }

      const { data: adminRow, error: adminError } = await supabase
        .from("admins")
        .select("id")
        .eq("auth_id", session.user.id)
        .single();

      if (adminError || !adminRow) {
        console.error("Admin validation failed before update:", adminError);
        await supabase.auth.signOut();
        setActionError("You are not authorized to update applications.");
        navigate("/admin/login");
        return;
      }

      const targetApp = applications.find((app) => app.id === applicationId);

      if (!targetApp) {
        console.error("Application not found in local state.");
        setActionError("The selected application could not be found.");
        return;
      }

      if (!targetApp.member_id) {
        console.error("This application is not linked to a member.");
        setActionError("This application is not linked to a member record.");
        return;
      }

      // 1) Update application status
      const { data: updatedApplications, error: applicationError } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId)
        .select("id, status, member_id");

      if (applicationError) {
        console.error("Error updating application:", applicationError);
        setActionError(applicationError.message);
        return;
      }

      if (!updatedApplications || updatedApplications.length === 0) {
        console.error("Application update returned no rows. This usually means RLS blocked the update.", {
          applicationId,
          newStatus,
          sessionUserId: session.user.id,
        });
        setActionError("Application status was not updated. This is likely being blocked by a Supabase RLS policy.");
        return;
      }

      // 2) Update linked member account status
      const { data: updatedMembers, error: memberError } = await supabase
        .from("members")
        .update({ account_status: newStatus })
        .eq("id", targetApp.member_id)
        .select("id, account_status");

      if (memberError) {
        console.error("Error updating member account status:", memberError);
        setActionError(memberError.message);
        return;
      }

      if (!updatedMembers || updatedMembers.length === 0) {
        console.error("Member update returned no rows. This usually means RLS blocked the update.", {
          memberId: targetApp.member_id,
          newStatus,
          sessionUserId: session.user.id,
        });
        setActionError("Member account status was not updated. This is likely being blocked by a Supabase RLS policy.");
        return;
      }

      // 3) Update modal state if open
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
      }

      await fetchCounts();
      await fetchApplications(activeTab);
    }catch (err) {
    console.error("Unexpected update error:", err);
    setActionError(err instanceof Error ? err.message : "Unexpected update error.");
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
                Student Applications
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Review student applications submitted to APRO.
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
            {actionError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            ) : null}

            {loading ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
                Loading student applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
                No student applications found for this filter.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const details = getStudentDetails(app);

                  return (
                    <div
                      key={app.id}
                      className="border border-gray-200 rounded-lg bg-white shadow-sm p-5"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-apra-dark">
                              {details?.full_name || "Unnamed Applicant"}
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
                            {details?.email || "No email"}{" "}
                            {details?.institution ? `• ${details.institution}` : ""}
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
        <StudentDetailsModal
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
  application: StudentApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkPending: () => void;
  loading: boolean;
};

const StudentDetailsModal: React.FC<ModalProps> = ({
  application,
  onClose,
  onApprove,
  onReject,
  onMarkPending,
  loading,
}) => {
  const details = Array.isArray(application.student_details)
    ? application.student_details[0]
    : application.student_details;

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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-2xl border-t-4 border-apra-dark overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-apra-dark">
              Student Application Details
            </h2>
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
            <Item label="Full Name" value={details.full_name} />
            <Item label="Email" value={details.email} />
            <Item label="Phone" value={details.phone} />
            <Item label="Institution" value={details.institution} />
            <Item label="Date of Birth" value={details.date_of_birth} />
            <Item label="CNIC" value={details.cnic} />
            <Item label="Major / Title" value={details.major_or_title} />
            <Item label="Certificate Level" value={details.cert_level} />
            <Item label="Emergency Contact" value={details.emergency_contact} />
            <Item
              label="Explosives History"
              value={details.has_explosives_history ? "Yes" : "No"}
            />
            <Item
              label="Agrees to Safety Code"
              value={details.agrees_to_safety_code ? "Yes" : "No"}
            />
            <Item
              label="Agrees to Legal Terms"
              value={details.agrees_to_legal ? "Yes" : "No"}
            />
            <Item
              label="Agrees to Pledge"
              value={details.agrees_to_pledge ? "Yes" : "No"}
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

export default StudentApplicationsPage;

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";

type CareerApplication = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role_type: string;
  why_join: string;
  resume_path: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submitted_at: string;
};

type TabStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const TABS: TabStatus[] = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const CareerApplicationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [selectedApplication, setSelectedApplication] =
    useState<CareerApplication | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING");
  const [counts, setCounts] = useState({
    ALL: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  const fetchCounts = async () => {
    try {
      const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
        supabase
          .from("career_applications")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("career_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "PENDING"),

        supabase
          .from("career_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "APPROVED"),

        supabase
          .from("career_applications")
          .select("id", { count: "exact", head: true })
          .eq("status", "REJECTED"),
      ]);

      setCounts({
        ALL: allRes.count || 0,
        PENDING: pendingRes.count || 0,
        APPROVED: approvedRes.count || 0,
        REJECTED: rejectedRes.count || 0,
      });
    } catch (err) {
      console.error("Error fetching career counts:", err);
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
        .from("career_applications")
        .select(`
          id,
          full_name,
          email,
          phone,
          role_type,
          why_join,
          resume_path,
          status,
          submitted_at
        `)
        .order("submitted_at", { ascending: false });

      if (statusFilter !== "ALL") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      console.log("career list data:", data);
      console.log("career list error:", error);

      if (error) {
        console.error("Error fetching career applications:", error);
        setApplications([]);
        return;
      }

      setApplications((data || []) as CareerApplication[]);
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
        .from("career_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) {
        console.error("Error updating career application:", error);
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
                Career Applications
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Review career applications submitted to APRO.
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
                Loading career applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-600">
                No career applications found for this filter.
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-gray-200 rounded-lg bg-white shadow-sm p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold text-apra-dark">
                            {app.full_name || "Unnamed Applicant"}
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
                          {app.email || "No email"}
                          {app.role_type ? ` • ${app.role_type}` : ""}
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
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
            Restricted APRO administrative interface.
          </div>
        </div>
      </div>

      {selectedApplication && (
        <CareerDetailsModal
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
  application: CareerApplication;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onMarkPending: () => void;
  loading: boolean;
};

const CareerDetailsModal: React.FC<ModalProps> = ({
  application,
  onClose,
  onApprove,
  onReject,
  onMarkPending,
  loading,
}) => {
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
                Career Application Details
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
            <Item label="Full Name" value={application.full_name} />
            <Item label="Email" value={application.email} />
            <Item label="Phone" value={application.phone} />
            <Item label="Role Type" value={application.role_type} />
            <Item label="Status" value={application.status} />
            <Item
              label="Submitted At"
              value={
                application.submitted_at
                  ? new Date(application.submitted_at).toLocaleString()
                  : "N/A"
              }
            />
            <div className="md:col-span-2">
              <Item label="Why Join" value={application.why_join} />
            </div>
            <div className="md:col-span-2 border-b border-gray-100 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Resume
              </p>
              {application.resume_path ? (
                <button
                    onClick={async () => {
                        if (!application.resume_path) return;

                        const { data, error } = await supabase.storage
                        .from("resumes")
                        .createSignedUrl(application.resume_path, 60);
                        console.log("resume_path from DB:", application.resume_path);

                        if (error) {
                            console.error("Error creating signed URL:", error);
                            return;
                        }

                        window.open(data.signedUrl, "_blank");
                    }}
                    className="text-sm text-apra-blue font-semibold hover:underline mt-1 inline-block"
                    >
                    View Resume
                </button>
              ) : (
                <p className="text-sm text-gray-800 mt-1">N/A</p>
              )}
            </div>
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

export default CareerApplicationsPage;
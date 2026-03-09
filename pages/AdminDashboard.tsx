import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";

type AdminUser = {
  id: number;
  username: string;
  auth_id: string;
};

type DashboardStats = {
  students: number;
  chapters: number;
  careers: number;
  pendingStudents: number;
  pendingChapters: number;
  pendingCareers: number;
};

const APPLICATION_TYPES = {
  STUDENT: "STUDENT",
  CHAPTER: "CHAPTER",
};

const STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    students: 0,
    chapters: 0,
    careers: 0,
    pendingStudents: 0,
    pendingChapters: 0,
    pendingCareers: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
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
          .select("id, username, auth_id")
          .eq("auth_id", session.user.id)
          .single();

        if (adminError || !adminRow) {
          await supabase.auth.signOut();
          navigate("/admin/login");
          return;
        }

        setAdmin(adminRow);

        const [
          studentCountRes,
          chapterCountRes,
          careerCountRes,
          pendingStudentRes,
          pendingChapterRes,
          pendingCareerRes,
        ] = await Promise.all([
          supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("applicant_type", APPLICATION_TYPES.STUDENT),

          supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("applicant_type", APPLICATION_TYPES.CHAPTER),

          supabase
            .from("career_applications")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("applicant_type", APPLICATION_TYPES.STUDENT)
            .eq("status", STATUS.PENDING),

          supabase
            .from("applications")
            .select("*", { count: "exact", head: true })
            .eq("applicant_type", APPLICATION_TYPES.CHAPTER)
            .eq("status", STATUS.PENDING),

          supabase
            .from("career_applications")
            .select("*", { count: "exact", head: true })
            .eq("status", STATUS.PENDING),
        ]);

        setStats({
          students: studentCountRes.count || 0,
          chapters: chapterCountRes.count || 0,
          careers: careerCountRes.count || 0,
          pendingStudents: pendingStudentRes.count || 0,
          pendingChapters: pendingChapterRes.count || 0,
          pendingCareers: pendingCareerRes.count || 0,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white px-6 py-4 rounded-lg shadow border-t-4 border-apra-dark">
          <p className="text-gray-700 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
                APRO Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back{admin?.username ? `, ${admin.username}` : ""}.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="px-4 py-2 border border-gray-300 rounded text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                View Site
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
            <p className="text-sm text-gray-600">
              Manage applications, review submissions, and monitor APRO onboarding activity.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Student Applications
                </p>
                <h2 className="text-3xl font-bold text-apra-dark mt-3">
                  {stats.students}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Pending: {stats.pendingStudents}
                </p>
                <Link
                  to="/admin/students"
                  className="inline-block mt-4 text-sm font-bold text-apra-blue hover:underline"
                >
                  View student applications →
                </Link>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Chapter Applications
                </p>
                <h2 className="text-3xl font-bold text-apra-dark mt-3">
                  {stats.chapters}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Pending: {stats.pendingChapters}
                </p>
                <Link
                  to="/admin/chapters"
                  className="inline-block mt-4 text-sm font-bold text-apra-blue hover:underline"
                >
                  View chapter applications →
                </Link>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                  Career Applications
                </p>
                <h2 className="text-3xl font-bold text-apra-dark mt-3">
                  {stats.careers}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Pending: {stats.pendingCareers}
                </p>
                <Link
                  to="/admin/careers"
                  className="inline-block mt-4 text-sm font-bold text-apra-blue hover:underline"
                >
                  View career applications →
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-apra-dark mb-4">
                  Quick Actions
                </h3>

                <div className="space-y-3">
                  <Link
                    to="/admin/students"
                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition"
                  >
                    <span className="font-semibold text-gray-800">
                      Review Student Applications
                    </span>
                  </Link>

                  <Link
                    to="/admin/chapters"
                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition"
                  >
                    <span className="font-semibold text-gray-800">
                      Review Chapter Applications
                    </span>
                  </Link>

                  <Link
                    to="/admin/careers"
                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition"
                  >
                    <span className="font-semibold text-gray-800">
                      Review Career Applications
                    </span>
                  </Link>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-apra-dark mb-4">
                  Overview
                </h3>

                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span>Total Student Applications</span>
                    <span className="font-bold">{stats.students}</span>
                  </div>

                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span>Total Chapter Applications</span>
                    <span className="font-bold">{stats.chapters}</span>
                  </div>

                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span>Total Career Applications</span>
                    <span className="font-bold">{stats.careers}</span>
                  </div>

                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span>Total Pending Reviews</span>
                    <span className="font-bold">
                      {stats.pendingStudents +
                        stats.pendingChapters +
                        stats.pendingCareers}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
            Restricted APRO administrative interface.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
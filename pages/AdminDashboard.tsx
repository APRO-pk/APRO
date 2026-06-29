import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { AdminShell, GhostButton, SurfacePanel } from "../components/PageScaffold";

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
          supabase.from("applications").select("*", { count: "exact", head: true }).eq("applicant_type", APPLICATION_TYPES.STUDENT),
          supabase.from("applications").select("*", { count: "exact", head: true }).eq("applicant_type", APPLICATION_TYPES.CHAPTER),
          supabase.from("career_applications").select("*", { count: "exact", head: true }),
          supabase.from("applications").select("*", { count: "exact", head: true }).eq("applicant_type", APPLICATION_TYPES.STUDENT).eq("status", STATUS.PENDING),
          supabase.from("applications").select("*", { count: "exact", head: true }).eq("applicant_type", APPLICATION_TYPES.CHAPTER).eq("status", STATUS.PENDING),
          supabase.from("career_applications").select("*", { count: "exact", head: true }).eq("status", STATUS.PENDING),
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

  return (
    <AdminShell
      eyebrow="Admin"
      title="APRO Admin Dashboard"
      description={`Manage onboarding, approvals, and submissions${admin?.username ? ` for ${admin.username}` : ""}.`}
      actions={
        <>
          <GhostButton to="/">View site</GhostButton>
          <button onClick={handleLogout} className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">
            Logout
          </button>
        </>
      }
    >
      {loading ? (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-4 text-slate-200">
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <StatsCard title="Student Applications" count={stats.students} pending={stats.pendingStudents} to="/admin/students" accent="violet" />
            <StatsCard title="Chapter Applications" count={stats.chapters} pending={stats.pendingChapters} to="/admin/chapters" accent="cyan" />
            <StatsCard title="Career Applications" count={stats.careers} pending={stats.pendingCareers} to="/admin/careers" accent="fuchsia" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SurfacePanel>
              <h3 className="text-lg font-bold text-white">Quick Actions</h3>
              <div className="mt-4 space-y-3">
                <QuickLink to="/admin/students" label="Review Student Applications" />
                <QuickLink to="/admin/chapters" label="Review Chapter Applications" />
                <QuickLink to="/admin/careers" label="Review Career Applications" />
                <QuickLink to="/admin/feedback" label="Manage Feedback & Bugs" />
              </div>
            </SurfacePanel>

            <SurfacePanel>
              <h3 className="text-lg font-bold text-white">Overview</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <OverviewRow label="Total Student Applications" value={stats.students} />
                <OverviewRow label="Total Chapter Applications" value={stats.chapters} />
                <OverviewRow label="Total Career Applications" value={stats.careers} />
                <OverviewRow label="Total Pending Reviews" value={stats.pendingStudents + stats.pendingChapters + stats.pendingCareers} />
              </div>
            </SurfacePanel>
          </div>
        </>
      )}
    </AdminShell>
  );
};

const StatsCard: React.FC<{
  title: string;
  count: number;
  pending: number;
  to: string;
  accent: "violet" | "cyan" | "fuchsia";
}> = ({ title, count, pending, to, accent }) => {
  const accentClass =
    accent === "cyan"
      ? "bg-[linear-gradient(180deg,rgba(18,24,44,0.9),rgba(8,10,18,0.96))]"
      : accent === "fuchsia"
        ? "bg-[linear-gradient(180deg,rgba(30,21,46,0.88),rgba(8,10,18,0.96))]"
        : "";
  const linkClass = accent === "cyan" ? "text-cyan-200" : accent === "fuchsia" ? "text-fuchsia-200" : "text-violet-200";

  return (
    <SurfacePanel className={`p-5 ${accentClass}`}>
      <p className="text-sm font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <h2 className="mt-3 text-3xl font-bold text-white">{count}</h2>
      <p className="mt-2 text-sm text-slate-400">Pending: {pending}</p>
      <Link to={to} className={`mt-4 inline-block text-sm font-bold hover:underline ${linkClass}`}>
        View applications
      </Link>
    </SurfacePanel>
  );
};

const QuickLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link to={to} className="block w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.07]">
    <span className="font-semibold text-slate-100">{label}</span>
  </Link>
);

const OverviewRow: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex justify-between border-b border-white/10 pb-2">
    <span>{label}</span>
    <span className="font-bold">{value}</span>
  </div>
);

export default AdminDashboard;

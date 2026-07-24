import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { AdminShell, GhostButton, SurfacePanel } from "../components/PageScaffold";
import type { AdminEvent } from "../src/lib/forms-types";

const AdminEventsList: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_events")
      .select("*")
      .order("created_at", { ascending: false });
    setEvents((data as AdminEvent[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const statusColor = (s: string) =>
    s === "open" ? "bg-emerald-500/12 text-emerald-200 border-emerald-400/18"
    : s === "closed" ? "bg-red-500/12 text-red-200 border-red-400/18"
    : "bg-slate-500/12 text-slate-200 border-slate-400/18";

  return (
    <AdminShell
      eyebrow="Admin / Events"
      title="Event Registration Forms"
      description="Create and manage event registration forms with custom fields."
      actions={
        <>
          <GhostButton to="/admin/dashboard">Dashboard</GhostButton>
          <button onClick={handleLogout} className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">
            Logout
          </button>
        </>
      }
    >
      <div className="mb-6">
        <Link to="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_12px_28px_rgba(61,28,120,0.32)] transition hover:-translate-y-0.5">
          <Plus size={18} /> New Event
        </Link>
      </div>

      {loading ? (
        <SurfacePanel>Loading events…</SurfacePanel>
      ) : events.length === 0 ? (
        <SurfacePanel>No events yet. Create one to get started.</SurfacePanel>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <SurfacePanel key={ev.id} className="p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-white">{ev.title}</h2>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-bold tracking-wide ${statusColor(ev.status)}`}>
                      {ev.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{ev.slug} {ev.location ? `· ${ev.location}` : ""}</p>
                  <p className="text-xs text-slate-500">Created {new Date(ev.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/events/${ev.id}`}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07]">
                    Manage
                  </Link>
                  <a href={`#/events/${ev.slug}/register`} target="_blank" rel="noreferrer"
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.07]">
                    View Form
                  </a>
                </div>
              </div>
            </SurfacePanel>
          ))}
        </div>
      )}
    </AdminShell>
  );
};

export default AdminEventsList;
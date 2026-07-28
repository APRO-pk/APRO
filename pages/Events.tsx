import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, FileText, Zap, Rocket, Clock, CalendarCheck } from "lucide-react";
import { GhostButton, PageHero, PageScaffold, SectionBand, SurfacePanel } from "../components/PageScaffold";
import { supabase } from "../src/lib/supabase";
import type { AdminEvent } from "../src/lib/forms-types";

type DisplayEvent = AdminEvent & {
  daysUntilDeadline: number | null;
  sessionLabel: string;
  isPast: boolean;
};

function isBeforeToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

const Events: React.FC = () => {
  const [openEvents, setOpenEvents] = useState<DisplayEvent[]>([]);
  const [comingSoonEvents, setComingSoonEvents] = useState<DisplayEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("admin_events")
        .select("*")
        .in("status", ["open", "coming_soon", "closed"])
        .order("created_at", { ascending: true });

      const now = Date.now();
      const mapped = ((data as AdminEvent[]) || []).map((ev) => {
        const deadline = ev.reg_deadline ? new Date(ev.reg_deadline).getTime() : null;
        const daysUntilDeadline = deadline ? Math.max(0, Math.ceil((deadline - now) / 86400000)) : null;

        const sessions = (ev.sessions || []).filter((s: any) => s.date);
        const sessionLabel = sessions.length > 0
          ? sessions.map((s: any) => {
              let label = s.date;
              if (s.startTime) label += ` ${s.startTime}`;
              if (s.endTime) label += `–${s.endTime}`;
              return label;
            }).join(", ")
          : "";

        const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
        const isPast = lastSession && lastSession.date ? isBeforeToday(lastSession.date) : false;

        return { ...ev, daysUntilDeadline, sessionLabel, isPast };
      });

      setOpenEvents(mapped.filter((e) => e.status === "open" && !e.isPast));
      setComingSoonEvents(mapped.filter((e) => e.status === "coming_soon"));
      setPastEvents(mapped.filter((e) => e.status === "closed" || e.isPast || (e.status === "open" && e.isPast)));
      setLoading(false);
    };
    load();
  }, []);

  const EventCard = (ev: DisplayEvent) => (
    <SurfacePanel key={ev.id}>
      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
        <FileText className="h-6 w-6 text-violet-100" />
      </div>
      <h3 className="mt-8 text-3xl font-bold tracking-[-0.05em] text-white">{ev.title}</h3>
      {ev.description && (
        <p className="mt-4 text-base leading-8 text-slate-300/76 line-clamp-3">{ev.description}</p>
      )}
      {ev.sessionLabel && (
        <p className="mt-3 text-sm text-slate-400">📅 {ev.sessionLabel}</p>
      )}
      {ev.daysUntilDeadline !== null && (
        <p className="mt-1 text-xs text-slate-500">
          {ev.daysUntilDeadline === 0 ? "Deadline today" : `${ev.daysUntilDeadline} day${ev.daysUntilDeadline === 1 ? "" : "s"} to register`}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Link to={`/events/${ev.slug}/register`}
          className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_12px_28px_rgba(61,28,120,0.32)] transition hover:-translate-y-0.5">
          Register
        </Link>
        <Link to={`/events/${ev.slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-300 transition hover:-translate-y-0.5 hover:bg-white/[0.08]">
          Details
        </Link>
      </div>
    </SurfacePanel>
  );

  return (
    <PageScaffold>
      <PageHero
        eyebrow="Manifest"
        title="Mission path from design to launch."
        description="APRO workshops are structured as phases, not isolated events. Each block moves members closer to disciplined technical work and future flight capability."
      />

      {/* Active */}
      <SectionBand className="bg-[linear-gradient(180deg,rgba(18,20,38,0.96),rgba(8,10,18,0.98))]">
        <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Active Training</div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full text-sm text-slate-400">Loading events…</p>
          ) : openEvents.length === 0 ? (
            <p className="col-span-full text-sm text-slate-400">No active training events right now. Check back soon.</p>
          ) : (
            openEvents.map(EventCard)
          )}
        </div>
      </SectionBand>

      {/* Coming Soon */}
      {comingSoonEvents.length > 0 && (
        <SectionBand className="bg-[linear-gradient(180deg,rgba(10,28,34,0.92),rgba(8,10,18,0.98))]">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400 flex items-center gap-2"><Clock size={14} /> Coming Soon</div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {comingSoonEvents.map((ev) => (
              <SurfacePanel key={ev.id} className="bg-[linear-gradient(180deg,rgba(20,30,42,0.86),rgba(8,10,18,0.94))]">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
                  <Zap className="h-6 w-6 text-cyan-100" />
                </div>
                <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Coming Soon</div>
                <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">{ev.title}</h3>
                {ev.description && <p className="mt-4 text-base leading-8 text-slate-300/76">{ev.description}</p>}
              </SurfacePanel>
            ))}
          </div>
        </SectionBand>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <SectionBand className="bg-[linear-gradient(180deg,rgba(24,15,48,0.88),rgba(8,10,18,1))]">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400 flex items-center gap-2"><CalendarCheck size={14} /> Past Events</div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {pastEvents.map(EventCard)}
          </div>
        </SectionBand>
      )}

      {/* Roadmap */}
      <SectionBand className="bg-[linear-gradient(180deg,rgba(24,15,48,0.88),rgba(8,10,18,1))]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Award className="h-6 w-6 text-violet-100" />
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Roadmap</div>
            <h2 className="mt-4 max-w-[13ch] text-[clamp(2.8rem,4.8vw,5.4rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white">
              National certification trials.
            </h2>
          </div>
          <div>
            <p className="max-w-3xl text-base leading-8 text-slate-300/76">
              The long-term goal is a structured certification process for amateur
              rocketeers around the world, built on real standards rather than informal
              experimentation.
            </p>
          </div>
        </div>
      </SectionBand>
    </PageScaffold>
  );
};

export default Events;

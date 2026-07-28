import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { PageScaffold } from "../components/PageScaffold";
import type { AdminEvent } from "../src/lib/forms-types";
import { X, Calendar, MapPin, Users, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const EventDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [participants, setParticipants] = useState<{ name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const { data: ev } = await supabase
        .from("admin_events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (!ev) { setLoading(false); return; }
      setEvent(ev as AdminEvent);

      const { data: resps } = await supabase
        .from("form_responses")
        .select("respondent_name, respondent_email")
        .eq("event_id", ev.id);
      setParticipants((resps || []).map((r) => ({ name: r.respondent_name || "Anonymous", email: r.respondent_email || "" })));
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <PageScaffold><div className="flex min-h-[60vh] items-center justify-center"><div className="text-slate-400 animate-pulse">Loading…</div></div></PageScaffold>;
  if (!event) return <PageScaffold><div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold text-white">Event not found</h2><Link to="/events" className="mt-4 inline-block text-violet-300 hover:underline">Back to events</Link></div></div></PageScaffold>;

  const completed = event.completed;
  const photos = completed?.photos || [];
  const sessions = (event.sessions || []).filter((s) => s.date);
  const sessionLabel = sessions.length > 0
    ? sessions.map((s) => `${s.date}${s.startTime ? ` ${s.startTime}` : ""}${s.endTime ? `–${s.endTime}` : ""}`).join(", ")
    : "";

  return (
    <PageScaffold>
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4" onClick={() => setLightboxIndex(null)}>
          <button onClick={() => setLightboxIndex(null)} className="absolute top-6 right-6 text-white/70 hover:text-white z-10"><X size={28} /></button>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length); }} className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"><ChevronLeft size={36} /></button>
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % photos.length); }} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"><ChevronRight size={36} /></button>
            </>
          )}
          <img src={photos[lightboxIndex]} alt="" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 text-xs text-white/50">{lightboxIndex + 1} / {photos.length}</div>
        </div>
      )}

      {/* Hero header */}
      <header className="relative mx-auto w-full max-w-[1400px] px-5 md:px-8 xl:px-12 pt-8">
        <div className="mb-2">
          <Link to="/events" className="text-xs uppercase tracking-[0.2em] text-violet-300 hover:text-violet-200">← Back to Events</Link>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-[-0.05em] text-white">{event.title}</h1>
        {event.description && <p className="mt-4 max-w-3xl text-lg text-slate-300/80 leading-relaxed">{event.description}</p>}
        {completed?.completed_at && <p className="mt-2 text-sm text-slate-500">Completed {new Date(completed.completed_at).toLocaleDateString()}</p>}
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-[1400px] px-5 md:px-8 xl:px-12 mt-8">
        <div className="grid gap-10 xl:grid-cols-[1fr_380px]">

          {/* === LEFT: Photo album + Blog === */}
          <div>
            {/* Photo album */}
            {photos.length > 0 && (
              <div className="mb-10">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.slice(0, 5).map((url, i) => {
                    const isLast = i === 4 && photos.length > 5;
                    return (
                      <button key={i} onClick={() => setLightboxIndex(i)}
                        className={`group relative overflow-hidden rounded-2xl ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
                        <img src={url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" style={{ aspectRatio: i === 0 ? "16/9" : "4/3" }} />
                        {isLast && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-bold text-white">
                            +{photos.length - 5}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Blog */}
            {completed?.blog && (
              <div className="prose prose-invert prose-lg max-w-none mb-10 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_h4]:text-white [&_p]:text-slate-300/85 [&_li]:text-slate-300/85 [&_a]:text-violet-300 [&_blockquote]:border-l-violet-500 [&_blockquote]:text-slate-400 [&_code]:text-violet-200 [&_pre]:bg-white/[0.04] [&_pre]:border [&_pre]:border-white/10 [&_img]:rounded-2xl" dangerouslySetInnerHTML={{ __html: completed.blog }} />
            )}
          </div>

          {/* === RIGHT: Info sidebar === */}
          <aside className="xl:border-l xl:border-white/10 xl:pl-10 space-y-8">
            {/* Info card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Event Details</h2>
              {sessionLabel && (
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="mt-0.5 shrink-0 text-violet-300" />
                  <div><p className="text-sm font-semibold text-white">Date</p><p className="text-sm text-slate-400">{sessionLabel}</p></div>
                </div>
              )}
              {event.location && (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-violet-300" />
                  <div><p className="text-sm font-semibold text-white">Location</p><p className="text-sm text-slate-400">{event.location}</p></div>
                </div>
              )}
              {event.capacity > 0 && (
                <div className="flex items-start gap-3">
                  <Users size={18} className="mt-0.5 shrink-0 text-violet-300" />
                  <div><p className="text-sm font-semibold text-white">Capacity</p><p className="text-sm text-slate-400">{event.capacity}</p></div>
                </div>
              )}
              {event.reg_deadline && (
                <div className="flex items-start gap-3">
                  <Clock size={18} className="mt-0.5 shrink-0 text-violet-300" />
                  <div><p className="text-sm font-semibold text-white">Registration Deadline</p><p className="text-sm text-slate-400">{new Date(event.reg_deadline).toLocaleDateString()}</p></div>
                </div>
              )}
            </div>

            {/* Register */}
            {(event.status === "open" || event.status === "coming_soon") && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
                <Link to={`/events/${event.slug}/register`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_12px_28px_rgba(61,28,120,0.32)] transition hover:-translate-y-0.5">
                  Register Now
                </Link>
              </div>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Participants ({participants.length})</h2>
                <div className="flex -space-x-3 overflow-hidden mb-4">
                  {participants.slice(0, 10).map((p, i) => {
                    const colors = ["bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600", "bg-cyan-600", "bg-fuchsia-600", "bg-lime-600", "bg-indigo-600", "bg-teal-600", "bg-orange-600"];
                    return (
                      <div key={i}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-900 ${colors[i % colors.length]} text-xs font-bold text-white shadow-lg`}
                        title={`${p.name} (${p.email})`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    );
                  })}
                  {participants.length > 10 && (
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-900 bg-gray-700 text-xs font-bold text-white shadow-lg">
                      +{participants.length - 10}
                    </div>
                  )}
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className={`h-7 w-7 shrink-0 rounded-full ${["bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600", "bg-cyan-600", "bg-fuchsia-600", "bg-lime-600", "bg-indigo-600", "bg-teal-600", "bg-orange-600"][i % 10]} flex items-center justify-center text-[10px] font-bold text-white`}>
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-300 truncate">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Spacer */}
      <div className="h-20" />
    </PageScaffold>
  );
};

export default EventDetail;

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { AdminShell, GhostButton, SurfacePanel } from "../components/PageScaffold";
import type { AdminEvent, FormField } from "../src/lib/forms-types";
import { FIELD_TYPES, FIELD_TYPE_LABELS } from "../src/lib/forms-types";
import { ArrowUp, ArrowDown, Trash2, Plus, Save, Check, X, Copy, ExternalLink, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TabId = "details" | "fields" | "responses";

const AdminEventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;
  const [tab, setTab] = useState<TabId>(isNew ? "details" : "details");
  const [event, setEvent] = useState<AdminEvent>({
    id: "", admin_id: 0, title: "", description: "", slug: "",
    event_days: 1,
    sessions: [{ date: "", startTime: "", endTime: "" }],
    location: "", capacity: 0,
    reg_deadline: null, status: "draft",
    audience: "public",
    header_type: "text", header_content: "",
    completed: null,
    created_at: "", updated_at: "",
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [fieldSaveMsg, setFieldSaveMsg] = useState("");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completeBlog, setCompleteBlog] = useState("");
  const [completePhotos, setCompletePhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Load ---------- */
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: ev } = await supabase.from("admin_events").select("*").eq("id", id).single();
    if (ev) setEvent(ev as AdminEvent);
    const { data: flds } = await supabase.from("form_fields").select("*").eq("event_id", id).order("field_order", { ascending: true });
    setFields((flds as FormField[]) || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  /* ---------- Save Event Details ---------- */
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg("");

    if (isNew) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setSaveMsg("Not authenticated"); setSaving(false); return; }
      const { data: adminRow } = await supabase.from("admins").select("id").eq("auth_id", session.user.id).single();
      if (!adminRow) { setSaveMsg("Admin not found"); setSaving(false); return; }

      const { data: created, error } = await supabase.from("admin_events").insert({
        title: event.title,
        description: event.description,
        slug: event.slug,
        event_days: event.event_days,
        sessions: event.sessions,
        location: event.location,
        capacity: event.capacity,
        reg_deadline: event.reg_deadline,
        status: event.status,
        audience: event.audience,
        header_type: event.header_type,
        header_content: event.header_content,
        admin_id: adminRow.id,
      }).select("id").single();

      if (error || !created) {
        setSaveMsg(error?.message || "Failed to create");
        setSaving(false);
        return;
      }
      navigate(`/admin/events/${created.id}`, { replace: true });
      return;
    }

    const { error } = await supabase.from("admin_events").update({
      title: event.title,
      description: event.description,
      slug: event.slug,
      event_days: event.event_days,
      sessions: event.sessions,
      location: event.location,
      capacity: event.capacity,
      reg_deadline: event.reg_deadline,
      status: event.status,
      header_type: event.header_type,
      header_content: event.header_content,
      completed: event.completed,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) setSaveMsg(error.message);
    else setSaveMsg("Saved");
    setSaving(false);
  };

  /* ---------- Field Operations ---------- */
  const addField = async () => {
    if (!id) return;
    const order = fields.length;
    const { data, error } = await supabase.from("form_fields").insert({
      event_id: id,
      field_type: "short_text",
      label: "New Field",
      field_order: order,
      options: [],
    }).select("id").single();
    if (error) return;
    setFields([...fields, {
      id: data.id,
      event_id: id,
      field_type: "short_text",
      label: "New Field",
      placeholder: "",
      required: false,
      field_order: order,
      options: [],
      min: null, max: null, step: null,
      image_src: "",
      image_fit: "cover",
      image_width: null,
      image_height: null,
      html_content: "",
      created_at: new Date().toISOString(),
    }]);
  };

  const updateField = async (f: FormField) => {
    await supabase.from("form_fields").update({
      field_type: f.field_type,
      label: f.label,
      placeholder: f.placeholder,
      required: f.required,
      field_order: f.field_order,
      options: f.options,
      min: f.min, max: f.max, step: f.step,
      image_src: f.image_src,
      image_fit: f.image_fit,
      image_width: f.image_width,
      image_height: f.image_height,
      html_content: f.html_content,
    }).eq("id", f.id);
  };

  const saveAllFields = async () => {
    setFieldSaveMsg("");
    for (const f of fields) {
      const { error } = await supabase.from("form_fields").update({
        field_type: f.field_type,
        label: f.label,
        placeholder: f.placeholder,
        required: f.required,
        field_order: f.field_order,
        options: f.options,
        min: f.min, max: f.max, step: f.step,
        image_src: f.image_src,
        image_fit: f.image_fit,
        image_width: f.image_width,
        image_height: f.image_height,
        html_content: f.html_content,
      }).eq("id", f.id);
      if (error) { setFieldSaveMsg(error.message); return; }
    }
    setFieldSaveMsg("Fields saved");
  };

  const deleteEvent = async () => {
    if (!window.confirm(`Delete "${event.title}"? This will also remove all form fields and responses permanently.`)) return;
    await supabase.from("admin_events").delete().eq("id", id);
    navigate("/admin/events", { replace: true });
  };

  const completeEvent = async () => {
    if (!id) return;
    await supabase.from("admin_events").update({
      status: "closed",
      completed: { blog: completeBlog, photos: completePhotos, completed_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    setEvent((prev) => prev ? { ...prev, status: "closed", completed: { blog: completeBlog, photos: completePhotos, completed_at: new Date().toISOString() } } : prev);
    setShowCompleteDialog(false);
    setSaveMsg("Event marked as completed");
  };

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setPhotoUploadError("");
    setUploadingPhotos(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `completed_photos/${id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("event_photos").upload(path, file);
      if (error) { setPhotoUploadError(error.message); setUploadingPhotos(false); return; }
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = `${supabaseUrl}/storage/v1/object/public/event_photos/${path}`;
      setCompletePhotos((prev) => [...prev, url]);
    } catch (err: any) { setPhotoUploadError(err?.message || "Upload failed"); }
    finally { setUploadingPhotos(false); if (photoInputRef.current) photoInputRef.current.value = ""; }
  };

  const removePhoto = (index: number) => setCompletePhotos((prev) => prev.filter((_, i) => i !== index));

  const removeField = async (fieldId: string) => {
    await supabase.from("form_fields").delete().eq("id", fieldId);
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const moveField = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= fields.length) return;
    const next = [...fields];
    [next[index], next[to]] = [next[to], next[index]];
    next.forEach((f, i) => { f.field_order = i; updateField(f); });
    setFields(next);
  };

  /* ---------- Render ---------- */
  if (loading) return <AdminShell title="Loading…" description="">{null}</AdminShell>;

  const tabs: { id: TabId; label: string }[] = [
    { id: "details", label: "Event Details" },
    { id: "fields", label: `Fields (${fields.length})` },
    { id: "responses", label: "Responses" },
  ];

  const set = (field: string, val: any) => setEvent((prev) => prev ? { ...prev, [field]: val } : prev);

  return (
    <AdminShell
      eyebrow="Admin / Events"
      title={event.title || "Untitled Event"}
      description="Manage event details, form fields, and view responses."
      actions={
        <>
          <GhostButton to="/admin/events">All events</GhostButton>
          <a href={`/#/events/${event.slug}/register`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">View Form</a>
        </>
      }
    >
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === t.id ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {saveMsg && (
        <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${saveMsg === "Saved" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" : "border-red-400/20 bg-red-400/10 text-red-100"}`}>
          {saveMsg}
        </div>
      )}

      {/* Tab: Details */}
      {tab === "details" && (
        <form onSubmit={handleSaveEvent} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <FieldBlock label="Title">
              <input value={event.title} onChange={(e) => set("title", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" required />
            </FieldBlock>
            <FieldBlock label="Slug">
              <input value={event.slug} onChange={(e) => set("slug", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" required placeholder="my-event" />
            </FieldBlock>
          </div>

          <FieldBlock label="Description">
            <textarea value={event.description} onChange={(e) => set("description", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28 min-h-[80px] resize-y" />
          </FieldBlock>

          <div className="grid gap-5 md:grid-cols-2">
            <FieldBlock label="Number of Days">
              <input type="number" min={1} max={30} value={event.event_days}
                onChange={(e) => {
                  const n = Math.max(1, Number(e.target.value));
                  const s = event.sessions;
                  const sessions = Array.from({ length: n }, (_, i) => s[i] || { date: "", startTime: "", endTime: "" });
                  set("sessions", sessions);
                  set("event_days", n);
                }}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
            </FieldBlock>
            <FieldBlock label="Registration Deadline">
              <input type="date" value={event.reg_deadline ? event.reg_deadline.slice(0, 10) : ""} onChange={(e) => set("reg_deadline", e.target.value ? new Date(e.target.value).toISOString() : null)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
            </FieldBlock>
          </div>

          {event.sessions.map((session, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Day {i + 1}</p>
              <div className="grid gap-4 md:grid-cols-3">
                <FieldBlock label="Date">
                  <input type="date" value={session.date} onChange={(e) => {
                    const next = [...event.sessions];
                    next[i] = { ...next[i], date: e.target.value };
                    set("sessions", next);
                  }} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
                </FieldBlock>
                <FieldBlock label="Start Time">
                  <input type="time" value={session.startTime} onChange={(e) => {
                    const next = [...event.sessions];
                    next[i] = { ...next[i], startTime: e.target.value };
                    set("sessions", next);
                  }} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
                </FieldBlock>
                <FieldBlock label="End Time">
                  <input type="time" value={session.endTime} onChange={(e) => {
                    const next = [...event.sessions];
                    next[i] = { ...next[i], endTime: e.target.value };
                    set("sessions", next);
                  }} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
                </FieldBlock>
              </div>
            </div>
          ))}

          <div className="grid gap-5 md:grid-cols-3">
            <FieldBlock label="Location">
              <input value={event.location} onChange={(e) => set("location", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
            </FieldBlock>
            <FieldBlock label="Capacity (0 = unlimited)">
              <input type="number" min={0} value={event.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
            </FieldBlock>
            <FieldBlock label="Status">
              <select value={event.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28">
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
            </FieldBlock>
            <FieldBlock label="Audience">
              <select value={event.audience} onChange={(e) => set("audience", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28">
                <option value="public">Public (anyone can register)</option>
                <option value="members">Members only</option>
              </select>
            </FieldBlock>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <FieldBlock label="Header Type">
              <select value={event.header_type} onChange={(e) => set("header_type", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28">
                <option value="text">Text Only</option>
                <option value="image">Image Banner</option>
                <option value="video">Video Banner</option>
                <option value="model">3D Model</option>
                <option value="html">Custom HTML</option>
              </select>
            </FieldBlock>
            <FieldBlock label="Header Content">
              {event.header_type === "html" ? (
                <textarea value={event.header_content} onChange={(e) => set("header_content", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28 min-h-[200px] font-mono" placeholder="<div>Your custom HTML here</div>" />
              ) : (
                <input value={event.header_content} onChange={(e) => set("header_content", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" placeholder={event.header_type === "image" ? "https://…" : event.header_type === "video" ? "https://… or embed URL" : event.header_type === "model" ? "https://… 3D model URL" : "Leave blank"} />
              )}
            </FieldBlock>
          </div>

          {/* Copy registration link */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Registration Link</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 truncate rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
                {window.location.origin}/#/events/{event.slug}/register
              </code>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/#/events/${event.slug}/register`); }} className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white transition">
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_12px_28px_rgba(61,28,120,0.32)] transition hover:-translate-y-0.5 disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            {!isNew && (
              <button type="button" onClick={() => { setCompleteBlog(event.completed?.blog || ""); setCompletePhotos(event.completed?.photos || []); setShowCompleteDialog(true); }}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-8 py-3 text-sm font-bold uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-400/20">
                Completed Event Details
              </button>
            )}
            {!isNew && (
              <button type="button" onClick={deleteEvent}
                className="inline-flex items-center gap-2 rounded-full border border-red-400/20 px-8 py-3 text-sm font-bold uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-400/10">
                Delete Event
              </button>
            )}
          </div>
        </form>
      )}

      {/* Tab: Fields */}
      {tab === "fields" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <button onClick={addField}
              className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(61,28,120,0.3)] transition hover:-translate-y-0.5">
              <Plus size={16} /> Add Field
            </button>
            <button onClick={saveAllFields}
              className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(61,28,120,0.3)] transition hover:-translate-y-0.5">
              <Save size={16} /> Save Fields
            </button>
            {fieldSaveMsg && (
              <span className={`text-sm ${fieldSaveMsg === "Fields saved" ? "text-emerald-400" : "text-red-400"}`}>{fieldSaveMsg}</span>
            )}
          </div>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <FieldEditor
                key={f.id}
                field={f}
                onUpdate={(updated) => { const next = [...fields]; next[i] = updated; setFields(next); }}
                onRemove={() => removeField(f.id)}
                onMoveUp={() => moveField(i, -1)}
                onMoveDown={() => moveField(i, 1)}
                isFirst={i === 0}
                isLast={i === fields.length - 1}
              />
            ))}
            {fields.length === 0 && (
              <SurfacePanel><p className="text-sm text-slate-400">No fields yet. Click "Add Field" to start building your form.</p></SurfacePanel>
            )}
          </div>
        </div>
      )}

      {/* Tab: Responses */}
      {tab === "responses" && (
        <ResponsesTab eventId={id!} fields={fields} />
      )}

      {/* Completed Event Dialog */}
      {showCompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,15,28,0.98),rgba(8,10,18,1))] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Completed Event Details</h2>
              <button onClick={() => setShowCompleteDialog(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Blog Content (HTML)</p>
                <textarea value={completeBlog} onChange={(e) => setCompleteBlog(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28 min-h-[200px] font-mono resize-y" placeholder="<h2>What we learned…</h2><p>…</p>" />
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Photos ({completePhotos.length})</p>
                {completePhotos.length === 0 && <p className="mb-3 text-xs text-slate-500">No photos uploaded yet.</p>}
                <div className="mb-3 space-y-1">
                  {completePhotos.map((url, i) => {
                    const name = url.split("/").pop()?.split("?")[0] || `photo-${i + 1}`;
                    return (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                        <span className="text-sm text-slate-300 truncate">{name}</span>
                        <button onClick={() => removePhoto(i)} className="shrink-0 text-red-400 hover:text-red-300"><X size={14} /></button>
                      </div>
                    );
                  })}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.06]">
                  <input ref={photoInputRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" disabled={uploadingPhotos} />
                  {uploadingPhotos ? "Uploading…" : "Upload Photo"}
                </label>
                {photoUploadError && <p className="mt-2 text-xs text-red-400">{photoUploadError}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={completeEvent}
                  className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(61,28,120,0.3)] transition hover:-translate-y-0.5">
                  Save Completed Details
                </button>
                <button onClick={() => setShowCompleteDialog(false)}
                  className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06]">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

/* ========== Field Editor Component ========== */

const FieldEditor: React.FC<{
  field: FormField;
  onUpdate: (f: FormField) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ field, onUpdate, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const set = (key: string, val: any) => onUpdate({ ...field, [key]: val });
  const updateOptions = (val: string) => {
    // Split by newline or semicolon; keep empty lines for editing
    const parts = val.includes(";") ? val.split(";") : val.split("\n");
    set("options", parts.map((s) => s.trim()));
  };
  const displayOnly = ["text", "image", "separator", "rich_html"];

  return (
    <SurfacePanel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input value={field.label} onChange={(e) => set("label", e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white outline-none focus:border-violet-300/28" placeholder="Field label" />
            {FIELD_TYPES.map((t) => (
              <button key={t} onClick={() => set("field_type", t)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide transition ${field.field_type === t ? "bg-violet-500/20 text-violet-200" : "border border-white/10 text-slate-400 hover:bg-white/[0.04]"}`}>
                {FIELD_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {!displayOnly.includes(field.field_type) && (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={field.required} onChange={(e) => set("required", e.target.checked)} className="accent-violet-500" />
                Required
              </label>
              <input value={field.placeholder} onChange={(e) => set("placeholder", e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none focus:border-violet-300/28 w-48" placeholder="Placeholder" />
            </div>
          )}

          {["dropdown", "checkboxes", "radio_buttons"].includes(field.field_type) && (
            <div>
              <p className="mb-1 text-xs text-slate-500">Options (one per line)</p>
              <textarea value={(field.options || []).join("\n")} onChange={(e) => updateOptions(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-300/28 min-h-[60px] resize-y" />
            </div>
          )}

          {(field.field_type === "number" || field.field_type === "slider") && (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-400">Min <input type="number" value={field.min ?? ""} onChange={(e) => set("min", e.target.value ? Number(e.target.value) : null)} className="ml-1 w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white outline-none" /></label>
              <label className="text-xs text-slate-400">Max <input type="number" value={field.max ?? ""} onChange={(e) => set("max", e.target.value ? Number(e.target.value) : null)} className="ml-1 w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white outline-none" /></label>
              {field.field_type === "slider" && (
                <label className="text-xs text-slate-400">Step <input type="number" step="any" value={field.step ?? ""} onChange={(e) => set("step", e.target.value ? Number(e.target.value) : null)} className="ml-1 w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white outline-none" /></label>
              )}
            </div>
          )}

          {field.field_type === "text" && (
            <textarea value={field.label} onChange={(e) => set("label", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-300/28 min-h-[80px] resize-y" placeholder="Write your text content here…" />
          )}

          {field.field_type === "image" && (
            <div className="space-y-3">
              <input value={field.image_src} onChange={(e) => set("image_src", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-300/28" placeholder="Image URL" />
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs text-slate-400">Fit
                  <select value={field.image_fit || "cover"} onChange={(e) => set("image_fit", e.target.value)} className="ml-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white outline-none">
                    <option value="cover">Cover (zoom)</option>
                    <option value="contain">Contain (fit)</option>
                    <option value="fill">Stretch</option>
                    <option value="none">None (original)</option>
                  </select>
                </label>
                <label className="text-xs text-slate-400">Width (px)
                  <input type="number" value={field.image_width ?? ""} onChange={(e) => set("image_width", e.target.value ? Number(e.target.value) : null)} className="ml-1 w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white outline-none" />
                </label>
                <label className="text-xs text-slate-400">Height (px)
                  <input type="number" value={field.image_height ?? ""} onChange={(e) => set("image_height", e.target.value ? Number(e.target.value) : null)} className="ml-1 w-20 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-white outline-none" />
                </label>
              </div>
            </div>
          )}

          {field.field_type === "rich_html" && (
            <div className="space-y-3">
              <textarea value={field.html_content || ""} onChange={(e) => set("html_content", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-mono text-white outline-none focus:border-violet-300/28 min-h-[120px] resize-y" placeholder="<div>Your custom HTML here</div>" />
              {field.html_content && (
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">Preview</p>
                  <RichHtmlPreview html={field.html_content} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button onClick={onMoveUp} disabled={isFirst} className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30"><ArrowUp size={16} /></button>
          <button onClick={onMoveDown} disabled={isLast} className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30"><ArrowDown size={16} /></button>
          <button onClick={onRemove} className="rounded-lg p-1.5 text-red-400 hover:bg-red-400/10"><Trash2 size={16} /></button>
        </div>
      </div>
    </SurfacePanel>
  );
};

/* ========== Responses Tab ========== */

type FlatResponse = { responseId: string; name: string; email: string; submittedAt: string; answers: Record<string, any> };

const ResponsesTab: React.FC<{ eventId: string; fields: FormField[] }> = ({ eventId, fields }) => {
  const [responses, setResponses] = useState<FlatResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FlatResponse | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [profileIds, setProfileIds] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProfiles = async () => {
      const emails = [...new Set(responses.map((r) => r.email).filter(Boolean))];
      if (emails.length === 0) return;
      const uniqueEmails = [...new Set(emails)];
      const { data } = await supabase.rpc("get_user_ids_by_emails", { emails: uniqueEmails });
      if (data) {
        const map: Record<string, string> = {};
        for (const row of data) { map[row.email] = row.id; }
        // Look up which of those have community profiles
        const ids = Object.values(map);
        if (ids.length > 0) {
          const { data: profiles } = await supabase.from("community_profiles").select("id").in("id", ids);
          if (profiles) {
            const profileIdSet = new Set(profiles.map((p) => p.id));
            for (const email of Object.keys(map)) {
              if (!profileIdSet.has(map[email])) delete map[email];
            }
          }
        }
        setProfileIds(map);
      }
    };
    if (responses.length > 0) loadProfiles();
  }, [responses]);

  const deleteResponse = async (responseId: string) => {
    setDeleting(responseId);
    await supabase.from("form_field_responses").delete().eq("response_id", responseId);
    await supabase.from("form_responses").delete().eq("id", responseId);
    setResponses((prev) => prev.filter((r) => r.responseId !== responseId));
    setSelected((prev) => prev?.responseId === responseId ? null : prev);
    setDeleting(null);
    setConfirmDelete(null);
  };

  const exportPdf = () => {
    const skipTypes = new Set(["file_upload", "image", "separator", "rich_html", "text"]);
    const exportFields = fields.filter((f) => !skipTypes.has(f.field_type));
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(14);
    doc.text("Form Responses", 14, 14);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`${responses.length} response(s)`, 14, 20);
    doc.setTextColor(0);
    const head = ["Name", "Email", "Submitted At", ...exportFields.map((f) => f.label)];
    const body = responses.map((r) => [
      r.name || "—",
      r.email || "—",
      new Date(r.submittedAt).toLocaleString(),
      ...exportFields.map((f) => {
        const v = r.answers[f.id];
        if (Array.isArray(v)) return v.join(", ");
        return v != null && v !== "" ? String(v) : "—";
      }),
    ]);
    autoTable(doc, {
      head: [head],
      body,
      startY: 24,
      styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [76, 29, 149], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      margin: { left: 14, right: 14 },
    });
    doc.save(`form-responses-${eventId.slice(0, 8)}.pdf`);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: respData } = await supabase
        .from("form_responses")
        .select("*")
        .eq("event_id", eventId)
        .order("submitted_at", { ascending: false });

      if (!respData) { setLoading(false); return; }

      const respIds = respData.map((r) => r.id);
      const { data: fieldRespData } = await supabase
        .from("form_field_responses")
        .select("*")
        .in("response_id", respIds);

      const fieldByResp: Record<string, Record<string, any>> = {};
      for (const fr of fieldRespData || []) {
        if (!fieldByResp[fr.response_id]) fieldByResp[fr.response_id] = {};
        fieldByResp[fr.response_id][fr.field_id] = fr.value;
      }

      setResponses(respData.map((r) => ({
        responseId: r.id,
        name: r.respondent_name || "",
        email: r.respondent_email || "",
        submittedAt: r.submitted_at,
        answers: fieldByResp[r.id] || {},
      })));
      setLoading(false);
    };
    load();
  }, [eventId]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">{responses.length} response(s)</p>
        <button onClick={exportPdf} disabled={responses.length === 0}
          className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-4 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0">
          <Download size={14} /> Export Data (PDF)
        </button>
      </div>
      {loading ? (
        <SurfacePanel>Loading responses…</SurfacePanel>
      ) : responses.length === 0 ? (
        <SurfacePanel>No responses yet.</SurfacePanel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            {responses.map((r) => (
              <div key={r.responseId} className="group relative">
                <button onClick={() => setSelected(r)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selected?.responseId === r.responseId ? "border-violet-500/30 bg-violet-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
                  <p className="text-sm font-bold text-white">{r.name || "Anonymous"}</p>
                  <p className="text-xs text-slate-400">{r.email || "No email"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{new Date(r.submittedAt).toLocaleString()}</p>
                </button>
                {confirmDelete === r.responseId ? (
                  <div className="mt-1 flex items-center gap-2 px-1">
                    <span className="text-xs text-red-400">Delete?</span>
                    <button onClick={() => deleteResponse(r.responseId)} disabled={deleting === r.responseId}
                      className="rounded-lg bg-red-500/20 px-2 py-1 text-xs font-bold text-red-300 hover:bg-red-500/30">Yes</button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="rounded-lg bg-white/10 px-2 py-1 text-xs text-slate-400 hover:bg-white/20">No</button>
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(r.responseId); }}
                    className="absolute right-2 top-2 rounded-lg p-1.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-400/10 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {selected && (
            <SurfacePanel className="p-5">
              <h3 className="text-lg font-bold text-white mb-4">Response Details</h3>
              <div className="space-y-3">
                <div className="border-b border-white/10 pb-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Name</p>
                  <p className="text-sm text-slate-100">{selected.name || "—"}</p>
                </div>
                <div className="border-b border-white/10 pb-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-100">{selected.email || "—"}</p>
                    {profileIds[selected.email] && (
                      <a href={`/#/community/user/${profileIds[selected.email]}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition" title="Visit community profile">
                        <ExternalLink size={12} /> Profile
                      </a>
                    )}
                  </div>
                </div>
                {fields.map((f) => {
                  const val = selected.answers[f.id];
                  const isUrl = typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"));
                  const isImage = isUrl && /\.(png|jpg|jpeg|gif|webp|avif|svg)(\?.*)?$/i.test(val);
                  return (
                    <div key={f.id} className="border-b border-white/10 pb-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{f.label}</p>
                      {isImage ? (
                        <button onClick={() => setLightboxUrl(val)} className="block"><img src={val} alt="" className="mt-1 max-h-40 rounded-lg object-contain cursor-pointer transition hover:opacity-80" /></button>
                      ) : isUrl ? (
                        <a href={val} target="_blank" rel="noreferrer" className="text-sm text-violet-300 hover:underline break-words">View file ↗</a>
                      ) : (
                        <p className="text-sm text-slate-100 break-words">{Array.isArray(val) ? val.join(", ") : val != null ? String(val) : "—"}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </SurfacePanel>
          )}
        </div>
      )}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4" onClick={() => setLightboxUrl(null)}>
          <button onClick={() => setLightboxUrl(null)} className="absolute top-6 right-6 text-white/70 hover:text-white z-10"><X size={28} /></button>
          <img src={lightboxUrl} alt="" className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

/* ========== Rich HTML Preview with script execution ========== */

const RichHtmlPreview: React.FC<{ html: string }> = ({ html }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const root = ref.current;
    const scripts = root.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest("[data-clipboard], [data-copy-target]") as HTMLElement | null;
      if (!btn) return;
      let text: string | null = null;
      if (btn.dataset.clipboard) {
        text = btn.dataset.clipboard;
      } else if (btn.dataset.copyTarget) {
        const src = root.querySelector(btn.dataset.copyTarget);
        text = src?.textContent?.trim() ?? null;
      }
      if (!text) return;
      e.preventDefault();
      navigator.clipboard.writeText(text).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = text!;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(ta);
      });
      const toast = btn.querySelector("[data-copy-toast]") || btn.parentElement?.querySelector("[data-copy-toast]");
      if (toast) {
        toast.classList.add("vzp-show");
        setTimeout(() => toast.classList.remove("vzp-show"), 1400);
      }
      btn.classList.add("vzp-copied");
      setTimeout(() => btn.classList.remove("vzp-copied"), 1400);
    };
    root.addEventListener("click", handler);
    return () => root.removeEventListener("click", handler);
  }, [html]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
};

/* ========== Shared ========== */

const FieldBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
    {children}
  </label>
);

export default AdminEventDetail;
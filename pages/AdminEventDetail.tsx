import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { AdminShell, GhostButton, SurfacePanel } from "../components/PageScaffold";
import type { AdminEvent, FormField } from "../src/lib/forms-types";
import { FIELD_TYPES, FIELD_TYPE_LABELS } from "../src/lib/forms-types";
import { ArrowUp, ArrowDown, Trash2, Plus, Check, X, Copy } from "lucide-react";

type TabId = "details" | "fields" | "responses";

const AdminEventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;
  const [tab, setTab] = useState<TabId>(isNew ? "details" : "details");
  const [event, setEvent] = useState<AdminEvent>({
    id: "", admin_id: 0, title: "", description: "", slug: "",
    start_date: null, end_date: null, location: "", capacity: 0,
    reg_deadline: null, status: "draft",
    header_type: "text", header_content: "",
    created_at: "", updated_at: "",
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

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
        ...event,
        admin_id: adminRow.id,
        updated_at: new Date().toISOString(),
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
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      capacity: event.capacity,
      reg_deadline: event.reg_deadline,
      status: event.status,
      header_type: event.header_type,
      header_content: event.header_content,
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
    }).eq("id", f.id);
  };

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const set = (field: string, val: any) => setEvent((prev) => prev ? { ...prev, [field]: val } : prev);

  return (
    <AdminShell
      eyebrow="Admin / Events"
      title={event.title || "Untitled Event"}
      description="Manage event details, form fields, and view responses."
      actions={
        <>
          <GhostButton to="/admin/events">All events</GhostButton>
          <button onClick={handleLogout} className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">Logout</button>
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

          <div className="grid gap-5 md:grid-cols-3">
            <FieldBlock label="Start Date">
              <input type="datetime-local" value={event.start_date ? event.start_date.slice(0, 16) : ""} onChange={(e) => set("start_date", e.target.value ? new Date(e.target.value).toISOString() : null)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
            </FieldBlock>
            <FieldBlock label="End Date">
              <input type="datetime-local" value={event.end_date ? event.end_date.slice(0, 16) : ""} onChange={(e) => set("end_date", e.target.value ? new Date(e.target.value).toISOString() : null)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
            </FieldBlock>
            <FieldBlock label="Registration Deadline">
              <input type="datetime-local" value={event.reg_deadline ? event.reg_deadline.slice(0, 16) : ""} onChange={(e) => set("reg_deadline", e.target.value ? new Date(e.target.value).toISOString() : null)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
            </FieldBlock>
          </div>

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
              </select>
            </FieldBlock>
            <FieldBlock label="Header Content (URL or embed)">
              <input value={event.header_content} onChange={(e) => set("header_content", e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" placeholder={event.header_type === "image" ? "https://…" : event.header_type === "video" ? "https://… or embed URL" : event.header_type === "model" ? "https://… 3D model URL" : "Leave blank"} />
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

          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_12px_28px_rgba(61,28,120,0.32)] transition hover:-translate-y-0.5 disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      )}

      {/* Tab: Fields */}
      {tab === "fields" && (
        <div>
          <button onClick={addField}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(61,28,120,0.3)] transition hover:-translate-y-0.5">
            <Plus size={16} /> Add Field
          </button>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <FieldEditor
                key={f.id}
                field={f}
                onUpdate={(updated) => { const next = [...fields]; next[i] = updated; setFields(next); updateField(updated); }}
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
  const updateOptions = (val: string) => set("options", val.split("\n").filter((s) => s.trim()));

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

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input type="checkbox" checked={field.required} onChange={(e) => set("required", e.target.checked)} className="accent-violet-500" />
              Required
            </label>
            <input value={field.placeholder} onChange={(e) => set("placeholder", e.target.value)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white outline-none focus:border-violet-300/28 w-48" placeholder="Placeholder" />
          </div>

          {["dropdown", "checkboxes", "radio_buttons"].includes(field.field_type) && (
            <div>
              <p className="mb-1 text-xs text-slate-500">Options (one per line)</p>
              <textarea value={(field.options || []).join("\n")} onChange={(e) => updateOptions(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-violet-300/28 min-h-[60px]" />
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
      <p className="mb-4 text-sm text-slate-400">{responses.length} response(s)</p>
      {loading ? (
        <SurfacePanel>Loading responses…</SurfacePanel>
      ) : responses.length === 0 ? (
        <SurfacePanel>No responses yet.</SurfacePanel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            {responses.map((r) => (
              <button key={r.responseId} onClick={() => setSelected(r)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selected?.responseId === r.responseId ? "border-violet-500/30 bg-violet-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
                <p className="text-sm font-bold text-white">{r.name || "Anonymous"}</p>
                <p className="text-xs text-slate-400">{r.email || "No email"}</p>
                <p className="mt-1 text-[11px] text-slate-500">{new Date(r.submittedAt).toLocaleString()}</p>
              </button>
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
                  <p className="text-sm text-slate-100">{selected.email || "—"}</p>
                </div>
                {fields.map((f) => {
                  const val = selected.answers[f.id];
                  const display = Array.isArray(val) ? val.join(", ") : val != null ? String(val) : "—";
                  return (
                    <div key={f.id} className="border-b border-white/10 pb-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{f.label}</p>
                      <p className="text-sm text-slate-100 break-words">{display}</p>
                    </div>
                  );
                })}
              </div>
            </SurfacePanel>
          )}
        </div>
      )}
    </div>
  );
};

/* ========== Shared ========== */

const FieldBlock: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
    {children}
  </label>
);

export default AdminEventDetail;
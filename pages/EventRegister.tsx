import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { PageScaffold, SectionBand } from "../components/PageScaffold";
import type { AdminEvent, FormField } from "../src/lib/forms-types";
import { FIELD_TYPE_LABELS } from "../src/lib/forms-types";

type FormValues = Record<string, any>;
type FieldErrors = Record<string, string>;

const EventRegister: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);

      const { data: sesh } = await supabase.auth.getSession();
      setSession(sesh?.session ?? null);

      const { data: ev, error: evErr } = await supabase
        .from("admin_events")
        .select("*")
        .eq("slug", slug)
        .single();
      if (evErr || !ev) { setLoading(false); return; }
      setEvent(ev as AdminEvent);

      const { data: flds } = await supabase
        .from("form_fields")
        .select("*")
        .eq("event_id", ev.id)
        .order("field_order", { ascending: true });
      setFields((flds as FormField[]) || []);
      setLoading(false);
    };
    load();
  }, [slug]);

  const set = (fieldId: string, val: any) =>
    setValues((prev) => ({ ...prev, [fieldId]: val }));

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    for (const f of fields) {
      if (!f.required) continue;
      const v = values[f.id];
      if (f.field_type === "checkboxes") {
        if (!v || (Array.isArray(v) && v.length === 0))
          errs[f.id] = "This field is required";
      } else if (f.field_type === "file_upload") {
        if (!v) errs[f.id] = "This field is required";
      } else if (v === undefined || v === null || String(v).trim() === "") {
        errs[f.id] = "This field is required";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const responseId = crypto.randomUUID();

      const { error: respErr } = await supabase
        .from("form_responses")
        .insert({
          id: responseId,
          event_id: event.id,
          respondent_name: values["_name"] || "",
          respondent_email: values["_email"] || "",
        });

      if (respErr) {
        setSubmitError(respErr?.message || "Failed to submit");
        setSubmitting(false);
        return;
      }

      const inserts = fields
        .filter((f) => values[f.id] !== undefined && values[f.id] !== null)
        .map((f) => ({
          response_id: responseId,
          field_id: f.id,
          value: JSON.stringify(values[f.id]),
        }));

      if (inserts.length > 0) {
        const { error: fieldErr } = await supabase
          .from("form_field_responses")
          .insert(inserts.map((r) => ({ ...r, value: JSON.parse(r.value) })));
        if (fieldErr) {
          setSubmitError(fieldErr.message);
          setSubmitting(false);
          return;
        }
      }

      setSuccess(true);
    } catch {
      setSubmitError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageScaffold>
        <SectionBand>
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-3xl">✓</div>
            <h2 className="mt-6 text-3xl font-bold text-white">Registration Submitted</h2>
            <p className="mt-3 text-slate-300/80">Your response has been recorded.</p>
            <Link to="/" className="mt-6 inline-block text-violet-300 hover:underline">Back to home</Link>
          </div>
        </SectionBand>
      </PageScaffold>
    );
  }

  return (
    <PageScaffold>
      {loading ? (
        <SectionBand>
          <div className="py-16 text-center text-slate-400">Loading event form…</div>
        </SectionBand>
      ) : !event ? (
        <SectionBand>
          <div className="py-16 text-center">
            <h2 className="text-2xl font-bold text-white">Event not found</h2>
            <Link to="/" className="mt-4 inline-block text-violet-300 hover:underline">Back to home</Link>
          </div>
        </SectionBand>
      ) : event.status !== "open" ? (
        <SectionBand>
          <div className="py-16 text-center">
            <h2 className="text-2xl font-bold text-white">Registration is closed</h2>
            <p className="mt-3 text-slate-300/80">This event is no longer accepting registrations.</p>
            <Link to="/" className="mt-4 inline-block text-violet-300 hover:underline">Back to home</Link>
          </div>
        </SectionBand>
      ) : (
        <SectionBand>
          {/* Header */}
          {event.header_type === "image" && event.header_content && (
            <img src={event.header_content} alt="" className="mb-6 w-full rounded-2xl object-cover max-h-80" />
          )}
          {event.header_type === "video" && event.header_content && (
            <div className="mb-6 aspect-video w-full overflow-hidden rounded-2xl">
              <iframe src={event.header_content} className="h-full w-full" allowFullScreen title="Event header" />
            </div>
          )}
          {event.header_type === "html" && event.header_content && (
            <div className="-mx-8 md:-mx-10 -mt-8 md:-mt-10 mb-6 rounded-b-[36px] overflow-hidden" dangerouslySetInnerHTML={{ __html: event.header_content }} />
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">{event.title}</h1>
            {event.description && <p className="mt-3 text-slate-300/80 leading-relaxed">{event.description}</p>}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
              {event.sessions?.[0]?.date && (
                <span>📅 {event.sessions.map((s, i) => `${s.date}${s.startTime ? ` ${s.startTime}` : ""}${s.endTime ? `–${s.endTime}` : ""}`).join(", ")}</span>
              )}
              {event.location && <span>📍 {event.location}</span>}
              {event.capacity > 0 && <span>👥 Capacity: {event.capacity}</span>}
            </div>
          </div>

          {event.audience === "members" && !session ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-6 py-8 text-center">
              <div className="mx-auto mb-3 text-4xl">🔒</div>
              <h2 className="text-xl font-bold text-white">Members Only</h2>
              <p className="mt-2 text-slate-300/80">This event is only for registered members. Please log in to register.</p>
            </div>
          ) : (
            <>
              {submitError && (
                <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{submitError}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldInput label="Your Name" required>
                    <input value={values["_name"] || ""} onChange={(e) => set("_name", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
                  </FieldInput>
                  <FieldInput label="Your Email" required>
                    <input type="email" value={values["_email"] || ""} onChange={(e) => set("_email", e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-violet-300/28" />
                  </FieldInput>
                </div>

                {fields.map((f) => (
                  <FormFieldRenderer
                    key={f.id}
                    field={f}
                    value={values[f.id]}
                    error={errors[f.id]}
                    onChange={(val) => set(f.id, val)}
                  />
                ))}

                <button type="submit" disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),0_18px_28px_rgba(61,28,120,0.28)] transition hover:-translate-y-0.5 disabled:opacity-60">
                  {submitting ? "Submitting…" : "Submit Registration"}
                </button>
              </form>
            </>
          )}
        </SectionBand>
      )}
    </PageScaffold>
  );
};

/* ---------- Helper Components ---------- */

const FieldInput: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-slate-200">
      {label} {required && <span className="text-red-400">*</span>}
    </span>
    {children}
  </label>
);

const FormFieldRenderer: React.FC<{
  field: FormField;
  value: any;
  error?: string;
  onChange: (val: any) => void;
}> = ({ field, value, error, onChange }) => {
  const baseInput = "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/28";

  const render = () => {
    switch (field.field_type) {
      case "short_text":
        return <input className={baseInput} placeholder={field.placeholder} value={value || ""} onChange={(e) => onChange(e.target.value)} />;

      case "long_text":
        return <textarea className={`${baseInput} min-h-[100px] resize-y`} placeholder={field.placeholder} value={value || ""} onChange={(e) => onChange(e.target.value)} />;

      case "number":
        return <input type="number" className={baseInput} placeholder={field.placeholder} min={field.min ?? undefined} max={field.max ?? undefined} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;

      case "slider":
        return (
          <div className="flex items-center gap-4">
            <input type="range" min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1} value={value ?? field.min ?? 0} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-violet-500" />
            <span className="w-10 text-center text-sm font-bold text-white">{value ?? field.min ?? 0}</span>
          </div>
        );

      case "date":
        return <input type="date" className={baseInput} value={value || ""} onChange={(e) => onChange(e.target.value)} />;

      case "time":
        return <input type="time" className={baseInput} value={value || ""} onChange={(e) => onChange(e.target.value)} />;

      case "datetime":
        return <input type="datetime-local" className={baseInput} value={value || ""} onChange={(e) => onChange(e.target.value)} />;

      case "dropdown":
        return (
          <select className={baseInput} value={value || ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">{field.placeholder || "Select…"}</option>
            {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );

      case "radio_buttons":
        return (
          <div className="space-y-2">
            {(field.options || []).map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name={field.id} value={opt} checked={value === opt} onChange={() => onChange(opt)}
                  className="accent-violet-500" />
                <span className="text-sm text-slate-200">{opt}</span>
              </label>
            ))}
          </div>
        );

      case "checkboxes":
        return (
          <div className="space-y-2">
            {(field.options || []).map((opt) => {
              const checked = Array.isArray(value) && value.includes(opt);
              return (
                <label key={opt} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={checked || false}
                    onChange={() => {
                      const arr = Array.isArray(value) ? [...value] : [];
                      onChange(checked ? arr.filter((v: string) => v !== opt) : [...arr, opt]);
                    }}
                    className="accent-violet-500" />
                  <span className="text-sm text-slate-200">{opt}</span>
                </label>
              );
            })}
          </div>
        );

      case "file_upload":
        return (
          <input type="file" className="text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-violet-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-200 hover:file:bg-violet-500/30"
            onChange={(e) => onChange(e.target.files?.[0]?.name || null)} />
        );

      default:
        return <p className="text-sm text-slate-500">Unsupported field type</p>;
    }
  };

  return (
    <div>
      <FieldInput label={field.label} required={field.required}>{render()}</FieldInput>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

export default EventRegister;
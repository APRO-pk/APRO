import React, { useEffect, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { FormShell, formInputClass, formLabelClass } from "../components/PageScaffold";

type JobOpening = { id: string; title: string; category: string; description: string; status: "OPEN" | "CLOSED" };

const JoinAproApplication: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleType: "",
    whyJoin: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [jobOpeningId, setJobOpeningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase.from("job_openings").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (!cancelled && data) setOpenings(data as JobOpening[]);
    });
    return () => { cancelled = true; };
  }, []);

  const openingsForCategory = openings.filter(o => o.category === formData.roleType && o.status === "OPEN");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!resumeFile) {
      setMessage("Please upload your CV / Resume.");
      return;
    }

    try {
      setSubmitting(true);
      const fileExt = resumeFile.name.split(".").pop();
      const safeName = formData.fullName.trim().replace(/\s+/g, "_").toLowerCase();
      const uniqueFileName = `${Date.now()}_${safeName}.${fileExt}`;
      const filePath = `career-applications/${uniqueFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, resumeFile, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("career_applications").insert([
        {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          role_type: formData.roleType,
          why_join: formData.whyJoin || null,
          resume_path: filePath,
          job_opening_id: jobOpeningId,
        },
      ]);
      if (insertError) throw insertError;

      setMessage("Application submitted successfully.");
      setFormData({ fullName: "", email: "", phone: "", roleType: "", whyJoin: "" });
      setResumeFile(null);
      setJobOpeningId(null);
      const fileInput = document.getElementById("resume") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      setMessage(error.message || "Something went wrong while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormShell
      eyebrow="Join APRO"
      title="Contributor application."
      description="Use this route for internships, part-time roles, full-time roles, or contract collaboration with APRO."
    >
      <form className="space-y-8" onSubmit={handleSubmit}>
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-[-0.03em] text-white">Applicant Information</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={formLabelClass}>Full Name</label>
              <input name="fullName" className={formInputClass} required value={formData.fullName} onChange={handleChange} />
            </div>
            <div>
              <label className={formLabelClass}>Email Address</label>
              <input type="email" name="email" className={formInputClass} required value={formData.email} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className={formLabelClass}>Phone Number</label>
              <input name="phone" className={formInputClass} value={formData.phone} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className={formLabelClass}>Role Type</label>
              <select name="roleType" className={formInputClass} required value={formData.roleType} onChange={e => { handleChange(e); setJobOpeningId(null); }}>
                <option value="" disabled>Select an option...</option>
                <option value="Internship">Internship</option>
                <option value="Part-Time Role">Part-Time Role</option>
                <option value="Full-Time Role">Full-Time Role</option>
                <option value="Freelance / Contract">Freelance / Contract</option>
              </select>
            </div>
            {formData.roleType && (
              <div className="md:col-span-2">
                <label className={formLabelClass}>Current Openings — {formData.roleType}</label>
                {openingsForCategory.length === 0 ? (
                  <p className="text-sm text-slate-500">No open positions in this category right now. You can still apply and we will keep you on file.</p>
                ) : (
                  <div className="space-y-2">
                    {openingsForCategory.map(o => {
                      const selected = jobOpeningId === o.id;
                      const expanded = expandedId === o.id;
                      return (
                        <div key={o.id} className={`rounded-xl border transition ${selected ? "border-violet-400/40 bg-violet-500/10" : "border-white/10 bg-white/[0.03]"}`}>
                          <button type="button" onClick={() => setJobOpeningId(prev => prev === o.id ? null : o.id)} className="flex w-full items-start gap-3 p-3 text-left">
                            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition ${selected ? "border-violet-400 bg-violet-500 text-white" : "border-white/25"}`}>
                              {selected && <Check size={10} strokeWidth={3} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="text-sm font-semibold text-white">{o.title}</span>
                              {o.description ? (
                                <span className="mt-1 block text-[10px] uppercase tracking-[0.15em] text-violet-300/70">{o.category}</span>
                              ) : null}
                            </span>
                          </button>
                          {o.description ? (
                            <>
                              <button type="button" onClick={() => setExpandedId(prev => prev === o.id ? null : o.id)}
                                className="inline-flex items-center gap-1 px-3 pb-2 text-[11px] font-semibold text-violet-300 hover:text-violet-200 transition">
                                {expanded ? "Hide details" : "Show details"} <ChevronDown size={13} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                              </button>
                              {expanded && <p className="px-3 pb-3 text-xs leading-5 text-slate-300 whitespace-pre-line">{o.description}</p>}
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="md:col-span-2">
              <label className={formLabelClass}>Why do you want to join APRO?</label>
              <textarea
                name="whyJoin"
                className={`${formInputClass} min-h-[140px] resize-y`}
                value={formData.whyJoin}
                onChange={handleChange}
              />
            </div>
            <div className="md:col-span-2">
              <label className={formLabelClass}>Upload CV / Resume</label>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="block w-full cursor-pointer text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                  required
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100">{message}</div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Send Application"}
        </button>
      </form>
    </FormShell>
  );
};

export default JoinAproApplication;

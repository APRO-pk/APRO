import React, { useState } from "react";
import { supabase } from "../src/lib/supabase";
import { FormShell, formInputClass, formLabelClass } from "../components/PageScaffold";

const JoinAproApplication: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleType: "",
    whyJoin: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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
        },
      ]);
      if (insertError) throw insertError;

      setMessage("Application submitted successfully.");
      setFormData({ fullName: "", email: "", phone: "", roleType: "", whyJoin: "" });
      setResumeFile(null);
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
              <select name="roleType" className={formInputClass} required value={formData.roleType} onChange={handleChange}>
                <option value="" disabled>Select an option...</option>
                <option value="Internship">Internship</option>
                <option value="Part-Time Role">Part-Time Role</option>
                <option value="Full-Time Role">Full-Time Role</option>
                <option value="Freelance / Contract">Freelance / Contract</option>
              </select>
            </div>
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

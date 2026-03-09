import React, { useState } from "react";
import { supabase } from "../src/lib/supabase";

const inputBase =
  "w-full px-4 py-2 border border-gray-300 rounded " +
  "focus:ring-2 focus:ring-apra-blue focus:border-transparent outline-none transition-all";

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
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResumeFile(file);
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

      // 1) Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, resumeFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // 2) Insert form data into database
      const { error: insertError } = await supabase
        .from("career_applications")
        .insert([
          {
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            role_type: formData.roleType,
            why_join: formData.whyJoin || null,
            resume_path: filePath,
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      setMessage("Application submitted successfully.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        roleType: "",
        whyJoin: "",
      });
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="bg-white p-8 rounded-lg shadow-2xl border-t-4 border-apra-dark">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold font-heading text-apra-dark">
              Join APRO Application
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Apply to join the team. We’ll review your submission and reach out if it’s a match.
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <section>
              <h2 className="text-lg font-bold text-apra-dark mb-4">
                Applicant Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="fullName"
                    className={inputBase}
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className={inputBase}
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    className={inputBase}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    What type of role are you looking for?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="roleType"
                    className={inputBase}
                    required
                    value={formData.roleType}
                    onChange={handleChange}
                  >
                    <option value="" disabled>
                      Select an option...
                    </option>
                    <option value="Internship">Internship</option>
                    <option value="Part-Time Role">Part-Time Role</option>
                    <option value="Full-Time Role">Full-Time Role</option>
                    <option value="Freelance / Contract">Freelance / Contract</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Why do you want to join APRO?
                  </label>
                  <textarea
                    name="whyJoin"
                    placeholder="Tell us a little bit about yourself, your skills, and why you think you'd be a great fit for our team..."
                    className={`${inputBase} min-h-[140px] resize-y`}
                    value={formData.whyJoin}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Upload CV / Resume <span className="text-red-500">*</span>
                  </label>

                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <input
                      id="resume"
                      type="file"
                      name="resume"
                      accept=".pdf,.doc,.docx"
                      className="block w-full text-sm text-gray-700
                                 file:mr-4 file:py-2 file:px-4
                                 file:rounded file:border-0
                                 file:text-sm file:font-bold
                                 file:bg-apra-blue file:text-white
                                 hover:file:bg-apra-dark
                                 cursor-pointer"
                      required
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Accepted formats: .pdf, .doc, .docx
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {message && (
              <div className="text-sm font-medium text-center text-apra-dark">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-apra-blue text-white font-bold py-3 rounded hover:bg-apra-dark transition-colors uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Send Application"}
            </button>

            <div className="pt-4 border-t text-center">
              <p className="text-xs text-gray-600">
                Fields marked with an <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinAproApplication;
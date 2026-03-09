import React, { useState } from "react";
import { supabase } from "../src/lib/supabase";

const inputBase =
  "w-full px-4 py-2 border border-gray-300 rounded " +
  "focus:ring-2 focus:ring-apra-blue focus:border-transparent outline-none transition-all";

const ChapterApplication: React.FC = () => {
  const today = new Date().toLocaleDateString();

  const [formData, setFormData] = useState({
    unitName: "",
    institution: "",
    advisorName: "",
    advisorEmail: "",
    advisorPhone: "",
    leadName: "",
    memberCount: "",
    explosivesHistory: "",
    antiWeaponization: "",
    campusApproval: "",
    legalAgree: false,
    pledgeAgree: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    try {
      setSubmitting(true);

      // 1) Insert base application
      const { data: applicationData, error: applicationError } = await supabase
        .from("applications")
        .insert([
          {
            applicant_type: "CHAPTER",
            status: "PENDING",
            password_hash: null,
            member_id: null,
          },
        ])
        .select("id")
        .single();

      if (applicationError) throw applicationError;

      const applicationId = applicationData.id;

      // 2) Insert chapter details
      const { error: chapterError } = await supabase.from("chapter_details").insert([
        {
          application_id: applicationId,
          unit_name: formData.unitName,
          institution: formData.institution,
          advisor_name: formData.advisorName,
          advisor_email: formData.advisorEmail,
          advisor_phone: formData.advisorPhone,
          lead_name: formData.leadName,
          member_count: Number(formData.memberCount),
        },
      ]);

      if (chapterError) throw chapterError;

      // 3) Insert compliance answers
      const { error: complianceError } = await supabase
        .from("compliance_answers")
        .insert([
          {
            application_id: applicationId,
            explosives_history: formData.explosivesHistory,
            anti_weaponization: formData.antiWeaponization,
            campus_approval: formData.campusApproval,
          },
        ]);

      if (complianceError) throw complianceError;

      setMessage("Chapter application submitted successfully.");

      setFormData({
        unitName: "",
        institution: "",
        advisorName: "",
        advisorEmail: "",
        advisorPhone: "",
        leadName: "",
        memberCount: "",
        explosivesHistory: "",
        antiWeaponization: "",
        campusApproval: "",
        legalAgree: false,
        pledgeAgree: false,
      });
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
              Chapter / Squadron Application
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Institutional applications require faculty verification.
            </p>
          </div>

          <form className="space-y-10" onSubmit={handleSubmit}>
            <section>
              <h2 className="text-lg font-bold text-apra-dark mb-4">
                Unit Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Proposed Unit Name
                  </label>
                  <input
                    name="unitName"
                    className={inputBase}
                    required
                    value={formData.unitName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    University / Host Institution
                  </label>
                  <input
                    name="institution"
                    className={inputBase}
                    required
                    value={formData.institution}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Faculty Advisor Name
                  </label>
                  <input
                    name="advisorName"
                    className={inputBase}
                    required
                    value={formData.advisorName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Advisor Email
                  </label>
                  <input
                    type="email"
                    name="advisorEmail"
                    className={inputBase}
                    required
                    value={formData.advisorEmail}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Advisor Official Extension / Phone
                  </label>
                  <input
                    name="advisorPhone"
                    className={inputBase}
                    required
                    value={formData.advisorPhone}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Squadron President / Lead Name
                  </label>
                  <input
                    name="leadName"
                    className={inputBase}
                    required
                    value={formData.leadName}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Estimated Member Count
                  </label>
                  <input
                    type="number"
                    name="memberCount"
                    min="1"
                    className={inputBase}
                    required
                    value={formData.memberCount}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-apra-dark mb-4">
                Compliance Declaration
              </h2>

              <div className="space-y-4">
                {[
                  {
                    key: "explosivesHistory",
                    q: "Have you ever been convicted of a felony or involved in mishandling of explosives?",
                  },
                  {
                    key: "antiWeaponization",
                    q: "Do you understand that APRO strictly prohibits weaponization or pyrotechnics?",
                  },
                  {
                    key: "campusApproval",
                    q: "Does your university administration consent to storing inert rocket hardware on campus?",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <p className="text-sm font-bold text-gray-800 mb-3">{item.q}</p>

                    <div className="flex flex-wrap gap-6 text-sm">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={item.key}
                          value="YES"
                          className="accent-apra-blue"
                          required
                          checked={formData[item.key as keyof typeof formData] === "YES"}
                          onChange={handleChange}
                        />
                        Yes
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={item.key}
                          value="NO"
                          className="accent-apra-blue"
                          required
                          checked={formData[item.key as keyof typeof formData] === "NO"}
                          onChange={handleChange}
                        />
                        No
                      </label>

                      {item.key === "campusApproval" && (
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={item.key}
                            value="PENDING"
                            className="accent-apra-blue"
                            required
                            checked={
                              formData[item.key as keyof typeof formData] === "PENDING"
                            }
                            onChange={handleChange}
                          />
                          Pending Approval
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-apra-dark mb-4">
                Legal Agreement
              </h2>

              <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 max-h-64 overflow-auto text-sm text-gray-700 space-y-4 leading-relaxed">
                <p>
                  <strong>
                    By signing this document, the Applicant (and Guardian if under
                    18) agrees to the following:
                  </strong>
                </p>

                <p>
                  <strong>1. ASSUMPTION OF RISK</strong>
                  <br />I acknowledge that high-power rocketry involves inherent
                  risks, including but not limited to: fire, explosion, high-speed
                  projectile impact, and chemical burns. I voluntarily assume all
                  risks associated with participation in APRO Dynamics activities.
                </p>

                <p>
                  <strong>2. COMPLIANCE WITH NSOC</strong>
                  <br />I agree to strictly adhere to the APRO National Safety &
                  Operations Code (NSOC). I understand that launching a rocket
                  without a Safety Officer present, or without a valid CAA NOTAM
                  (Notice to Air Missions), is a violation of federal law and
                  grounds for immediate expulsion and legal action.
                </p>

                <p>
                  <strong>3. INDEMNIFICATION</strong>
                  <br />I agree to hold harmless APRO Dynamics (Pvt) Ltd, its
                  officers, directors, and land-owners from any claims, damages, or
                  liabilities arising from my participation. I certify that I have
                  my own health/accident insurance.
                </p>

                <p>
                  <strong>4. INTELLECTUAL PROPERTY</strong>
                  <br />I acknowledge that "APRO" and its logos are trademarks of
                  APRO Dynamics (Pvt) Ltd. Usage is granted only while the Chapter
                  License is active.
                </p>
              </div>

              <label className="flex gap-3 mt-4 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="legalAgree"
                  className="accent-apra-blue mt-1 h-4 w-4"
                  required
                  checked={formData.legalAgree}
                  onChange={handleChange}
                />
                <span>
                  By checking this box, I confirm this is my electronic signature and
                  I agree to the terms.
                </span>
              </label>
            </section>

            <section>
              <h2 className="text-lg font-bold text-apra-dark mb-4">
                The Pledge
              </h2>

              <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed">
                <p>
                  "I refuse to wait for permission from the future. I pledge to use
                  my knowledge for the advancement of science and the peaceful
                  exploration of the skies. I am a builder, not a destroyer. I am a
                  Space Citizen of Pakistan."
                </p>
              </div>

              <label className="flex gap-3 mt-4 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="pledgeAgree"
                  className="accent-apra-blue mt-1 h-4 w-4"
                  required
                  checked={formData.pledgeAgree}
                  onChange={handleChange}
                />
                <span>I agree to the pledge.</span>
              </label>

              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Date
                </label>
                <input
                  disabled
                  value={today}
                  className={`${inputBase} bg-gray-100 text-gray-500 border-gray-200`}
                />
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
              {submitting ? "Submitting..." : "Submit Application"}
            </button>

            <div className="pt-6 border-t text-center bg-gray-50 -mx-8 -mb-8 p-4 rounded-b-lg">
              <p className="text-xs text-gray-600">
                Your application will be reviewed manually. Credentials will be issued
                upon approval.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChapterApplication;
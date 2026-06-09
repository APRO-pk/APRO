import React, { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabase";
import type { Session } from "@supabase/supabase-js";

const inputBase =
  "w-full px-4 py-2 border border-gray-300 rounded " +
  "focus:ring-2 focus:ring-apra-blue focus:border-transparent outline-none transition-all";

const initialFormData = {
  fullName: "",
  dob: "",
  cnic: "",
  phone: "",
  email: "",
  institution: "",
  majorOrTitle: "",
  certLevel: "",
  emergencyContact: "",
  explosivesHistory: "",
  antiWeaponization: "",
  legalAgree: false,
  pledgeAgree: false,
  password: "",
  confirmPassword: "",
};

const StudentApplication: React.FC = () => {
  const today = new Date().toLocaleDateString();

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [authSession, setAuthSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("[StudentApplication] Failed to load initial session", error);
        return;
      }

      if (mounted) {
        setAuthSession(data.session ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setAuthSession(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const { name, value, type } = target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (target as HTMLInputElement).checked,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const ensureAuthenticatedSession = async () => {
    const currentSession = authSession ?? (await supabase.auth.getSession()).data.session;
    if (currentSession) {
      return currentSession;
    }

    console.info("[StudentApplication] No session found. Creating auth account before application insert.");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          member_type: "STUDENT",
        },
      },
    });

    if (authError) {
      console.error("[StudentApplication] signUp failed", authError);
      throw authError;
    }

    if (authData.session) {
      console.info("[StudentApplication] signUp returned an active session.");
      setAuthSession(authData.session);
      return authData.session;
    }

    console.info("[StudentApplication] signUp returned no session. Attempting password sign-in.");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (signInError) {
      console.error("[StudentApplication] signInWithPassword after signUp failed", signInError);
      throw new Error(
        "Account was created, but no authenticated session is available yet. Check Supabase email confirmation settings or sign in before submitting."
      );
    }

    if (!signInData.session) {
      console.error("[StudentApplication] signInWithPassword succeeded without a session.", signInData);
      throw new Error("Authenticated session was not established. Please sign in and try again.");
    }

    setAuthSession(signInData.session);
    return signInData.session;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (formData.password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!formData.legalAgree || !formData.pledgeAgree) {
      setMessage("You must agree to the legal agreement and pledge.");
      return;
    }

    let createdMemberRowId: number | null = null;
    let createdApplicationId: number | null = null;

    try {
      setSubmitting(true);
      const session = await ensureAuthenticatedSession();
      const authUserId = session.user.id;

      if (!authUserId) {
        throw new Error("You must be authenticated before submitting an application.");
      }

      if (session.user.email && session.user.email !== formData.email) {
        throw new Error("The signed-in account email does not match the application email.");
      }

      // 2) Create members row
      const memberInsertPayload = {
        auth_user_id: authUserId,
        member_id: null,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        member_type: "STUDENT",
        account_status: "PENDING",
      };
      console.info("[StudentApplication] Inserting member row", memberInsertPayload);

      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .insert([memberInsertPayload])
        .select("id")
        .single();

      if (memberError) {
        console.error("[StudentApplication] members insert failed", memberError);
        throw memberError;
      }

      createdMemberRowId = memberData.id;

      // 3) Create applications row
      const { data: applicationData, error: applicationError } = await supabase
        .from("applications")
        .insert([
          {
            applicant_type: "STUDENT",
            member_id: createdMemberRowId,
            status: "PENDING",
          },
        ])
        .select("id")
        .single();

      if (applicationError) {
        console.error("[StudentApplication] applications insert failed", applicationError);
        throw applicationError;
      }

      createdApplicationId = applicationData.id;

      // 4) Create student details row
      const { error: studentError } = await supabase
        .from("student_details")
        .insert([
          {
            application_id: createdApplicationId,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            institution: formData.institution,
            date_of_birth: formData.dob,
            cnic: formData.cnic,
            major_or_title: formData.majorOrTitle,
            cert_level: formData.certLevel,
            emergency_contact: formData.emergencyContact,
            has_explosives_history: formData.explosivesHistory === "YES",
            agrees_to_safety_code: formData.antiWeaponization === "YES",
            agrees_to_legal: formData.legalAgree,
            agrees_to_pledge: formData.pledgeAgree,
          },
        ]);

      if (studentError) {
        console.error("[StudentApplication] student_details insert failed", studentError);
        throw studentError;
      }

      // 5) Sign out so they don't stay logged in before approval
      await supabase.auth.signOut();
      setAuthSession(null);

      setMessage(
        "Student application submitted successfully. Your account has been created, but access will remain pending until admin approval."
      );

      resetForm();
    } catch (error: any) {
      console.error("[StudentApplication] Submission failed", {
        error,
        createdMemberRowId,
        createdApplicationId,
        authUserId: authSession?.user?.id ?? null,
      });
      setMessage(error.message || "Something went wrong while submitting.");

      // Frontend-only limitation:
      // if auth user was created and DB insert failed later,
      // cleanup is not reliable from here without admin/service role access.
      // For now, handle manually if needed in Supabase dashboard.
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
              Student / Individual Application
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Please fill the form carefully. All information will be reviewed by APRO admins.
            </p>
          </div>

          <form className="space-y-10" onSubmit={handleSubmit}>
            <section>
              <h2 className="text-lg font-bold text-apra-dark mb-4">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Full Name (as per CNIC)
                  </label>
                  <input
                    name="fullName"
                    placeholder="name"
                    className={inputBase}
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    name="dob"
                    type="date"
                    className={inputBase}
                    required
                    value={formData.dob}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    CNIC / B-Form Number
                  </label>
                  <input
                    name="cnic"
                    placeholder="cnic"
                    className={inputBase}
                    required
                    value={formData.cnic}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    placeholder="phone"
                    className={inputBase}
                    required
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="email"
                    className={inputBase}
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-apra-dark mb-4">
                Academic / Professional Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Institution / Company
                  </label>
                  <input
                    name="institution"
                    placeholder="institution"
                    className={inputBase}
                    required
                    value={formData.institution}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Major / Job Title
                  </label>
                  <input
                    name="majorOrTitle"
                    placeholder="title"
                    className={inputBase}
                    required
                    value={formData.majorOrTitle}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Current Certification Level
                  </label>
                  <select
                    name="certLevel"
                    className={`${inputBase} bg-white`}
                    required
                    value={formData.certLevel}
                    onChange={handleChange}
                  >
                    <option value="" disabled>
                      Select level
                    </option>
                    <option value="NONE">None</option>
                    <option value="LEVEL_1">Level 1</option>
                    <option value="LEVEL_2">Level 2</option>
                    <option value="LEVEL_3">Level 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Emergency Contact (Name & Relation)
                  </label>
                  <input
                    name="emergencyContact"
                    placeholder="e.g., Ahmad (Brother)"
                    className={inputBase}
                    required
                    value={formData.emergencyContact}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-apra-dark mb-4">
                Account Setup
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    className={inputBase}
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className={inputBase}
                    required
                    value={formData.confirmPassword}
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
                ].map((item) => (
                  <div
                    key={item.key}
                    className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <p className="text-sm font-bold text-gray-800 mb-3">{item.q}</p>
                    <div className="flex gap-6 text-sm">
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
                    By signing this document, the Applicant (and Guardian if under 18) agrees to
                    the following:
                  </strong>
                </p>

                <p>
                  <strong>1. ASSUMPTION OF RISK</strong>
                  <br />
                  I acknowledge that high-power rocketry involves inherent risks, including but not
                  limited to: fire, explosion, high-speed projectile impact, and chemical burns. I
                  voluntarily assume all risks associated with participation in APRO Dynamics
                  activities.
                </p>

                <p>
                  <strong>2. COMPLIANCE WITH NSOC</strong>
                  <br />
                  I agree to strictly adhere to the APRO National Safety &amp; Operations Code
                  (NSOC). I understand that launching a rocket without a Safety Officer present, or
                  without a valid CAA NOTAM (Notice to Air Missions), is a violation of federal law
                  and grounds for immediate expulsion and legal action.
                </p>

                <p>
                  <strong>3. INDEMNIFICATION</strong>
                  <br />
                  I agree to hold harmless APRO Dynamics (Pvt) Ltd, its officers, directors, and
                  land-owners from any claims, damages, or liabilities arising from my
                  participation. I certify that I have my own health/accident insurance.
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
                  By checking this box, I confirm this is my electronic signature and I agree to
                  the terms.
                </span>
              </label>
            </section>

            <section>
              <h2 className="text-lg font-bold text-apra-dark mb-4">The Pledge</h2>

              <div className="border border-gray-200 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed">
                <p>
                  “I refuse to wait for permission from the future. I pledge to use my knowledge
                  for the advancement of science and the peaceful exploration of the skies. I am a
                  builder, not a destroyer. I am a Space Citizen of Pakistan.”
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    disabled
                    value={today}
                    className={`${inputBase} bg-gray-100 text-gray-500 border-gray-200`}
                  />
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
              {submitting ? "Submitting..." : "Submit Application"}
            </button>

            <div className="pt-6 border-t text-center bg-gray-50 -mx-8 -mb-8 p-4 rounded-b-lg">
              <p className="text-xs text-gray-600">
                Your application will be reviewed manually. Your account will be created now, but
                access will remain pending until approval.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentApplication;

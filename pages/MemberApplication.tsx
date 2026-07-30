import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "../src/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { FormShell, formInputClass, formLabelClass } from "../components/PageScaffold";

const inputBase =
  formInputClass;

const initialFormData = {
  fullName: "",
  username: "",
  dob: "",
  phone: "",
  email: "",
  institution: "",
  majorOrTitle: "",
  certLevel: "",
  explosivesHistory: "",
  antiWeaponization: "",
  legalAgree: false,
  pledgeAgree: false,
  password: "",
  confirmPassword: "",
};

const MemberApplication: React.FC = () => {
  const today = new Date().toLocaleDateString();

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const checkUsernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("[MemberApplication] Failed to load initial session", error);
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

  // Username availability debounce
  useEffect(() => {
    const u = formData.username;
    if (u.length < 3) { setUsernameTaken(false); setCheckingUsername(false); return; }
    if (usernameError) { setCheckingUsername(false); return; }
    if (checkUsernameTimerRef.current) clearTimeout(checkUsernameTimerRef.current);
    setCheckingUsername(true);
    checkUsernameTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase.from('community_profiles').select('id').eq('display_name', u).maybeSingle();
        setUsernameTaken(!!data);
      } catch { setUsernameTaken(false); }
      setCheckingUsername(false);
    }, 400);
    return () => { if (checkUsernameTimerRef.current) clearTimeout(checkUsernameTimerRef.current); };
  }, [formData.username, usernameError]);

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 20);
    setFormData((prev) => ({ ...prev, username: cleaned }));
    if (!cleaned) setUsernameError('Username is required');
    else if (cleaned.length < 3) setUsernameError('Username must be at least 3 characters');
    else setUsernameError(null);
  };

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

    console.info("[MemberApplication] No session found. Creating auth account before application insert.");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          member_type: "MEMBER",
        },
      },
    });

    if (authError) {
      console.error("[MemberApplication] signUp failed", authError);
      throw authError;
    }

    if (authData.session) {
      console.info("[MemberApplication] signUp returned an active session.");
      setAuthSession(authData.session);
      return authData.session;
    }

    console.info("[MemberApplication] signUp returned no session. Attempting password sign-in.");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (signInError) {
      console.error("[MemberApplication] signInWithPassword after signUp failed", signInError);
      throw new Error(
        "Account was created, but no authenticated session is available yet. Check Supabase email confirmation settings or sign in before submitting."
      );
    }

    if (!signInData.session) {
      console.error("[MemberApplication] signInWithPassword succeeded without a session.", signInData);
      throw new Error("Authenticated session was not established. Please sign in and try again.");
    }

    setAuthSession(signInData.session);
    return signInData.session;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!formData.username || formData.username.length < 3) {
      setMessage("Username must be at least 3 characters.");
      return;
    }
    if (usernameError) {
      setMessage(usernameError);
      return;
    }
    if (usernameTaken) {
      setMessage("Username is already taken.");
      return;
    }
    if (checkingUsername) {
      setMessage("Please wait while we check username availability.");
      return;
    }

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

      // Create community profile with username
      const { error: profileError } = await supabase
        .from('community_profiles')
        .upsert({ id: authUserId, display_name: formData.username }, { onConflict: 'id' });
      if (profileError) {
        console.error("[MemberApplication] community_profiles upsert failed", profileError);
        throw profileError;
      }

      // 2) Create members row
      const memberInsertPayload = {
        auth_user_id: authUserId,
        member_id: null,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        member_type: "MEMBER",
        account_status: "PENDING",
      };
      console.info("[MemberApplication] Inserting member row", memberInsertPayload);

      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .insert([memberInsertPayload])
        .select("id")
        .single();

      if (memberError) {
        console.error("[MemberApplication] members insert failed", memberError);
        throw memberError;
      }

      createdMemberRowId = memberData.id;

      // 3) Create applications row
      const { data: applicationData, error: applicationError } = await supabase
        .from("applications")
        .insert([
          {
            applicant_type: "MEMBER",
            member_id: createdMemberRowId,
            status: "PENDING",
          },
        ])
        .select("id")
        .single();

      if (applicationError) {
        console.error("[MemberApplication] applications insert failed", applicationError);
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
        console.error("[MemberApplication] student_details insert failed", studentError);
        throw studentError;
      }

      // 5) Sign out so they don't stay logged in before approval
      await supabase.auth.signOut();
      setAuthSession(null);

      setMessage(
        "Application submitted successfully. Your account has been created, but access will remain pending until admin approval."
      );

      resetForm();
    } catch (error: any) {
      console.error("[MemberApplication] Submission failed", {
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
    <FormShell
      eyebrow="Member Application"
      title="Create account."
      description="Fill the application carefully. Accounts created here remain pending until admin review is complete."
    >
          <form className="space-y-10" onSubmit={handleSubmit}>
            <section>
              <h2 className="mb-4 text-lg font-bold tracking-[-0.03em] text-white">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={formLabelClass}>
                    Full Name
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
                  <label className={formLabelClass}>
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
                  <label className={formLabelClass}>
                    Phone Number (optional)
                  </label>
                  <input
                    name="phone"
                    placeholder="phone"
                    className={inputBase}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={formLabelClass}>
                    Username
                  </label>
                  <input
                    name="username"
                    placeholder="your_username"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    maxLength={20}
                    className={inputBase}
                    required
                  />
                  {usernameError && (
                    <p className="text-[11px] text-red-400 mt-1">{usernameError}</p>
                  )}
                  {usernameTaken && !usernameError && (
                    <p className="text-[11px] text-red-400 mt-1">Username already taken</p>
                  )}
                  {checkingUsername && (
                    <p className="text-[11px] text-slate-500 mt-1">Checking availability...</p>
                  )}
                  {!usernameError && !usernameTaken && !checkingUsername && formData.username.length >= 3 && (
                    <p className="text-[11px] text-emerald-400 mt-1">Username available</p>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">3-20 chars: lowercase letters, numbers, _, -, and .</p>
                </div>

                <div className="md:col-span-2">
                  <label className={formLabelClass}>
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
              <h2 className="mb-4 text-lg font-bold tracking-[-0.03em] text-white">
                Account Setup
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative">
                  <label className={formLabelClass}>
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={inputBase}
                    required
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <label className={formLabelClass}>
                    Confirm Password
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className={inputBase}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-[38px] text-slate-500 hover:text-slate-300">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-lg font-bold tracking-[-0.03em] text-white">
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
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <p className="mb-3 text-sm font-bold text-white">{item.q}</p>
                    <div className="flex gap-6 text-sm text-slate-300">
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
              <h2 className="mb-4 text-lg font-bold tracking-[-0.03em] text-white">
                Legal Agreement
              </h2>

              <div className="max-h-64 overflow-auto rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-300 space-y-4">
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

              <label className="mt-4 flex gap-3 text-sm text-slate-300">
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
              <h2 className="mb-4 text-lg font-bold tracking-[-0.03em] text-white">The Pledge</h2>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-300">
                <p>
                  "I refuse to wait for permission from the future. I pledge to use my knowledge
                  for the advancement of science and the peaceful exploration of the skies. I am a
                  builder, not a destroyer. I am a Space Citizen!"
                </p>
              </div>

              <label className="mt-4 flex gap-3 text-sm text-slate-300">
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
                  <label className={formLabelClass}>
                    Date
                  </label>
                  <input
                    disabled
                    value={today}
                    className={`${inputBase} bg-white/[0.02] text-slate-500`}
                  />
                </div>
              </div>
            </section>

            {message && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-center text-slate-100">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>

            <div className="border-t border-white/10 pt-6 text-center">
              <p className="text-xs text-slate-400">
                Your application may be reviewed manually. Your account will be created now, but
                access might remain pending until approval.
              </p>
            </div>
          </form>
    </FormShell>
  );
};

export default MemberApplication;

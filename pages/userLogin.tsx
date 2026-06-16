import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { AuthShell, GhostButton, formInputClass, formLabelClass } from "../components/PageScaffold";

const UserLogin: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const user = data.user;
      if (!user) {
        setError("Login failed.");
        return;
      }

      const { data: memberRow, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (memberError || !memberRow) {
        await supabase.auth.signOut();
        setError("No member account was found for this user.");
        return;
      }

      if (memberRow.account_status === "PENDING") {
        await supabase.auth.signOut();
        setError("Your application is still under review.");
        return;
      }

      if (memberRow.account_status === "REJECTED") {
        await supabase.auth.signOut();
        setError("Your application has been rejected. Please contact APRO if you think this is a mistake.");
        return;
      }

      if (memberRow.account_status !== "APPROVED") {
        await supabase.auth.signOut();
        setError("Your account is not allowed to access the portal.");
        return;
      }

      navigate("/#");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Member Access"
      title="APRO member login."
      description="Login is available only after your application has been approved. Pending accounts remain locked until review is complete."
    >
      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label className={formLabelClass}>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className={formInputClass} required />
        </div>

        <div>
          <label className={formLabelClass}>Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className={formInputClass} required />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white disabled:opacity-60"
        >
          {loading ? "Logging In..." : "Login"}
        </button>

        <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-4">
          <GhostButton to="/student">Apply first</GhostButton>
          <Link to="/membership" className="text-sm text-slate-300 hover:text-white">Need access?</Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default UserLogin;

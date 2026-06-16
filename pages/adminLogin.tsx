import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { AuthShell, GhostButton, formInputClass, formLabelClass } from "../components/PageScaffold";

const AdminLogin: React.FC = () => {
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

      const { data: adminRow, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (adminError || !adminRow) {
        await supabase.auth.signOut();
        setError("You are not authorized to access the admin portal.");
        return;
      }

      navigate("/admin/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Restricted Access"
      title="APRO admin portal."
      description="This interface is reserved for APRO administrators reviewing onboarding, applications, and internal activity."
    >
      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label className={formLabelClass}>Admin Email</label>
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
          <GhostButton to="/login">Member portal</GhostButton>
          <Link to="/" className="text-sm text-slate-300 hover:text-white">Back to site</Link>
        </div>
      </form>
    </AuthShell>
  );
};

export default AdminLogin;

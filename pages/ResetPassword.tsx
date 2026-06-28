import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import { AuthShell, formInputClass, formLabelClass } from "../components/PageScaffold";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recovered, setRecovered] = useState(false);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setRecovered(true);
      }
      setChecking(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecovered(true);
        setChecking(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Password Reset"
      title="Set a new password."
      description="Choose a strong password to secure your APRO account."
    >
      {checking ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-6 text-center text-sm text-slate-300">
          Checking your reset link...
        </div>
      ) : !recovered ? (
        <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-6 text-center text-sm text-yellow-100">
          This reset link is invalid or expired. Please request a new one.
        </div>
      ) : done ? (
        <div className="rounded-2xl border border-violet-200/24 bg-violet-400/10 px-4 py-6 text-center text-sm text-violet-100">
          Password updated successfully. Redirecting to login...
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className={formLabelClass}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={formInputClass}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className={formLabelClass}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={formInputClass}
              required
              minLength={6}
            />
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
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../src/lib/supabase";
import bgImage from "../assets/bg.jpg";

const UserLogin: React.FC = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50">
      <div
        className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "grayscale(100%) contrast(150%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-white p-8 rounded-lg shadow-2xl border-t-4 border-apra-dark">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-heading text-apra-dark">
              APRO Member Login
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Login to access the APRO member portal.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-apra-blue focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-apra-blue focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-apra-blue text-white font-bold py-3 rounded hover:bg-apra-dark transition-colors uppercase tracking-wider disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Logging In..." : "Login"}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-xs text-apra-blue hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center bg-gray-50 -mx-8 -mb-8 p-4 rounded-b-lg">
            <p className="text-sm text-gray-600">
              Need to apply first?{" "}
              <Link to="/student-application" className="text-apra-dark font-bold hover:underline">
                Submit Application
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Instagram, Menu, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { NAV_ITEMS } from "../types";
import { supabase } from "../src/lib/supabase";
import logo from "../assets/logo.png";

const shellPanelStyle: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(18,22,34,0.96), rgba(8,11,19,0.97))",
  boxShadow:
    "inset 1px 1px 0 rgba(255,255,255,0.05), inset -1px -1px 0 rgba(0,0,0,0.42), 0 20px 55px rgba(4,7,16,0.38)",
};

const navPillStyle: React.CSSProperties = {
  boxShadow:
    "inset 1px 1px 0 rgba(255,255,255,0.05), inset -1px -1px 0 rgba(0,0,0,0.42), 0 14px 26px rgba(4,7,16,0.22)",
};

export const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === "PASSWORD_RECOVERY") {
          navigate("/reset-password");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      <style>{`
        @keyframes aproShellGlow {
          0%, 100% { opacity: 0.45; transform: translate3d(0, 0, 0) scale(1); }
          50% { opacity: 0.75; transform: translate3d(0, -8px, 0) scale(1.03); }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(123,44,191,0.18),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(79,70,229,0.15),transparent_24%),linear-gradient(180deg,#0b0f18_0%,#060912_48%,#05070d_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.9) 0.55px, transparent 0.7px)",
            backgroundSize: "4px 4px",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.45) 55%, transparent 100%)",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 px-3 pb-3 pt-4 md:px-5">
        <div
          className="mx-auto w-full max-w-[1840px] rounded-[30px] border border-white/10 px-4 py-3 md:px-5"
          style={shellPanelStyle}
        >
          <div className="flex items-center justify-between gap-4">
            <NavLink
              to="/"
              className="group flex min-w-0 items-center gap-3 transition-opacity hover:opacity-95"
            >
              <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[inset_1px_1px_0_rgba(255,255,255,0.05),0_14px_28px_rgba(4,7,16,0.25)]">
                <div
                  className="absolute inset-0 rounded-2xl bg-violet-500/10 blur-xl"
                  style={{ animation: "aproShellGlow 7s ease-in-out infinite" }}
                />
                <img
                  src={logo}
                  alt="APRO Logo"
                  className="relative h-8 w-auto object-contain"
                />
              </div>

              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.38em] text-slate-400">
                  Pakistan Aerospace
                </div>
                <div className="truncate text-xl font-bold tracking-[-0.03em] text-white md:text-2xl">
                  APRO
                </div>
              </div>
            </NavLink>

            <nav className="hidden items-center gap-2 lg:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition duration-300 ${
                      isActive
                        ? "border-violet-300/22 bg-[linear-gradient(180deg,rgba(132,97,255,0.22),rgba(98,62,192,0.14))] text-white"
                        : "border-white/8 bg-white/[0.03] text-slate-300 hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
                    }`
                  }
                  style={navPillStyle}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              {user ? (
                <>
                  <div
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-right"
                    style={navPillStyle}
                  >
                    <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
                      Signed In
                    </div>
                    <div className="max-w-[160px] truncate text-sm font-semibold text-white">
                      {user.email?.split("@")[0] || user.email}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-100 transition duration-300 hover:border-white/18 hover:bg-white/[0.08]"
                    style={navPillStyle}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#8c6cff,#7b2cbf)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),inset_-2px_-2px_6px_rgba(54,19,108,0.6),0_18px_28px_rgba(61,28,120,0.34)] transition duration-300 hover:-translate-y-0.5"
                >
                  Login
                </NavLink>
              )}
            </div>

            <button
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100 shadow-[inset_1px_1px_0_rgba(255,255,255,0.05),0_14px_26px_rgba(4,7,16,0.22)] transition duration-300 hover:bg-white/[0.08] lg:hidden"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label="Toggle navigation"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {isMenuOpen && (
            <nav className="mt-4 border-t border-white/10 pt-4 lg:hidden">
              <div className="space-y-2">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-2xl border px-4 py-3 text-sm font-semibold transition duration-300 ${
                        isActive
                          ? "border-violet-300/22 bg-[linear-gradient(180deg,rgba(132,97,255,0.22),rgba(98,62,192,0.14))] text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
                      }`
                    }
                    style={navPillStyle}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                {user ? (
                  <div className="space-y-3">
                    <div
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                      style={navPillStyle}
                    >
                      <div className="text-[10px] uppercase tracking-[0.28em] text-slate-500">
                        Signed In
                      </div>
                      <div className="mt-1 truncate text-sm font-semibold text-white">
                        {user.email?.split("@")[0] || user.email}
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:border-white/18 hover:bg-white/[0.08]"
                      style={navPillStyle}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <NavLink
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full rounded-2xl border border-violet-200/24 bg-[linear-gradient(180deg,#8c6cff,#7b2cbf)] px-4 py-3 text-center text-sm font-semibold text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),inset_-2px_-2px_6px_rgba(54,19,108,0.6),0_18px_28px_rgba(61,28,120,0.34)]"
                  >
                    Login
                  </NavLink>
                )}
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="relative z-10 flex-grow">
        <Outlet />
      </main>

      <footer className="relative z-10 px-3 pb-6 pt-2 md:px-5 md:pb-8">
        <div
          className="mx-auto w-full max-w-[1840px] rounded-[30px] border border-white/10 px-6 py-6 md:px-8"
          style={shellPanelStyle}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="text-[10px] uppercase tracking-[0.38em] text-slate-500">
                APRO Network
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-white">
                Aero Propulsion Rocketry Operations
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300/76">
                A structured aerospace community for membership, chapter growth,
                safety discipline, and technical momentum across Pakistan.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs uppercase tracking-[0.22em] text-slate-400">
                <NavLink to="/legal" className="transition hover:text-white">
                  Legal
                </NavLink>
                <NavLink to="/membership" className="transition hover:text-white">
                  Membership
                </NavLink>
                <NavLink to="/contact" className="transition hover:text-white">
                  Contact
                </NavLink>
              </div>
            </div>

            <div className="flex flex-col items-start gap-4 md:items-end">
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/apro.pk?igsh=OGY1Mmw4ZWI3MXhx"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100 transition duration-300 hover:border-white/16 hover:bg-white/[0.08]"
                  style={navPillStyle}
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="https://wa.me/qr/L42ZA7YXDZT3B1"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100 transition duration-300 hover:border-white/16 hover:bg-white/[0.08]"
                  style={navPillStyle}
                >
                  <FaWhatsapp size={18} />
                </a>
              </div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Copyright © APRO
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

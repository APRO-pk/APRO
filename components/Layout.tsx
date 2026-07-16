import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Instagram, Menu, X } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { CurrencySelector } from "../src/components/CurrencySelector";
import type { NavItem } from "../types";
import { NAV_ITEMS } from "../types";
import { supabase } from "../src/lib/supabase";
import logo from "../assets/logo.png";
import launchpadIcon from "../assets/launchpad.png";

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

function isNavItemActive(item: NavItem, pathname: string) {
  return !item.external && pathname === item.path;
}

function renderNavVisual(item: NavItem, className: string) {
  if (item.imageIcon) {
    return <img src={item.imageIcon} alt="" className={`${className} h-[1em] w-[1em] object-contain`} />;
  }

  if (!item.icon) {
    return null;
  }

  const Icon = item.icon;
  return <Icon className={className} />;
}

function LaunchpadLink({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  if (mobile) {
    return (
      <a
        href="https://launchpad.apro.pk"
        target="_blank"
        rel="noreferrer"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl border border-[#f0c27b]/24 bg-[linear-gradient(180deg,rgba(241,169,78,0.18),rgba(140,76,22,0.12))] px-4 py-3 text-sm font-semibold text-[#ffe3bb] shadow-[inset_1px_1px_0_rgba(255,255,255,0.08),inset_-1px_-1px_0_rgba(68,28,4,0.34),0_16px_30px_rgba(45,21,4,0.24)] transition duration-300 hover:border-[#f0c27b]/36 hover:bg-[linear-gradient(180deg,rgba(241,169,78,0.24),rgba(140,76,22,0.16))] hover:text-white"
      >
        <img src={launchpadIcon} alt="" className="h-6 w-6 rounded-[8px] object-cover shadow-[0_4px_12px_rgba(0,0,0,0.25)]" />
        Launchpad
      </a>
    );
  }

  return (
    <a
      href="https://launchpad.apro.pk"
      target="_blank"
      rel="noreferrer"
      className="group relative ml-2 flex items-center gap-2 rounded-full border border-[#f0c27b]/20 bg-[linear-gradient(180deg,rgba(241,169,78,0.14),rgba(124,69,21,0.1))] px-3 py-2 text-[#ffdca9] shadow-[inset_1px_1px_0_rgba(255,255,255,0.08),inset_-1px_-1px_0_rgba(55,26,5,0.34),0_16px_28px_rgba(38,19,4,0.2)] transition duration-300 hover:-translate-y-0.5 hover:border-[#f0c27b]/34 hover:bg-[linear-gradient(180deg,rgba(241,169,78,0.2),rgba(124,69,21,0.14))] hover:text-white"
    >
      <img src={launchpadIcon} alt="" className="h-6 w-6 rounded-[10px] object-cover shadow-[0_4px_12px_rgba(0,0,0,0.28)]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em]">Launchpad</span>
      <div className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 -translate-y-1 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="whitespace-nowrap rounded-xl border border-[#f0c27b]/16 bg-[#18110a]/95 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#ffe3bb] shadow-xl backdrop-blur-md">
          Open Launchpad
        </div>
      </div>
    </a>
  );
}

export const Layout: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
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
    setUserMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#05070d] text-white">
      <style>{`
        @keyframes aproShellGlow {
          0%, 100% { opacity: 0.45; transform: translate3d(0, 0, 0) scale(1); }
          50% { opacity: 0.75; transform: translate3d(0, -8px, 0) scale(1.03); }
        }
        @keyframes navRainbowShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes tooltipIn {
          0% { opacity: 0; transform: translateY(-4px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropdownFadeIn {
          0% { opacity: 0; transform: translateY(-4px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nav-rainbow-glow {
          filter: drop-shadow(0 0 6px rgba(160,124,254,0.5)) drop-shadow(0 0 14px rgba(254,143,181,0.3)) drop-shadow(0 0 22px rgba(255,190,123,0.2));
        }
        .nav-rainbow-dot {
          background: linear-gradient(90deg, #A07CFE, #FE8FB5, #FFBE7B, #57E0A0, #60A5FA);
          background-size: 200% 100%;
          animation: navRainbowShift 3s linear infinite;
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
                <div className="truncate text-xl font-bold tracking-[-0.03em] text-white md:text-2xl">
                  APRO
                </div>
              </div>
            </NavLink>

            <nav className="hidden items-center gap-2 lg:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = isNavItemActive(item, location.pathname);
                const navItemClassName = `group relative flex items-center justify-center p-1.5 transition-all duration-300 ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`;
                const iconClassName = `text-3xl ${isActive && item.path === "/apro-works" ? "nav-rainbow-glow" : ""}`;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={navItemClassName}
                  >
                    {renderNavVisual(item, iconClassName)}
                    {isActive && (
                      <span className={`absolute -bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full ${
                        item.path === "/apro-works" ? "nav-rainbow-dot" : "bg-violet-400"
                      }`} />
                    )}
                    <div className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 -translate-y-1 group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="whitespace-nowrap rounded-xl border border-white/10 bg-[#0f1120]/95 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-xl backdrop-blur-md" style={{ animation: "tooltipIn 0.15s ease-out" }}>
                        {item.label}
                      </div>
                    </div>
                  </NavLink>
                );
              })}
              <LaunchpadLink />
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <CurrencySelector />
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:border-white/18 hover:bg-white/[0.08]"
                    style={navPillStyle}
                  >
                    {user.email?.split("@")[0] || user.email}
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1120] shadow-xl"
                      style={{ animation: "dropdownFadeIn 0.15s ease-out" }}
                    >
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm text-slate-200 transition hover:bg-white/[0.06]"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-3 text-left text-sm text-red-400 transition hover:bg-white/[0.06]"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
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
                {NAV_ITEMS.map((item) => {
                  const isActive = isNavItemActive(item, location.pathname);
                  const mobileItemClassName = `flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition duration-300 ${
                    isActive
                      ? "border-violet-300/22 bg-[linear-gradient(180deg,rgba(132,97,255,0.22),rgba(98,62,192,0.14))] text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/14 hover:bg-white/[0.06] hover:text-white"
                  }`;
                  const iconClassName = `text-xl ${isActive && item.path === "/apro-works" ? "nav-rainbow-glow" : ""}`;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={mobileItemClassName}
                      style={navPillStyle}
                    >
                      {renderNavVisual(item, iconClassName)}
                      {item.label}
                    </NavLink>
                  );
                })}
                <LaunchpadLink mobile onNavigate={() => setIsMenuOpen(false)} />
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                {user ? (
                  <div className="space-y-3">
                    <div
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                      style={navPillStyle}
                    >
                      <div className="truncate text-sm font-semibold text-white">
                        {user.email?.split("@")[0] || user.email}
                      </div>
                    </div>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => { setUserMenuOpen(false); setIsMenuOpen(false); }}
                      className="block w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 transition duration-300 hover:bg-white/[0.08]"
                      style={navPillStyle}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-red-400 transition duration-300 hover:border-white/18 hover:bg-white/[0.08]"
                      style={navPillStyle}
                    >
                      Log out
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

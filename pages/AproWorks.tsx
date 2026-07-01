import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ArrowRight, Sparkles, Monitor } from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { PageScaffold, SectionBand, SurfacePanel } from "../components/PageScaffold";
import aproWorksLogo from "../assets/AproWorks.png";
import aproWorksSide from "../assets/AproworksSideView.png";
import geometryLogo from "../assets/GeometryModeler.png";
import propulsorLogo from "../assets/Propulsor.png";
import hexadofLogo from "../assets/Hexadof.png";
import rsdLogo from "../assets/RSD.png";

const apps = [
  {
    id: "burn-geometry",
    title: "Burn & Geometry Modeler",
    description: "Desktop propellant burn and grain geometry workspace for APRO's prototype launcher flow.",
    logo: geometryLogo,
  },
  {
    id: "propulsor",
    title: "Propulsor — Liquid Engine Design Studio",
    description: "End-to-end liquid engine design workspace covering thermochemistry, injectors, nozzle sizing, and analysis.",
    logo: propulsorLogo,
  },
  {
    id: "hexadof",
    title: "HexaDOF",
    description: "Real-time 6DOF rocket telemetry workspace with live visualization, telemetry dashboards, and analysis tooling.",
    logo: hexadofLogo,
  },
  {
    id: "rsd",
    title: "RSD — Recovery System Designer",
    description: "Recovery System Designer for parachutes, and other recovery system designs.",
    logo: rsdLogo,
  },
];

const AproWorks: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showRest, setShowRest] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    let progress = 0;
    let touchStartY = 0;

    const unlock = () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };

    const onWheel = (e: WheelEvent) => {
      if (progress >= 1) return;
      e.preventDefault();
      progress = Math.max(0, Math.min(1, progress + (e.deltaY > 0 ? 0.04 : -0.04)));
      setScrollProgress(progress);
      if (progress >= 1) { unlock(); setShowRest(true); }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (progress >= 1) return;
      e.preventDefault();
      const dy = touchStartY - e.touches[0].clientY;
      progress = Math.max(0, Math.min(1, progress + (dy > 0 ? 0.03 : -0.03)));
      setScrollProgress(progress);
      touchStartY = e.touches[0].clientY;
      if (progress >= 1) { unlock(); setShowRest(true); }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return unlock;
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  return (
    <PageScaffold>
      <style>{`
        @keyframes aproBeamPulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.8; }
        }
        @keyframes aproFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .beam-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        .beam-line {
          stroke-dasharray: 8 8;
          animation: aproBeamPulse 3s ease-in-out infinite;
        }
        .hover-glow {
          transition: all 0.3s ease;
        }
        .hover-glow:hover {
          filter: drop-shadow(0 0 12px rgba(123,44,191,0.3));
          transform: translateY(-2px);
        }
      `}</style>

      {/* Hero */}
      <section className="relative mx-auto w-full max-w-[1880px] px-5 pt-4 md:px-8 md:pt-6 xl:px-12">
        <div className="overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,18,34,0.92),rgba(8,10,18,0.98))] shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),0_24px_54px_rgba(4,7,16,0.26)]">
          <div className="grid lg:grid-cols-[1fr_1.4fr] lg:items-stretch">
            <div className="p-8 md:p-10 xl:p-14" style={{ opacity: 1 - scrollProgress, transition: "none" }}>
              <div className="flex items-center gap-3 text-violet-200/90 mb-4">
                <span className="text-[11px] uppercase tracking-[0.38em] text-slate-300/90">BETA PROGRAM</span>
              </div>
              <h1 className="text-[clamp(3.6rem,8vw,8rem)] font-extrabold leading-[0.88] tracking-[-0.00em]">
                <span className="bg-[linear-gradient(180deg,#ffffff_6%,#cabdff_92%)] bg-clip-text text-transparent">APRO</span>
              </h1>
              <h1 className="text-[clamp(3.6rem,8vw,8rem)] font-extrabold leading-[0.88] tracking-[-0.00em]">
                <span className="bg-[linear-gradient(135deg,#A07CFE,#FE8FB5,#FFBE7B,#57E0A0,#60A5FA)] bg-clip-text text-transparent"> Works</span>
              </h1>
              <p className="mt-6 max-w-2xl text-[clamp(1rem,1.2vw,1.25rem)] leading-[1.9] text-slate-200/80">
                A unified desktop launcher for all aerospace tools APRO has to offer. Download, run, and manage
                every APRO application from one place.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {user ? (
                  <a href="#" onClick={e => { e.preventDefault(); alert("Download will start once the installer is ready."); }}
                    className="group inline-flex items-center gap-3 rounded-full border border-violet-200/30 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),0_20px_34px_rgba(61,28,120,0.42)] transition duration-300 hover:-translate-y-0.5">
                    <Download size={18} />
                    Download for Windows
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                ) : (
                  <Link to="/login"
                    className="group inline-flex items-center gap-3 rounded-full border border-violet-200/30 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),0_20px_34px_rgba(61,28,120,0.42)] transition duration-300 hover:-translate-y-0.5">
                    <Download size={18} />
                    Log in to Download
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Monitor size={14} />
                  Windows only · ~250 MB
                </div>
              </div>
            </div>
            <div className="hidden lg:relative lg:z-10 lg:block" style={{ transform: `translateX(-${scrollProgress * 85}%)`, transition: "none" }}>
              <img src={aproWorksSide} alt="APRO Works side view" className="h-full w-full rounded-l-[40px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <div className="after-hero" style={{
        opacity: showRest ? 1 : 0,
        transform: showRest ? "translateY(0)" : "translateY(60px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
        pointerEvents: showRest ? "auto" : "none",
      }}>
        {/* Animated Beam Section */}
      <SectionBand className="mt-6">
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Available Applications</div>
          <h2 className="mt-3 text-[clamp(2.4rem,4vw,4.4rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
            One launcher, many tools.
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base leading-8 text-slate-300/76">
            Every application ships inside APRO Works. Download the launcher once and access the full toolset.
          </p>
        </div>

        {/* Beam Network */}
        <div className="relative mt-16 mb-8">
          <div className="relative mx-auto max-w-4xl">
            <svg className="beam-svg" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="beamGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A07CFE" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#7B2CBF" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="beamGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#7B2CBF" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="beamGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#7B2CBF" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="beamGrad4" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#7B2CBF" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <line x1="200" y1="125" x2="400" y2="250" stroke="url(#beamGrad1)" strokeWidth="2" strokeDasharray="8 6" className="beam-line" style={{ animationDelay: "0s" }} />
              <line x1="600" y1="125" x2="400" y2="250" stroke="url(#beamGrad2)" strokeWidth="2" strokeDasharray="8 6" className="beam-line" style={{ animationDelay: "0.4s" }} />
              <line x1="200" y1="375" x2="400" y2="250" stroke="url(#beamGrad3)" strokeWidth="2" strokeDasharray="8 6" className="beam-line" style={{ animationDelay: "0.8s" }} />
              <line x1="600" y1="375" x2="400" y2="250" stroke="url(#beamGrad4)" strokeWidth="2" strokeDasharray="8 6" className="beam-line" style={{ animationDelay: "1.2s" }} />
              <circle cx="400" cy="250" r="48" fill="rgba(123,44,191,0.15)" stroke="#7B2CBF" strokeWidth="1.5" />
              <circle cx="400" cy="250" r="42" fill="rgba(123,44,191,0.08)" />
            </svg>

            <div className="relative grid grid-cols-2 gap-6 md:gap-10" style={{ minHeight: "500px" }}>
              {apps.map((app, i) => (
                <div key={app.id} className="flex items-center justify-center">
                  <div className="hover-glow group cursor-default">
                    <div className="relative rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,24,37,0.9),rgba(8,10,18,0.96))] p-5 md:p-6 transition duration-300 hover:border-violet-300/20" style={{ width: "280px" }}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.04]">
                          <img src={app.logo} alt={app.title} className="h-7 w-7 object-contain" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate">{app.title}</h3>
                          <p className="mt-1 text-[11px] leading-5 text-slate-400 line-clamp-2">{app.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full border-2 border-violet-400/40 bg-[linear-gradient(180deg,rgba(123,44,191,0.2),rgba(46,18,90,0.3))] shadow-[0_0_40px_rgba(123,44,191,0.15)]" style={{ animation: "aproFloat 4s ease-in-out infinite" }}>
                <img src={aproWorksLogo} alt="APRO Works" className="h-14 w-14 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </SectionBand>

      {/* App Details */}
      <SectionBand className="bg-[linear-gradient(180deg,rgba(12,14,28,0.92),rgba(8,11,18,0.98))]">
        <div className="text-center mb-10">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Toolset Overview</div>
          <h2 className="mt-3 text-[clamp(2rem,3.4vw,3.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
            Built for model rocketry and beyond.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {apps.map((app) => (
            <SurfacePanel key={app.id} className="group p-6 transition duration-300 hover:border-violet-300/15">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] mb-5">
                <img src={app.logo} alt={app.title} className="h-8 w-8 object-contain" />
              </div>
              <h3 className="text-2xl font-bold tracking-[-0.04em] text-white">{app.title}</h3>
              <p className="mt-3 text-base leading-8 text-slate-300/76">{app.description}</p>
            </SurfacePanel>
          ))}
        </div>
      </SectionBand>

      {/* CTA */}
      <SectionBand className="bg-[linear-gradient(95deg,rgba(31,21,56,0.84),rgba(8,10,18,1))]">
        <div className="text-center">
          <h2 className="text-[clamp(2.4rem,4vw,4.4rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
            Ready to launch?
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-base leading-8 text-slate-300/76">
            APRO Works is the single entry point to Pakistan's aerospace toolset. One download, full access.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {user ? (
              <a href="#" onClick={e => { e.preventDefault(); alert("Download will start once the installer is ready."); }}
                className="inline-flex items-center gap-3 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),0_18px_28px_rgba(61,28,120,0.28)] transition duration-300 hover:-translate-y-0.5">
                <Download size={18} /> Download for Windows
              </a>
            ) : (
              <Link to="/login"
                className="inline-flex items-center gap-3 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),0_18px_28px_rgba(61,28,120,0.28)] transition duration-300 hover:-translate-y-0.5">
                <Download size={18} /> Log in to Download
              </Link>
            )}
          </div>
        </div>
      </SectionBand>
      </div>
    </PageScaffold>
  );
};

export default AproWorks;
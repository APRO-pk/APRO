import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ArrowRight, Monitor } from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { PageScaffold, SectionBand } from "../components/PageScaffold";
import { BetaPopup } from "../components/BetaPopup";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
import aproWorksLogo from "../assets/AproWorks.png";
import aproWorksSide from "../assets/AproworksSideView.png";
import geometryLogo from "../assets/GeometryModeler.png";
import propulsorLogo from "../assets/Propulsor.png";
import hexadofLogo from "../assets/Hexadof.png";
import rsdLogo from "../assets/RSD.png";
import burnScreen from "../assets/BurnAndGeometryModellerScreen.png";
import propulsorScreen from "../assets/PropulsorScreen.png";
import hexadofScreen from "../assets/HexaDOFScreen.png";
import rsdScreen from "../assets/RSDScreen.png";

const apps = [
  {
    id: "burn-geometry",
    title: "Burn & Geometry Modeler",
    description: "Desktop propellant burn and grain geometry workspace for APRO's prototype launcher flow.",
    logo: geometryLogo,
    screen: burnScreen,
  },
  {
    id: "propulsor",
    title: "Propulsor — Liquid Engine Design Studio",
    description: "End-to-end liquid engine design workspace covering thermochemistry, injectors, nozzle sizing, and analysis.",
    logo: propulsorLogo,
    screen: propulsorScreen,
  },
  {
    id: "hexadof",
    title: "HexaDOF",
    description: "Real-time 6DOF rocket telemetry workspace with live visualization, telemetry dashboards, and analysis tooling.",
    logo: hexadofLogo,
    screen: hexadofScreen,
  },
  {
    id: "rsd",
    title: "RSD — Recovery System Designer",
    description: "Recovery System Designer for parachutes, and other recovery system designs.",
    logo: rsdLogo,
    screen: rsdScreen,
  },
];

const AproWorks: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showRest, setShowRest] = useState(false);
  const [trajectoryProgress, setTrajectoryProgress] = useState(0);
  const trajectoryRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const chevronPosRef = useRef({ x: 60, y: 150, angle: -45 });
  const [tick, setTick] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (!trajectoryRef.current) return;
      const rect = trajectoryRef.current.getBoundingClientRect();
      const h = trajectoryRef.current.offsetHeight;
      const p = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (h + window.innerHeight)));
      setTrajectoryProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!pathRef.current) return;
    const path = pathRef.current;
    const len = path.getTotalLength();
    const pos = Math.max(0, Math.min(1, trajectoryProgress));
    const pt = path.getPointAtLength(pos * len);
    const pt2 = path.getPointAtLength(Math.min(len, (pos + 0.005) * len));
    const angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * (180 / Math.PI);
    chevronPosRef.current = { x: pt.x, y: pt.y, angle };
    setTick(t => t + 1);
  }, [trajectoryProgress]);

  const [toolProgress, setToolProgress] = useState(0);
  const maxProgress = apps.length - 1 + 1.08;
  const toolsRef = useRef<HTMLDivElement>(null);
  const [betaPopupOpen, setBetaPopupOpen] = useState(false);

  // Hero GSAP ScrollTrigger — pin + scrub
  useEffect(() => {
    if (!heroRef.current) return;
    const proxy = { t: 0 };
    const st = gsap.to(proxy, {
      t: 1,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        pin: true,
        scrub: true,
        start: "top top+=10%",
        end: "+=500vh",
        anticipatePin: true,
        onUpdate: () => {
          setScrollProgress(proxy.t);
          if (proxy.t >= 1) setShowRest(true);
        },
      },
    });
    return () => st.kill();
  }, []);

  // Tools GSAP ScrollTrigger — pin + scrub
  useEffect(() => {
    if (!toolsRef.current) return;
    const proxy = { t: 0 };
    const st = gsap.to(proxy, {
      t: maxProgress,
      ease: "none",
      scrollTrigger: {
        trigger: toolsRef.current,
        pin: true,
        scrub: true,
        start: "top top",
        end: "+=2250vh",
        anticipatePin: true,
        onUpdate: () => setToolProgress(proxy.t),
      },
    });
    return () => st.kill();
  }, []);

  // Refresh ScrollTrigger after mount to catch any layout shifts
  useEffect(() => {
    ScrollTrigger.refresh();
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <PageScaffold>
        <style>{`
        @keyframes aproFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scanLine {
          0% { transform: translateY(0); }
          100% { transform: translateY(200px); }
        }
        @keyframes dash-scroll {
          to { stroke-dashoffset: -100; }
        }
        .animate-dash {
          animation: dash-scroll 1.5s linear infinite;
        }
        @keyframes trace-flow {
          to { stroke-dashoffset: -32; }
        }
        @keyframes trace-flow-fast {
          to { stroke-dashoffset: -32; }
        }
        .animate-trace {
          animation: trace-flow 0.8s linear infinite;
        }
        .animate-trace-fast {
          animation: trace-flow-fast 0.4s linear infinite;
        }
      `}</style>

      {/* Hero */}
      <section ref={heroRef} className="apro-hero-section relative mx-auto w-full max-w-[1880px] px-5 pt-4 md:px-8 md:pt-6 xl:px-12 min-h-screen">
        <div className="overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,18,34,0.92),rgba(8,10,18,0.98))] shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),0_24px_54px_rgba(4,7,16,0.26)]">
          <div className="grid lg:grid-cols-[1fr_1.4fr] lg:items-stretch">
            <div className="p-8 md:p-10 xl:p-14" style={{ opacity: 1 - scrollProgress }}>
              <div className="flex items-center gap-3 text-violet-200/90 mb-4">
                <span className="text-[11px] uppercase tracking-[0.38em] text-slate-300/90">BETA PROGRAM</span>
              </div>
              <h1 className="text-[clamp(3.6rem,8vw,8rem)] font-extrabold leading-[0.88] tracking-[-0.00em]">
                <span className="bg-[linear-gradient(180deg,#ffffff_6%,#cabdff_92%)] bg-clip-text text-transparent">APRO</span>
              </h1>
              <h1 className="text-[clamp(3.6rem,8vw,8rem)] font-extrabold leading-[0.88] tracking-[-0.00em]">
                <span className="bg-[linear-gradient(135deg,#A07CFE,#FE8FB5,#FFBE7B,#57E0A0,#60A5FA)] bg-clip-text text-transparent"> Works</span>
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {user ? (
                  <button onClick={() => setBetaPopupOpen(true)}
                    className="group inline-flex items-center gap-3 rounded-full border border-violet-200/30 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),0_20px_34px_rgba(61,28,120,0.42)] transition duration-300 hover:-translate-y-0.5">
                    <Download size={18} />
                    Download for Windows
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                ) : (
                  <button onClick={() => setBetaPopupOpen(true)}
                    className="group inline-flex items-center gap-3 rounded-full border border-violet-200/30 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),0_20px_34px_rgba(61,28,120,0.42)] transition duration-300 hover:-translate-y-0.5">
                    <Download size={18} />
                    Log in to Download
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                )}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Monitor size={14} />
                  Windows only · ~250 MB
                </div>
              </div>
            </div>
            <div className="hidden lg:relative lg:block">
              <div className="absolute inset-0 z-0" style={{
                opacity: Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.4)),
              }}>
                <div className="flex h-full items-center justify-end pr-8 md:pr-12 xl:pr-20">
                  <div className="max-w-[28rem] text-right">
                    <p className="text-[clamp(1.15rem,1.6vw,1.75rem)] leading-[1.7] font-medium text-white/90">
                      A unified desktop launcher for all aerospace tools APRO has to offer. Download, run, and manage
                      every APRO application from one place.
                    </p>
                    <div className="mt-5 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
                  </div>
                </div>
              </div>
              <div className="relative z-10 h-full" style={{ transform: `translateX(-${scrollProgress * 85}%)` }}>
                <img src={aproWorksSide} alt="APRO Works side view" className="h-full w-full rounded-l-[40px] object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="after-hero -mt-[250px]" style={{
        opacity: showRest ? 1 : 0,
        transition: "opacity 0.8s ease",
        pointerEvents: showRest ? "auto" : "none",
      }}>
        {/* App Cloud Section */}
      <SectionBand className="mt-6">
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Available Applications</div>
          <h2 className="my-2 text-[clamp(2.4rem,4vw,4.4rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
            One launcher, many tools.
          </h2>
          <p className="mt-2 mx-auto max-w-2xl text-base leading-8 text-slate-300/76">
            Every application ships inside APRO Works. Download the launcher once and access the full toolset.
          </p>
        </div>

        {/* App Orbit — Net + Stationary Logos + Terminal Hover */}
        <AppOrbit apps={apps} aproLogo={aproWorksLogo} />

        {/* Launch Trajectory */}
        <div ref={trajectoryRef} className="relative mt-10 mb-2 overflow-visible min-h-[180px] md:min-h-[240px]">
          <svg className="w-full h-[160px] md:h-[200px]" viewBox="0 0 600 180" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="trajectoryGrad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#7B2CBF" stopOpacity="0.5" />
                <stop offset="40%" stopColor="#A07CFE" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="trailGrad" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#7B2CBF" stopOpacity="0" />
                <stop offset="50%" stopColor="#A07CFE" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.6" />
              </linearGradient>
              <filter id="trajectoryGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ambient glow trail */}
            <path d="M 40 155 Q 180 20, 560 35" stroke="url(#trailGrad)" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.25" filter="url(#trajectoryGlow)" />

            {/* Dotted trajectory */}
            <path
              ref={pathRef}
              d="M 40 155 Q 180 20, 560 35"
              stroke="url(#trajectoryGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="8 16"
              fill="none"
            />

            {/* Small dots along the path */}
            <path
              d="M 40 155 Q 180 20, 560 35"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="0 24"
              fill="none"
              opacity="0.4"
            />

            {/* Rocket chevron */}
            <g transform={`translate(${chevronPosRef.current.x}, ${chevronPosRef.current.y}) rotate(${chevronPosRef.current.angle})`}>
              <path d="M-10,-7 L6,0 L-10,7" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#trajectoryGlow)" />
              <path d="M-10,-7 L6,0 L-10,7" stroke="#A07CFE" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
            </g>
          </svg>

          {/* Telemetry Diagnostics */}
          <div className="pointer-events-none absolute inset-0">
            {[
              { label: 'LAUNCH ANGLE', value: '42.7°',    threshold: 0.00, left: '1%',  top: '72%' },
              { label: 'ALT',          value: '86.5 km',  threshold: 0.06, left: '1%',  top: '4%'  },
              { label: 'VELOCITY',     value: '3,247 m/s',threshold: 0.12, left: '20%', top: '24%' },
              { label: 'THRUST',       value: '2.4 kN',   threshold: 0.18, left: '58%', top: '60%' },
              { label: 'ACCEL',        value: '4.2 G',    threshold: 0.25, left: '36%', top: '2%'  },
              { label: 'BURN TIME',    value: '8.2s',     threshold: 0.33, left: '71%', top: '30%' },
              { label: 'MARGIN',       value: '1.34',      threshold: 0.42, left: '43%', top: '81%' },
              { label: 'APOGEE',       value: '124.3 km', threshold: 0.52, left: '80%', top: '2%'  },
            ].map((d, i) => {
              const fade = Math.max(0, Math.min(1, (trajectoryProgress - d.threshold) / 0.07));
              return (
                <div
                  key={i}
                  className="absolute transition-all duration-200"
                  style={{
                    left: d.left,
                    top: d.top,
                    opacity: fade,
                    transform: `translateY(${(1 - fade) * 10}px)`,
                  }}
                >
                  <span className="text-[10px] md:text-[11px] font-mono tracking-[0.18em] text-cyan-400/60">
                    &gt; {d.label}:
                  </span>
                  <span className="ml-1.5 md:ml-2 text-xs md:text-sm font-mono font-semibold text-cyan-200/90">
                    {d.value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Status bar */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between px-1 md:px-2"
            style={{ opacity: Math.max(0, Math.min(1, (trajectoryProgress - 0.6) / 0.1)) }}
          >
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="text-[10px] font-mono tracking-[0.2em] text-emerald-400/70">SYS OK</span>
            </div>
            <span className="text-[10px] font-mono tracking-[0.15em] text-cyan-400/40">
              ACQUIRING
              <span className="ml-0.5 animate-[blink_1s_step-end_infinite]">_</span>
            </span>
          </div>

          {/* Scan line overlay */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent" style={{ animation: "scanLine 4s linear infinite" }} />
          </div>
        </div>
      </SectionBand>

      {/* Tool Carousel — GSAP ScrollTrigger pins this */}
      <section ref={toolsRef} className="mx-auto w-full max-w-[1880px] h-screen px-5 md:px-8 xl:px-12">
        <div className="relative h-full overflow-hidden rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,14,28,0.92),rgba(8,11,18,0.98))] shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),0_22px_48px_rgba(4,7,16,0.24)]">
          {/* Sticky header */}
          <div className="pt-[5.25rem] md:pt-[7.5rem] pb-4">
            <div className="text-center">
              <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Toolset Overview</div>
              <h2 className="mt-3 text-[clamp(2rem,3.4vw,3.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
                Built for model rocketry and beyond.
              </h2>
            </div>
          </div>

          {/* Tool slides */}
          {apps.map((app, i) => {
            const t = toolProgress - i;
            const overlap = 0.08;
            const entry = 0.15;
            const exit = 0.15;
            const ea = -overlap;
            const eb = entry;
            const xa = 1 - exit;
            const xb = 1 + overlap;
            const fadeIn = Math.max(0, Math.min(1, (t - ea) / (eb - ea)));
            const fadeOut = Math.max(0, Math.min(1, (xb - t) / (xb - xa)));
            const isLastCard = i === apps.length - 1;
            const opacity = isLastCard ? (t < ea ? 0 : t < eb ? fadeIn : 1) : (t < ea ? 0 : t < eb ? fadeIn : t > xa ? t < xb ? fadeOut : 0 : 1);
            const translateY = isLastCard ? (t < ea ? 45 : t < eb ? 45 * (1 - fadeIn) : 0) : (t < ea ? 45 : t < eb ? 45 * (1 - fadeIn) : t > xa ? t < xb ? -45 * fadeOut : -45 : 0);
            const cardProgress = Math.max(0, Math.min(1, t));
            return (
              <div
                key={app.id}
                className="absolute inset-x-0 flex items-center justify-center px-4 md:px-0"
                style={{
                  top: "150px",
                  bottom: "24px",
                  opacity,
                  transform: `translateY(${translateY}px)`,
                  zIndex: opacity > 0.02 ? 5 : -1,
                  pointerEvents: opacity > 0.02 ? "auto" : "none",
                  transition: "opacity 0.1s linear, transform 0.15s linear",
                }}
              >
                <div className="relative flex w-full max-w-[1400px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,24,37,0.95),rgba(8,10,18,0.98))] shadow-[0_20px_50px_rgba(4,7,16,0.4)] md:flex-row">
                  {/* Scroll progress bar */}
                  <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500/40 to-cyan-400/40 transition-all duration-75" style={{ width: `${cardProgress * 100}%` }} />
                  </div>
                  <div className="relative flex flex-col justify-center px-8 py-10 md:px-12 md:py-14 xl:px-16 xl:py-18 md:w-1/2">
                    {/* Faded logo stamp */}
                    <img src={app.logo} alt="" className="absolute -left-6 -top-6 h-72 w-72 object-contain opacity-25 -rotate-12 select-none" />

                    {/* Title with character reveal */}
                    <h3 className="relative text-[clamp(1.6rem,2.8vw,2.6rem)] font-bold tracking-[-0.03em] text-white">
                      {(() => {
                        let idx = 0;
                        return app.title.split(' ').map((word, wi) => {
                          const wordStart = idx;
                          const chars = word.split('').map((char, j) => {
                            const charIdx = wordStart + j;
                            const revealAt = (charIdx / app.title.length) * entry;
                            const revealed = t >= revealAt;
                            return (
                              <span
                                key={j}
                                className="inline-block transition-all duration-200"
                                style={{
                                  opacity: revealed ? 1 : 0.08,
                                  transform: revealed ? 'translateY(0px)' : 'translateY(14px)',
                                  transitionDelay: `${charIdx * 25}ms`,
                                }}
                              >
                                {char}
                              </span>
                            );
                          });
                          idx += word.length + 1;
                          return (
                            <React.Fragment key={wi}>
                              {wi > 0 && ' '}
                              <span style={{ whiteSpace: "nowrap" }}>
                                {chars}
                              </span>
                            </React.Fragment>
                          );
                        });
                      })()}
                    </h3>

                    {/* Console description */}
                    <p className="mt-4 text-sm md:text-base leading-7 md:leading-8 font-mono text-cyan-300/70">
                      &gt; {app.description}
                    </p>
                  </div>
                  <div className="relative md:w-1/2 min-h-[240px] md:min-h-full">
                    <img src={app.screen} alt={app.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[rgba(12,14,28,0.3)] to-transparent md:from-[rgba(12,14,28,0.15)]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      </div>  {/* end after-hero */}

      {/* Pricing Panel */}
      <SectionBand className="bg-[linear-gradient(180deg,rgba(12,14,28,0.95),rgba(8,11,18,0.98))]">
        <Link to="/pricing"
          className="group block rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(20,24,37,0.9),rgba(8,10,18,0.95))] p-8 md:p-12 transition-all duration-300 hover:border-violet-500/30 hover:-translate-y-0.5"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400 mb-2">Pricing</div>
              <h2 className="text-[clamp(1.8rem,3vw,2.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
                Choose your launch tier.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-8 text-slate-300/76">
                Scale from hobby rocketry to professional aerospace engineering. Individual, team, institute, and industry plans available.
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[0_8px_24px_rgba(61,28,120,0.3)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_32px_rgba(61,28,120,0.45)]">
                View Pricing
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </div>
        </Link>
      </SectionBand>
      <SectionBand className="bg-[linear-gradient(180deg,rgba(40,22,10,0.92),rgba(18,12,8,0.98))] border-amber-500/10">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold tracking-[-0.03em] text-amber-100">Not convinced yet?</h2>
          <p className="mt-3 mx-auto max-w-lg text-base leading-8 text-amber-300/70">
            Have questions about which plan fits your needs or how APRO Works works?
          </p>
          <Link
            to="/contact"
            className="mt-6 group inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-[linear-gradient(180deg,#f59e0b,#d97706)] px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.25),0_8px_24px_rgba(217,119,6,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),0_12px_32px_rgba(217,119,6,0.5)] animate-pulse hover:animate-none"
          >
            <span>Contact us</span>
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </SectionBand>
      <SectionBand className="bg-[linear-gradient(95deg,rgba(31,21,56,0.84),rgba(8,10,18,1))]">
        <div className="text-center">
          <h2 className="text-[clamp(2.4rem,4vw,4.4rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
            Ready to launch?
          </h2>
          <p className="mt-4 mx-auto max-w-xl text-base leading-8 text-slate-300/76">
            APRO Works is the single entry point to rocketry aerospace toolset. One download, full access.
          </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              {user ? (
				<button
					onClick={() => {
						window.location.href = "https://zljhwosvsdqvgcgusqct.supabase.co/storage/v1/object/public/apro-products/apro-works/APRO%20Works_0.1.12_x64-setup.exe";
					}}
					className="inline-flex items-center gap-3 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),0_18px_28px_rgba(61,28,120,0.28)] transition duration-300 hover:-translate-y-0.5">
				>
					<Download size={18} />
					Download for Windows
					<ArrowRight className="h-4 w-4" />
				</button>
                //<button onClick={() => setBetaPopupOpen(true)}
                  //className="inline-flex items-center gap-3 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),0_18px_28px_rgba(61,28,120,0.28)] transition duration-300 hover:-translate-y-0.5">
                  //<Download size={18} /> Download for Windows
                //</button>
              ) : (
                <button onClick={() => setBetaPopupOpen(true)}
                  className="inline-flex items-center gap-3 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),0_18px_28px_rgba(61,28,120,0.28)] transition duration-300 hover:-translate-y-0.5">
                  <Download size={18} /> Log in to Download
                </button>
              )}
            </div>
        </div>
      </SectionBand>
      <BetaPopup open={betaPopupOpen} onClose={() => setBetaPopupOpen(false)} />
    </PageScaffold>
  );
};

export default AproWorks;

/* ─── AppOrbit — Circuit Board Chipset ─── */

interface AppInfo {
  id: string;
  title: string;
  description: string;
  logo: string;
}

function AppOrbit({ apps, aproLogo }: { apps: AppInfo[]; aproLogo: string }) {
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [typedHeader, setTypedHeader] = useState('');

  // Typewriter on hover — only the header line animates
  useEffect(() => {
    if (!hoveredApp) { setTypedHeader(''); return; }
    const app = apps.find(a => a.id === hoveredApp);
    if (!app) return;
    const header = `> ${app.title} MODULE v2.4.1`;
    setTypedHeader('');
    let i = 0;
    const type = () => {
      if (i >= header.length) return;
      i++;
      setTypedHeader(header.slice(0, i));
      const delay = header[i - 1] === '>' || header[i - 1] === ':' || header[i - 1] === ' ' ? 40 : 15 + Math.random() * 20;
      setTimeout(type, delay);
    };
    type();
    return () => { i = header.length; };
  }, [hoveredApp, apps]);

  const cpuChip = { x: 50, y: 50, w: 20, h: 18 };
  const appChips = apps.map((app, i) => {
    const pos = [
      { x: 15, y: 18, w: 15, h: 11 },
      { x: 70, y: 18, w: 15, h: 11 },
      { x: 15, y: 71, w: 15, h: 11 },
      { x: 70, y: 71, w: 15, h: 11 },
    ];
    return { ...pos[i], app };
  });

  const decoChips = [
    { x: 38, y: 9, w: 5, h: 3 }, { x: 57, y: 9, w: 3, h: 5 },
    { x: 9, y: 48, w: 3, h: 3 }, { x: 88, y: 48, w: 3, h: 3 },
    { x: 38, y: 85, w: 4, h: 3 }, { x: 58, y: 83, w: 3, h: 4 },
    { x: 46, y: 29, w: 3, h: 2 }, { x: 51, y: 66, w: 3, h: 2 },
    { x: 28, y: 38, w: 2, h: 2 }, { x: 72, y: 38, w: 2, h: 2 },
    { x: 28, y: 62, w: 2, h: 2 }, { x: 72, y: 62, w: 2, h: 2 },
  ];

  const leds: { x: number; y: number; color: string; delay: number }[] = [
    { x: 42, y: 7, color: '#22c55e', delay: 0 },
    { x: 55, y: 7, color: '#ef4444', delay: 0.3 },
    { x: 7, y: 55, color: '#eab308', delay: 0.6 },
    { x: 91, y: 55, color: '#22c55e', delay: 0.2 },
    { x: 42, y: 90, color: '#22c55e', delay: 0.5 },
    { x: 55, y: 90, color: '#3b82f6', delay: 0.8 },
    { x: 30, y: 42, color: '#eab308', delay: 0.4 },
    { x: 70, y: 55, color: '#ef4444', delay: 0.7 },
  ];

  const viaPositions = [
    { x: 15, y: 15 }, { x: 85, y: 15 }, { x: 15, y: 85 }, { x: 85, y: 85 },
    { x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 },
    { x: 50, y: 10 }, { x: 50, y: 90 }, { x: 10, y: 50 }, { x: 90, y: 50 },
  ];

  const traces = [
    { d: 'M -11,-14 L -11,-49 L -42,-49 L -42,-17', delay: '0s' },
    { d: 'M 11,-14 L 11,-49 L 42,-49 L 42,-17', delay: '0.3s' },
    { d: 'M -11,14 L -11,49 L -42,49 L -42,17', delay: '0.6s' },
    { d: 'M 11,14 L 11,49 L 42,49 L 42,17', delay: '0.9s' },
    { d: 'M -17,-6 L -28,-6 L -28,-49 L -53,-49', delay: '0.2s' },
    { d: 'M 17,6 L 28,6 L 28,49 L 53,49', delay: '0.5s' },
    { d: 'M -6,-17 L -6,-28 L -35,-28 L -35,-56 L -49,-56', delay: '0.4s' },
    { d: 'M 6,17 L 6,28 L 35,28 L 35,56 L 49,56', delay: '0.7s' },
  ];

  const decoTracePaths = [
    'M -112,-112 L -84,-84 L -42,-84 L -28,-70',
    'M 112,112 L 84,84 L 42,84 L 28,70',
    'M -112,112 L -84,84 L -42,84 L -28,70',
    'M 112,-112 L 84,-84 L 42,-84 L 28,-70',
  ];

  const appFeatures: Record<string, string[]> = {
    'burn-geometry': ['Grain geometry optimizer', 'Propellant burn simulation', 'Multi-port grain designer', 'CAM export for manufacturing'],
    'propulsor': ['Thermochemistry solver', 'Injector design wizard', 'Nozzle contour optimizer', 'Real-time chamber analysis'],
    'hexadof': ['6-DOF flight simulation', 'Live telemetry dashboard', 'Stability margin analysis', 'Sensor fusion engine'],
    'rsd': ['Parachute sizing calculator', 'Deployment sequence editor', 'Recovery load analysis', 'Drogue & main simulation'],
  };

  return (
    <div className="relative mt-12 mb-8 mx-auto w-full max-w-[1260px] overflow-hidden rounded-2xl bg-[linear-gradient(180deg,rgba(14,15,28,0.92),rgba(8,10,18,0.98))]"
      style={{ aspectRatio: '1260 / 884' }}>
      {/* PCB grid */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <pattern id="pcbGrid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="rgba(255,215,0,0.025)" strokeWidth="0.5" />
          </pattern>
          <pattern id="pcbGridLarge" width="136" height="136" patternUnits="userSpaceOnUse">
            <path d="M 136 0 L 0 0 0 136" fill="none" stroke="rgba(255,215,0,0.035)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pcbGrid)" />
        <rect width="100%" height="100%" fill="url(#pcbGridLarge)" />
      </svg>

      {/* Vias */}
      {viaPositions.map((v, i) => (
        <div key={`via-${i}`} className="absolute z-10" style={{ left: `${v.x}%`, top: `${v.y}%`, transform: 'translate(-50%,-50%)' }}>
          <div className="w-2.5 h-2.5 rounded-full border border-amber-500/40 bg-[#0a130a]" />
          <div className="absolute inset-0.5 rounded-full bg-amber-500/15" />
        </div>
      ))}

      {/* Trace lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" preserveAspectRatio="xMidYMid meet" viewBox="-280 -280 560 560">
        {traces.map((t, i) => (
          <g key={i}>
            <path d={t.d} fill="none" stroke="#b8960f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
            <path d={t.d} fill="none" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 17" className="animate-trace" opacity="0.6" style={{ animationDelay: t.delay }} />
            <path d={t.d} fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 20" className="animate-trace-fast" opacity="0.4" style={{ animationDelay: t.delay }} />
          </g>
        ))}
        {decoTracePaths.map((d, i) => (
          <path key={`dt-${i}`} d={d} fill="none" stroke="#b8960f" strokeWidth="2" strokeLinejoin="round" opacity="0.2" />
        ))}
      </svg>

      {/* LEDs */}
      {leds.map((led, i) => (
        <div key={`led-${i}`} className="absolute z-30" style={{ left: `${led.x}%`, top: `${led.y}%`, transform: 'translate(-50%,-50%)' }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: led.color, boxShadow: `0 0 6px ${led.color}` }}>
            <div className="w-full h-full rounded-full animate-ping" style={{ backgroundColor: led.color, animationDuration: `${1.5 + led.delay}s`, animationDelay: `${led.delay}s` }} />
          </div>
        </div>
      ))}

      {/* Decorative SMD chips */}
      {decoChips.map((d, i) => (
        <div key={`deco-${i}`} className="absolute z-25 rounded-sm border border-amber-500/10 bg-[#1a1a1a]" style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.w * 0.7}%`, height: `${d.h * 0.7}%`, transform: 'translate(-50%,-50%)', boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)' }}>
          <div className="absolute -top-0.5 left-1/3 w-0.5 h-0.5 rounded-full bg-amber-500/20" />
          <div className="absolute -bottom-0.5 left-2/3 w-0.5 h-0.5 rounded-full bg-amber-500/20" />
        </div>
      ))}

      {/* CPU chip — APRO Works */}
      <div className="absolute z-40" style={{ left: `${cpuChip.x}%`, top: `${cpuChip.y}%`, width: `${cpuChip.w}%`, height: `${cpuChip.h}%`, transform: 'translate(-50%,-50%)' }}>
        <div className="absolute inset-x-0 -top-1.5 flex justify-around px-3">
          {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="w-1 h-1.5 bg-amber-400/40 rounded-t-sm" />))}
        </div>
        <div className="absolute inset-x-0 -bottom-1.5 flex justify-around px-3">
          {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="w-1 h-1.5 bg-amber-400/40 rounded-b-sm" />))}
        </div>
        <div className="absolute inset-y-0 -left-1 flex flex-col justify-around py-2">
          {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="w-1.5 h-1 bg-amber-400/40 rounded-l-sm" />))}
        </div>
        <div className="absolute inset-y-0 -right-1 flex flex-col justify-around py-2">
          {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="w-1.5 h-1 bg-amber-400/40 rounded-r-sm" />))}
        </div>
            <div className="w-full h-full rounded-lg border-2 border-amber-500/25 bg-gradient-to-br from-[#222] to-[#111] flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.08)]">
          <div className="flex flex-col items-center gap-1.5">
            <img src={aproLogo} alt="APRO Works" className="h-10 w-10 md:h-12 md:w-12 object-contain" />
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-amber-400/70 font-mono font-bold">APRO Works</span>
          </div>
        </div>
        <div className="absolute -top-5 left-0 text-[8px] font-mono text-amber-500/30 tracking-wider">U1</div>
        <div className="absolute -bottom-4 right-0 text-[8px] font-mono text-amber-500/20">MAIN_PROC</div>
      </div>

      {/* App chips */}
      {appChips.map((chip, i) => {
        const isHovered = hoveredApp === chip.app.id;
        return (
          <div key={chip.app.id} className="absolute z-40 cursor-pointer" style={{ left: `${chip.x}%`, top: `${chip.y}%`, width: `${chip.w}%`, height: `${chip.h}%`, transform: 'translate(-50%,-50%)' }} onMouseEnter={() => setHoveredApp(chip.app.id)} onMouseLeave={() => setHoveredApp(null)}>
            <div className="absolute inset-x-0 -top-1 flex justify-around px-2">
              {Array.from({ length: 6 }).map((_, j) => (<div key={j} className="w-0.5 h-1 bg-amber-400/30 rounded-t-sm" />))}
            </div>
            <div className="absolute inset-x-0 -bottom-1 flex justify-around px-2">
              {Array.from({ length: 6 }).map((_, j) => (<div key={j} className="w-0.5 h-1 bg-amber-400/30 rounded-b-sm" />))}
            </div>
            <div className={`w-full h-full rounded-md border transition-all duration-300 flex items-center justify-center ${isHovered ? 'border-cyan-400/50 bg-[rgba(6,18,30,0.92)] shadow-[0_0_25px_rgba(34,211,238,0.15)]' : 'border-amber-500/15 bg-[#1a1a1a] hover:border-amber-400/30'}`}>
              <img src={chip.app.logo} alt={chip.app.title} className="h-8 w-8 md:h-10 md:w-10 object-contain" />
            </div>
            <div className="absolute -top-3.5 left-0 text-[7px] font-mono text-amber-500/25 tracking-wider">U{2 + i}</div>
          </div>
        );
      })}

      {/* Console terminal on hover */}
      {hoveredApp && (() => {
        const chip = appChips.find(c => c.app.id === hoveredApp);
        if (!chip) return null;
        const features = appFeatures[hoveredApp] || [];
        const isTopRow = chip.y < 40;
        return (
          <div className="absolute z-50 w-72 md:w-80" style={{ left: `${chip.x}%`, top: isTopRow ? `${chip.y + chip.h / 2 + 5}%` : `${chip.y - chip.h / 2 - 5}%`, transform: `translate(-50%, ${isTopRow ? '0' : '-100%'})` }}>
            <div className="rounded-lg border border-amber-500/25 bg-[rgba(10,15,10,0.97)] shadow-[0_0_30px_rgba(0,0,0,0.6)] overflow-hidden backdrop-blur-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border-b border-amber-500/15">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <span className="text-[10px] md:text-xs font-mono text-amber-400/40 ml-2">console -- {hoveredApp.toUpperCase()}</span>
              </div>
              <div className="px-3 py-3 font-mono text-xs md:text-sm leading-relaxed">
                <div className="text-amber-300/90 min-h-[16px]">
                  {typedHeader}{typedHeader.length > 0 && <span className="text-amber-400 animate-pulse">_</span>}
                  {typedHeader.length === 0 && <span className="text-amber-400 animate-pulse">_</span>}
                </div>
                <div className="mt-2 space-y-1.5 border-t border-amber-500/10 pt-2.5">
                  {features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2 text-amber-400/60">
                      <span className="text-[9px]">▪</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-amber-500/30 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500/50 animate-pulse" style={{ animationDuration: '2s' }} />
                  LINK_ESTABLISHED
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

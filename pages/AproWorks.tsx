import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ArrowRight, Sparkles, Monitor, Check, Flame, Rocket, Crown } from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { PageScaffold, SectionBand, SurfacePanel } from "../components/PageScaffold";
import IconCloud from "../components/IconCloud";
import { NumberTicker } from "../components/ui/number-ticker";
import { PricingCursor } from "../components/PricingCursor";
import { BetaPopup } from "../components/BetaPopup";
import { useCurrency } from "../src/context/CurrencyContext";
import { motion } from "framer-motion";
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
  const pricingRef = useRef<HTMLDivElement | null>(null);
  const [betaPopupOpen, setBetaPopupOpen] = useState(false);
  const { currency, convert } = useCurrency();

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

      <div className="after-hero" style={{
        opacity: showRest ? 1 : 0,
        transition: "opacity 0.8s ease",
        pointerEvents: showRest ? "auto" : "none",
      }}>
        {/* App Cloud Section */}
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

        {/* App Icon Cloud */}
        <div className="relative mt-16 mb-8">
          <div className="relative mx-auto flex items-center justify-center">
            <IconCloud images={apps.map(a => a.logo)} className="w-full max-w-[650px]" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full border-2 border-violet-400/40 bg-[linear-gradient(180deg,rgba(123,44,191,0.2),rgba(46,18,90,0.3))] shadow-[0_0_40px_rgba(123,44,191,0.15)]" style={{ animation: "aproFloat 4s ease-in-out infinite" }}>
                <img src={aproWorksLogo} alt="APRO Works" className="h-14 w-14 object-contain" />
              </div>
            </div>
          </div>
        </div>

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
          <div className="pt-10 md:pt-14 pb-4">
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

      {/* Pricing */}
      <SectionBand className="bg-[linear-gradient(180deg,rgba(12,14,28,0.95),rgba(8,11,18,0.98))]">
        <div ref={pricingRef} className="cursor-none">
          <PricingCursor containerRef={pricingRef} />
          <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="py-20 md:py-28"
        >
          <div className="text-center mb-16">
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400 mb-4">Pricing</div>
            <h2 className="text-[clamp(2.4rem,4vw,4.4rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
              Choose your launch tier.
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-base leading-8 text-slate-300/76">
              Scale from hobby rocketry to professional aerospace engineering.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 max-w-[1400px] mx-auto px-4">
            {[
              {
                name: "Ignition",
                price: 0,
                suffix: "/month",
                icon: <Sparkles size={20} />,
                color: "from-slate-400/20 to-transparent",
                border: "border-white/8",
                textColor: "text-slate-300",
                features: [
                  "R-Design",
                  "120 Community Tokens / mo",
                  "Feedback & Bug Reports",
                  "Browse community channels",
                  "Events (Viewing only)",
                ],
              },
              {
                name: "Thruster",
                price: 8.49,
                suffix: "/month",
                icon: <Flame size={20} />,
                color: "from-violet-500/20 to-transparent",
                border: "border-violet-500/30",
                textColor: "text-violet-200",
                popular: true,
                features: [
                  "Everything in Ignition",
                  "Burn & Geo Modeler, Propulsor, HexaDOF, RSD, RocketForge",
                  "Unlimited community tokens",
                  "Badges & Tags",
                  "All Community Channel Features",
                  "Event Participation",
                  "Team Management & Weekly Challenges",
                ],
              },
              {
                name: "Afterburner",
                price: 14.99,
                suffix: "/month",
                icon: <Rocket size={20} />,
                color: "from-cyan-500/20 to-transparent",
                border: "border-cyan-500/30",
                textColor: "text-cyan-200",
                features: [
                  "Everything in Thruster",
                  "Industry applications (external)",
                  "Priority Support",
                  "All badges & tags",
                  "Market access",
                  "Event Hosting & Management",
                ],
              },
              {
                name: "Payload Max",
                price: 36.95,
                suffix: "/month",
                icon: <Crown size={20} />,
                color: "from-amber-500/20 to-transparent",
                border: "border-amber-500/30",
                textColor: "text-amber-200",
                features: [
                  "Everything in Afterburner",
                  "1-on-1 session booking (3 free/mo)",
                  "Extra sessions $6.99 ea",
                  "5% discount on all Market products",
                ],
              },
            ].map((tier, i) => {
              const dp = tier.price > 0 ? convert(tier.price) : 0;
              const whole = Math.floor(dp);
              const dec = String(Math.round(dp % 1 * 100)).padStart(2, '0');
              return (
              <motion.div
                key={tier.name}
                data-pricing-card
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                className={`relative flex flex-col rounded-2xl border bg-[linear-gradient(180deg,rgba(20,24,37,0.9),rgba(8,10,18,0.95))] p-6 md:p-8 shadow-[0_8px_32px_rgba(4,7,16,0.3)] ${tier.border} ${tier.popular ? "ring-1 ring-violet-500/40" : ""} cursor-none`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(123,44,191,0.4)]">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tier.color} ${tier.textColor}`}>
                    {tier.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                </div>
                <div className="mb-6">
                  {tier.price > 0 ? (
                    <span className="text-[clamp(2.2rem,3.5vw,3rem)] font-extrabold tracking-tight text-white tabular-nums">
                      <span className="text-lg font-medium text-slate-400 align-top mr-0.5">{currency.symbol}</span>
                      <NumberTicker value={whole} decimalPlaces={0} className="text-inherit" />
                      <span className="text-[0.45em] font-medium text-slate-500 align-top">.{dec}</span>
                      <span className="ml-1 text-sm text-slate-500">/month</span>
                    </span>
                  ) : (
                    <span className="text-[clamp(1.8rem,3vw,2.6rem)] font-bold text-slate-400">Free</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-300/80">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-400/70" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setBetaPopupOpen(true)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition duration-300 ${
                    tier.popular
                      ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(61,28,120,0.3)] hover:-translate-y-0.5"
                      : "border border-white/10 text-slate-300 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {user ? "Get Started" : "Log in"}
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            );
          })}
          </div>
        </motion.div>
        </div>
      </SectionBand>
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
                <button onClick={() => setBetaPopupOpen(true)}
                  className="inline-flex items-center gap-3 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-8 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),0_18px_28px_rgba(61,28,120,0.28)] transition duration-300 hover:-translate-y-0.5">
                  <Download size={18} /> Download for Windows
                </button>
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
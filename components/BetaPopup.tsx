import React, { useState, useEffect } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  mins: number;
  secs: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSecs = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSecs / 86400),
    hours: Math.floor((totalSecs % 86400) / 3600),
    mins: Math.floor((totalSecs % 3600) / 60),
    secs: totalSecs % 60,
  };
}

interface BetaPopupProps {
  open: boolean;
  onClose: () => void;
}

export function BetaPopup({ open, onClose }: BetaPopupProps) {
  const TARGET = new Date("2026-09-01T00:00:00Z");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTimeLeft(TARGET));

  useEffect(() => {
    if (!open) return;
    setTimeLeft(calcTimeLeft(TARGET));
    const id = setInterval(() => setTimeLeft(calcTimeLeft(TARGET)), 1000);
    return () => clearInterval(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Download will start once the installer is ready.");
  };

  if (!open) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative mx-4 w-full max-w-lg animate-in rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,36,0.98),rgba(8,11,19,0.99))] p-8 shadow-[inset_1px_1px_0_rgba(255,255,255,0.05),0_32px_64px_rgba(4,7,16,0.5)]"
        style={{ animation: "betaFadeIn 0.25s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          ✕
        </button>

        <div className="mb-2 inline-block rounded-full bg-violet-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">
          Beta
        </div>

        <h2 className="mt-3 text-xl font-bold leading-snug text-white">
          We&rsquo;re still on BETA.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300/80">
          That means you get to try <strong className="text-white">everything for FREE</strong> until we release our first version. 
        </p>
        <p className="mt-1 text-sm text-slate-400">Expected time to launch:</p>

        <div className="mt-5 flex gap-3">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Mins", value: timeLeft.mins },
            { label: "Secs", value: timeLeft.secs },
          ].map((unit) => (
            <div
              key={unit.label}
              className="flex flex-1 flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4"
            >
              <span className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tabular-nums text-white">
                {pad(unit.value)}
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {unit.label}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={handleDownload}
          className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_12px_28px_rgba(61,28,120,0.32)] transition duration-300 hover:-translate-y-0.5"
        >
          Download for Windows
        </button>
      </div>

      <style>{`
        @keyframes betaFadeIn {
          0% { opacity: 0; transform: scale(0.92) translateY(12px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

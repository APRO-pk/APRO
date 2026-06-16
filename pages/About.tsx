import React from "react";
import { RefreshCw, Rocket, Shield } from "lucide-react";
import { PageHero, PageScaffold, SectionBand, SurfacePanel } from "../components/PageScaffold";

const About: React.FC = () => {
  return (
    <PageScaffold>
      <PageHero
        eyebrow="About APRO"
        title="From equations to engines."
        description="APRO began as a refusal to wait for infrastructure before building technical culture. The organization exists to create a disciplined rocketry path in Pakistan where none was clearly available."
      />

      <SectionBand className="bg-[linear-gradient(180deg,rgba(24,15,48,0.84),rgba(8,10,18,0.98))]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Origins</div>
            <h2 className="mt-4 max-w-[12ch] text-[clamp(2.8rem,4.5vw,5.2rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white">
              A technical path had to be built before rockets could fly.
            </h2>
          </div>
          <div className="space-y-6 text-base leading-8 text-slate-300/78">
            <p>
              APRO traces back to a university technical branch known as RPS
              (Rocket Propulsion Systems), formed when Pakistani students had
              curiosity but no defined structure for practical rocketry.
            </p>
            <p>
              The early philosophy was simple: if flight was restricted, the work
              would still continue through analysis, test discipline, and systems
              understanding. Data would replace altitude until the environment was
              ready for both.
            </p>
          </div>
        </div>
      </SectionBand>

      <SectionBand className="bg-[linear-gradient(180deg,rgba(12,14,28,0.92),rgba(8,11,18,0.98))]">
        <div className="grid gap-6 lg:grid-cols-3">
          <SurfacePanel>
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Rocket className="h-6 w-6 text-violet-100" />
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Pillar 01</div>
            <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">Static fire and propulsion analysis</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              Ground testing comes first. When flight windows are limited, APRO
              prioritizes thrust curves, stability, combustion behavior, and real
              propulsion data.
            </p>
          </SurfacePanel>

          <SurfacePanel className="bg-[linear-gradient(180deg,rgba(18,24,44,0.9),rgba(8,10,18,0.96))]">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <RefreshCw className="h-6 w-6 text-cyan-100" />
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Pillar 02</div>
            <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">Iterative design cycles</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              Design, test, fail safely, and learn. APRO treats failure as data,
              not drama, so members can build robust systems through iteration.
            </p>
          </SurfacePanel>

          <SurfacePanel className="bg-[linear-gradient(180deg,rgba(10,28,34,0.92),rgba(8,10,18,0.96))]">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Shield className="h-6 w-6 text-emerald-100" />
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Pillar 03</div>
            <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">Regulatory and safety standards</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              Technical culture does not scale without safety culture. APRO is
              building the governance and responsibility framework required for
              long-term aerospace work.
            </p>
          </SurfacePanel>
        </div>
      </SectionBand>
    </PageScaffold>
  );
};

export default About;

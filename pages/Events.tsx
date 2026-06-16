import React from "react";
import { Award, Cpu, LifeBuoy, Rocket, Settings, Zap } from "lucide-react";
import { GhostButton, PageHero, PageScaffold, SectionBand, SurfacePanel } from "../components/PageScaffold";

const activeTraining = [
  {
    title: "Rocket Design Workshop",
    description: "Full-stack rocketry covering propulsion, dynamics, and mission design.",
    icon: Settings,
  },
  {
    title: "Avionics Bay Integration",
    description: "Altimeters, wiring, recovery triggers, and payload safety systems.",
    icon: Cpu,
  },
  {
    title: "Recovery Systems 101",
    description: "Parachutes, shock cords, and recovery architecture built for safe flight.",
    icon: LifeBuoy,
  },
];

const Events: React.FC = () => {
  return (
    <PageScaffold>
      <PageHero
        eyebrow="Manifest"
        title="Mission path from design to launch."
        description="APRO workshops are structured as phases, not isolated events. Each block moves members closer to disciplined technical work and future flight capability."
      />

      <SectionBand className="bg-[linear-gradient(180deg,rgba(18,20,38,0.96),rgba(8,10,18,0.98))]">
        <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Active Training</div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {activeTraining.map((item) => {
            const Icon = item.icon;
            return (
              <SurfacePanel key={item.title}>
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
                  <Icon className="h-6 w-6 text-violet-100" />
                </div>
                <h3 className="mt-8 text-3xl font-bold tracking-[-0.05em] text-white">{item.title}</h3>
                <p className="mt-4 text-base leading-8 text-slate-300/76">{item.description}</p>
                <div className="mt-8">
                  <GhostButton href="https://forms.gle/D1QV1Evxd6iC2hVo7" target="_blank" rel="noreferrer">
                    Register now
                  </GhostButton>
                </div>
              </SurfacePanel>
            );
          })}
        </div>
      </SectionBand>

      <SectionBand className="bg-[linear-gradient(180deg,rgba(10,28,34,0.92),rgba(8,10,18,0.98))]">
        <div className="grid gap-6 lg:grid-cols-2">
          <SurfacePanel className="bg-[linear-gradient(180deg,rgba(20,30,42,0.86),rgba(8,10,18,0.94))]">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Zap className="h-6 w-6 text-cyan-100" />
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Coming Soon</div>
            <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">TVC Design Lab</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              Introduction to thrust vector control, gimbal systems, and active stabilization.
            </p>
          </SurfacePanel>

          <SurfacePanel className="bg-[linear-gradient(180deg,rgba(30,21,46,0.86),rgba(8,10,18,0.94))]">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Rocket className="h-6 w-6 text-fuchsia-100" />
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Coming Soon</div>
            <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">The inaugural launch</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              The first official APRO launch event once the technical and safety layers are ready.
            </p>
          </SurfacePanel>
        </div>
      </SectionBand>

      <SectionBand className="bg-[linear-gradient(180deg,rgba(24,15,48,0.88),rgba(8,10,18,1))]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Award className="h-6 w-6 text-violet-100" />
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Roadmap</div>
            <h2 className="mt-4 max-w-[13ch] text-[clamp(2.8rem,4.8vw,5.4rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white">
              National certification trials.
            </h2>
          </div>
          <div>
            <p className="max-w-3xl text-base leading-8 text-slate-300/76">
              The long-term goal is a structured certification process for amateur
              rocketeers in Pakistan, built on real standards rather than informal
              experimentation.
            </p>
          </div>
        </div>
      </SectionBand>
    </PageScaffold>
  );
};

export default Events;

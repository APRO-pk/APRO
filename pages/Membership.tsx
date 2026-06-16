import React from "react";
import { Calendar, FolderOpen, Users } from "lucide-react";
import { GhostButton, PageHero, PageScaffold, SectionBand, SurfacePanel } from "../components/PageScaffold";

const Membership: React.FC = () => {
  return (
    <PageScaffold>
      <PageHero
        eyebrow="Membership"
        title="Join the APRO network."
        description="Membership is the first layer into the organization. It gives people entry into community, technical resources, and structured aerospace activity."
      />

      <SectionBand className="bg-[linear-gradient(180deg,rgba(12,14,28,0.96),rgba(8,10,18,1))]">
        <div className="grid gap-6 lg:grid-cols-3">
          <SurfacePanel>
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Users className="h-6 w-6 text-violet-100" />
            </div>
            <h3 className="mt-8 text-3xl font-bold tracking-[-0.05em] text-white">Community access</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              Join a network of students, builders, and mentors working around
              propulsion, systems, and launch culture.
            </p>
          </SurfacePanel>

          <SurfacePanel className="bg-[linear-gradient(180deg,rgba(18,24,44,0.9),rgba(8,10,18,0.96))]">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <FolderOpen className="h-6 w-6 text-cyan-100" />
            </div>
            <h3 className="mt-8 text-3xl font-bold tracking-[-0.05em] text-white">Resource library</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              Access technical material, guides, safety doctrine, and internal
              references as the APRO knowledge layer grows.
            </p>
          </SurfacePanel>

          <SurfacePanel className="bg-[linear-gradient(180deg,rgba(30,21,46,0.88),rgba(8,10,18,0.96))]">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Calendar className="h-6 w-6 text-fuchsia-100" />
            </div>
            <h3 className="mt-8 text-3xl font-bold tracking-[-0.05em] text-white">Exclusive events</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              Get routed early into workshops, launches, and APRO sessions before
              the broader public announcement layer.
            </p>
          </SurfacePanel>
        </div>
      </SectionBand>

      <SectionBand className="bg-[linear-gradient(180deg,rgba(24,15,48,0.88),rgba(8,10,18,1))]">
        <div className="grid gap-6 lg:grid-cols-2">
          <SurfacePanel>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Individual Track</div>
            <h3 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-white">Student / Individual</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              Ideal for students and individuals entering rocketry through structured training and participation.
            </p>
            <div className="mt-8"><GhostButton to="/student">Apply now</GhostButton></div>
          </SurfacePanel>

          <SurfacePanel className="bg-[linear-gradient(95deg,rgba(7,41,47,0.9),rgba(8,10,18,1))]">
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">Institutional Track</div>
            <h3 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-white">Chapter / Squadron</h3>
            <p className="mt-4 text-base leading-8 text-slate-300/76">
              For campuses building a local APRO node and leading organized aerospace activity.
            </p>
            <div className="mt-8"><GhostButton to="/chapter">Apply now</GhostButton></div>
          </SurfacePanel>
        </div>
      </SectionBand>
    </PageScaffold>
  );
};

export default Membership;

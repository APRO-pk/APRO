import React from "react";
import { supabase } from "../src/lib/supabase";
import { Ban, Shield, XCircle, Zap } from "lucide-react";
import { GhostButton, PageHero, PageScaffold, SectionBand, SurfacePanel } from "../components/PageScaffold";

const { data } = supabase.storage
  .from("docs")
  .getPublicUrl("APRO National Safety Code (NSOC) v1.pdf");

const safetyCodeUrl = data.publicUrl;

const Legal: React.FC = () => {
  return (
    <PageScaffold>
      <PageHero
        eyebrow="Legal Layer"
        title="Safety governance before flight scale."
        description="The APRO legal layer is about operational discipline first. These standards define how participation can grow responsibly."
      />

      <SectionBand className="bg-[linear-gradient(95deg,rgba(7,41,47,0.9),rgba(8,10,18,1))]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Shield className="h-6 w-6 text-cyan-100" />
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">National Safety Code</div>
            <h2 className="mt-4 max-w-[12ch] text-[clamp(2.8rem,4.5vw,5.2rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white">
              Mandatory safety doctrine for APRO activity.
            </h2>
            <p className="mt-5 max-w-[34ch] text-base leading-8 text-slate-300/76">
              Adherence is required for launch operations, supervision, recovery,
              and all technical activity happening under the APRO name.
            </p>
            <div className="mt-8"><GhostButton href={safetyCodeUrl}>Open safety code</GhostButton></div>
          </div>

          <div className="grid gap-4">
            <SurfacePanel>
              <div className="flex items-center gap-3 text-sm text-slate-200"><Ban className="h-5 w-5 text-red-300" /> No targeting of people, property, or living creatures.</div>
            </SurfacePanel>
            <SurfacePanel>
              <div className="flex items-center gap-3 text-sm text-slate-200"><Zap className="h-5 w-5 text-yellow-300" /> Electrical remote ignition only for launches.</div>
            </SurfacePanel>
            <SurfacePanel>
              <div className="flex items-center gap-3 text-sm text-slate-200"><XCircle className="h-5 w-5 text-slate-300" /> No metallic airframe bodies for standard participation.</div>
            </SurfacePanel>
          </div>
        </div>
      </SectionBand>
    </PageScaffold>
  );
};

export default Legal;

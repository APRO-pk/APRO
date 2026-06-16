import React from "react";
import { Instagram, Mail } from "lucide-react";
import { PageHero, PageScaffold, SectionBand, SurfacePanel } from "../components/PageScaffold";

const Contact: React.FC = () => {
  return (
    <PageScaffold>
      <PageHero
        eyebrow="Contact"
        title="Get in touch with APRO."
        description="Reach out for partnerships, questions, or conversations around structured rocketry and aerospace culture in Pakistan."
      />

      <SectionBand className="bg-[linear-gradient(180deg,rgba(12,14,28,0.96),rgba(8,10,18,1))]">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <SurfacePanel className="bg-[linear-gradient(180deg,rgba(18,24,44,0.9),rgba(8,10,18,0.96))]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
                <Mail className="h-6 w-6 text-cyan-100" />
              </div>
              <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Email</div>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">General inquiries</h3>
              <a href="mailto:contact.apro.pk@gmail.com" className="mt-5 block text-base text-slate-200 hover:text-white">
                contact.apro.pk@gmail.com
              </a>
            </SurfacePanel>

            <SurfacePanel className="bg-[linear-gradient(180deg,rgba(31,21,56,0.88),rgba(8,10,18,0.96))]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
                <Instagram className="h-6 w-6 text-violet-100" />
              </div>
              <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">Instagram</div>
              <h3 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-white">Follow APRO</h3>
              <a href="https://www.instagram.com/apro.pk?igsh=OGY1Mmw4ZWI3MXhx" target="_blank" rel="noreferrer" className="mt-5 block text-base text-slate-200 hover:text-white">
                @apro.pk
              </a>
            </SurfacePanel>
          </div>

          <SurfacePanel>
            <h3 className="text-3xl font-bold tracking-[-0.05em] text-white">Send a message</h3>
            <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Message sent (simulation)"); }}>
              {["Full Name", "Email Address", "Subject"].map((label) => (
                <div key={label}>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</label>
                  <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/28" placeholder={label} />
                </div>
              ))}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Message</label>
                <textarea rows={6} className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-300/28" placeholder="Your message" />
              </div>
              <button className="inline-flex items-center rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white">
                Send message
              </button>
            </form>
          </SurfacePanel>
        </div>
      </SectionBand>
    </PageScaffold>
  );
};

export default Contact;

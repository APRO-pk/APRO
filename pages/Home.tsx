import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  GraduationCap,
  Rocket,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { supabase } from "../src/lib/supabase";
import bgHome from "../assets/bg-home.avif";

const { data } = supabase.storage
  .from("docs")
  .getPublicUrl("APRO National Safety Code (NSOC) v1.pdf");

const safetyCodeUrl = data.publicUrl;

const routes = [
  {
    eyebrow: "Membership",
    title: "Student / Individual Access",
    description:
      "Training, technical sessions, mentorship, and the first operating layer into APRO.",
    to: "/student",
    icon: GraduationCap,
  },
  {
    eyebrow: "Core Team",
    title: "Join APRO",
    description:
      "Contributor, internship, and internal execution roles across engineering and operations.",
    to: "/join",
    icon: User,
  },
  {
    eyebrow: "Chapters",
    title: "Start a Squadron",
    description:
      "Create a campus node and bring local participation into the national structure.",
    to: "/chapter",
    icon: Rocket,
  },
];

const routeTints = [
  "from-violet-500/18 via-transparent to-transparent",
  "from-sky-500/14 via-transparent to-transparent",
  "from-fuchsia-500/16 via-transparent to-transparent",
];

const Home: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-[#05070d] text-white">
      <style>{`
        @keyframes aproPulse {
          0%, 100% { opacity: 0.28; transform: translate3d(0, 0, 0) scale(1); }
          50% { opacity: 0.52; transform: translate3d(0, -18px, 0) scale(1.04); }
        }

        @keyframes aproLineDrift {
          0%, 100% { transform: translateX(0); opacity: 0.28; }
          50% { transform: translateX(12px); opacity: 0.5; }
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(123,44,191,0.16),transparent_20%),radial-gradient(circle_at_84%_10%,rgba(73,121,255,0.1),transparent_18%),linear-gradient(180deg,#060912_0%,#05070d_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.85) 0.55px, transparent 0.7px)",
            backgroundSize: "4px 4px",
          }}
        />
      </div>

      <section className="relative min-h-[88vh] border-b border-white/10">
        <div className="absolute inset-0">
          <img
            src={bgHome}
            alt="Rocket launch"
            className="h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(92deg,rgba(5,7,12,0.95)_0%,rgba(6,9,15,0.8)_42%,rgba(6,9,15,0.3)_72%,rgba(6,9,15,0.78)_100%),linear-gradient(180deg,rgba(5,7,12,0.2)_0%,rgba(5,7,12,0.54)_62%,rgba(5,7,12,0.94)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_30%,rgba(123,44,191,0.24),transparent_24%),radial-gradient(circle_at_74%_66%,rgba(255,255,255,0.08),transparent_18%)]" />
          <div
            className="absolute bottom-[17%] left-[7%] h-px w-[22vw] min-w-[180px] bg-gradient-to-r from-violet-300/0 via-violet-300/55 to-violet-300/0"
            style={{ animation: "aproLineDrift 10s ease-in-out infinite" }}
          />
        </div>

        <div className="relative mx-auto grid min-h-[88vh] w-full max-w-[1880px] grid-cols-1 px-5 pb-12 pt-10 md:px-8 xl:grid-cols-[minmax(0,1.4fr)_360px] xl:px-12">
          <div className="flex min-h-[70vh] flex-col justify-between pr-0 xl:pr-16">
            <div className="flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.36em] text-slate-300/92">
              <span className="rounded-full border border-violet-300/24 bg-violet-400/10 px-4 py-2 text-violet-100 shadow-[inset_1px_1px_0_rgba(255,255,255,0.08),0_10px_28px_rgba(46,18,90,0.22)]">
                APRO Network
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Flight Culture
              </span>
            </div>

            <div className="py-12 xl:py-16">
              <div className="mb-5 flex items-center gap-3 text-violet-200/90">
                <Sparkles className="h-4 w-4" />
                <span className="text-[12px] uppercase tracking-[0.38em] text-slate-300/90">
                  Home Layer
                </span>
              </div>

              <h1 className="max-w-[12ch] text-[clamp(4.4rem,9vw,11rem)] font-extrabold leading-[0.84] tracking-[-0.085em] text-white">
                Build the next generation of
                <span className="block bg-[linear-gradient(180deg,#ffffff_6%,#cabdff_92%)] bg-clip-text text-transparent">
                  rocketry.
                </span>
              </h1>

              <p className="mt-8 max-w-3xl text-[clamp(1rem,1.35vw,1.35rem)] leading-[1.9] text-slate-200/80">
                APRO connects students, builders, and campus leads through one
                national operating layer for access, chapters, safety, and
                long-term technical momentum.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/student"
                  className="group inline-flex items-center gap-2 rounded-full border border-violet-200/30 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-7 py-3.5 text-sm font-semibold text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),inset_-2px_-2px_6px_rgba(54,19,108,0.65),0_20px_34px_rgba(61,28,120,0.42)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[inset_1px_1px_0_rgba(255,255,255,0.34),inset_-2px_-2px_8px_rgba(54,19,108,0.68),0_24px_38px_rgba(61,28,120,0.48)]"
                >
                  Apply for membership
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/chapter"
                  className="inline-flex items-center rounded-full border border-white/14 bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-slate-100 transition duration-300 hover:border-white/22 hover:bg-white/[0.08]"
                >
                  Start a chapter
                </Link>
              </div>
            </div>

          </div>

          <div className="hidden xl:flex xl:items-end xl:justify-end">
            <div className="relative h-[62vh] w-full max-w-[340px] border-l border-white/10 pl-10">
              <div
                className="absolute right-0 top-[18%] h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"
                style={{ animation: "aproPulse 9s ease-in-out infinite" }}
              />
              <div className="space-y-10 pt-12">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.34em] text-slate-500">
                    System
                  </div>
                  <p className="mt-4 text-lg leading-8 text-slate-200/78">
                    Membership brings people in. Chapters distribute activity.
                    Safety and governance keep it coherent.
                  </p>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.34em] text-slate-500">
                    Direction
                  </div>
                  <p className="mt-4 text-lg leading-8 text-slate-200/78">
                    Build a national rocketry layer that can grow without losing
                    standards.
                  </p>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-[0.34em] text-slate-500">
                    Start Here
                  </div>
                  <div className="mt-4 space-y-3">
                    <Link
                      to="/membership"
                      className="block text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-violet-200"
                    >
                      Membership
                    </Link>
                    <Link
                      to="/legal"
                      className="block text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-violet-200"
                    >
                      Legal layer
                    </Link>
                    <a
                      href={safetyCodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:text-violet-200"
                    >
                      Safety code
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(12,14,28,0.88),rgba(8,11,18,0.98))]">
        <div className="mx-auto w-full max-w-[1880px] px-5 md:px-8 xl:px-12">
          <div className="grid lg:grid-cols-3">
            {routes.map((route, index) => {
              const Icon = route.icon;
              return (
                <Link
                  key={route.title}
                  to={route.to}
                  className={`group px-0 py-10 transition duration-300 hover:bg-white/[0.025] md:px-2 xl:px-4 ${
                    index < routes.length - 1 ? "border-b border-white/10 lg:border-b-0 lg:border-r" : ""
                  }`}
                >
                  <div className="relative overflow-hidden rounded-[28px] px-2 py-2 md:px-6">
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${routeTints[index]} opacity-90 transition duration-300 group-hover:opacity-100`}
                    />
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.04]">
                        <Icon className="h-5 w-5 text-violet-100" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.34em] text-slate-400">
                        {route.eyebrow}
                      </span>
                    </div>

                    <h2 className="mt-10 max-w-[16ch] text-[clamp(2rem,2.3vw,3.1rem)] font-bold leading-[0.96] tracking-[-0.055em] text-white">
                      {route.title}
                    </h2>
                    <p className="mt-5 max-w-[30ch] text-base leading-8 text-slate-300/78">
                      {route.description}
                    </p>

                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
                      Open route
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(20,20,40,0.96),rgba(7,10,18,1))]">
        <div className="mx-auto grid w-full max-w-[1880px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:px-12">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">
              System Logic
            </div>
            <h2 className="mt-5 max-w-[14ch] text-[clamp(3rem,5vw,6rem)] font-bold leading-[0.92] tracking-[-0.065em] text-white">
              Join APRO, start a chapter, or Join as a student.
            </h2>
          </div>

          <div className="flex flex-col justify-end">
            <p className="max-w-2xl text-[clamp(1rem,1.25vw,1.2rem)] leading-[1.9] text-slate-300/79">
              APRO begins with membership, grows through chapters, and stays
              disciplined through safety and governance. Every route here is meant
              to move people directly into the part of the ecosystem they are ready
              to build.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/membership"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:border-white/18 hover:bg-white/[0.07]"
              >
                View membership
              </Link>
              <Link
                to="/join"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:border-white/18 hover:bg-white/[0.07]"
              >
                Join APRO
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/10 bg-[linear-gradient(95deg,rgba(7,41,47,0.9),rgba(8,10,18,1))]">
        <div className="mx-auto grid w-full max-w-[1880px] gap-0 px-5 md:px-8 lg:grid-cols-1 xl:px-12">
          <div className="py-14 lg:pr-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
              <Shield className="h-6 w-6 text-violet-100" />
            </div>
            <div className="mt-8 text-[11px] uppercase tracking-[0.34em] text-slate-400">
              Safety Layer
            </div>
            <h2 className="mt-4 max-w-[12ch] text-[clamp(2.8rem,4.4vw,5rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white">
              National Safety Code
            </h2>
            <p className="mt-5 max-w-[32ch] text-base leading-8 text-slate-300/80">
              Read the doctrine behind APRO field activity, launch discipline, and
              supervised experimentation before stepping into operations.
            </p>
            <a
              href={safetyCodeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-200/14 bg-cyan-400/[0.06] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition duration-300 hover:border-cyan-200/22 hover:bg-cyan-400/[0.1]"
            >
              Open safety code
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,rgba(37,18,64,0.84),rgba(8,10,18,1))]">
        <div className="mx-auto grid w-full max-w-[1880px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:px-12">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">
              Chapter Expansion
            </div>
            <h2 className="mt-5 max-w-[13ch] text-[clamp(3rem,5vw,5.8rem)] font-bold leading-[0.92] tracking-[-0.065em] text-white">
              Build the local node before the system reaches it.
            </h2>
          </div>

          <div className="flex flex-col justify-end">
            <p className="max-w-3xl text-[clamp(1rem,1.25vw,1.2rem)] leading-[1.9] text-slate-300/79">
              If your campus needs a structured entry into rocketry, start the
              squadron first. APRO can then scale participation through a clear
              local anchor instead of scattered individual efforts.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/chapter"
                className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#8c6cff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.24),inset_-2px_-2px_6px_rgba(54,19,108,0.58),0_18px_28px_rgba(61,28,120,0.28)] transition duration-300 hover:-translate-y-0.5"
              >
                Start a chapter
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:border-white/18 hover:bg-white/[0.07]"
              >
                Contact APRO
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

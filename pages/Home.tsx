import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  GraduationCap,
  Rocket,
  Shield,
  Sparkles,
  User,
  Users,
  MessageCircle,
  Repeat2,
  Eye,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../src/lib/supabase";
import { fetchLaunchpad, getCachedDisplayName } from "../src/lib/community-api";
import aproVideo from "../assets/aprorefined.mp4";
import aproWorksVideo from "../assets/aproworkscompressed.mp4";
import blazingFast from "../assets/aproworksPerks/blazingFast.png";
import safeandreliable from "../assets/aproworksPerks/safeandreliable.png";
import crossCompatibility from "../assets/aproworksPerks/crossCompatibility.png";
import sharedCompute from "../assets/aproworksPerks/sharedCompute.png";
import realtimeCollab from "../assets/aproworksPerks/realtimeCollab.png";
import aiImplementation from "../assets/aproworksPerks/aiImplementation.png";
import easytolearn from "../assets/aproworksPerks/easytolearn.png";
import library from "../assets/aproworksPerks/library.png";
import community from "../assets/aproworksPerks/community.png";

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
    to: "/join",
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
  const [upcomingEvent, setUpcomingEvent] = useState<{ title: string; slug: string } | null>(null);
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [communityStats, setCommunityStats] = useState({ members: 0, posts: 0, crews: 0, projects: 0 });

  useEffect(() => {
    supabase
      .from('admin_events')
      .select('title, slug, event_days')
      .in('status', ['upcoming', 'coming_soon'])
      .order('event_days->>0', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUpcomingEvent(data);
      });
  }, []);

  useEffect(() => {
    fetchLaunchpad().then((result) => {
      setCommunityPosts(result.posts.slice(0, 12));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      supabase.from('community_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('community_posts').select('id', { count: 'exact', head: true }),
      supabase.from('crews').select('id', { count: 'exact', head: true }),
      supabase.from('projects').select('id', { count: 'exact', head: true }),
    ]).then(([profiles, posts, crews, projects]) => {
      setCommunityStats({
        members: profiles.count ?? 0,
        posts: posts.count ?? 0,
        crews: crews.count ?? 0,
        projects: projects.count ?? 0,
      });
    }).catch(() => {});
  }, []);
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
          <video
            src={aproVideo}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover object-center"
            style={{ filter: 'blur(4px)' }}
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

            <div className="py-12 xl:py-0">

              <h1 className="max-w-[12ch] text-[clamp(4.4rem,9vw,11rem)] font-extrabold leading-[1.15] tracking-[-0.08em] text-white">
                Build the next generation of
                <span className="block bg-[linear-gradient(180deg,#ffffff_6%,#cabdff_92%)] bg-clip-text text-transparent">
                  rocketry.
                </span>
              </h1>

              <p className="mt-8 max-w-3xl text-[clamp(1rem,1.35vw,1.35rem)] leading-[1.9] text-slate-200/80">
                APRO connects students, builders, and campus leads through one
                international operating layer for access, chapters, safety, and
                long-term technical momentum.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/join"
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
                    Quick Links
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

      {/* Route cards */}
      <section className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(12,14,28,0.88),rgba(8,11,18,0.98))]">
        <div className="mx-auto w-full max-w-[1880px] px-5 md:px-8 xl:px-12">
          <div className="grid lg:grid-cols-3">

            {/* Browse Community */}
            <Link
              to="/community"
              className="group px-0 py-10 transition duration-300 hover:bg-white/[0.025] md:px-2 xl:px-4 border-b border-white/10 lg:border-b-0 lg:border-r"
            >
              <div className="relative overflow-hidden rounded-[28px] px-2 py-2 md:px-6">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/18 via-transparent to-transparent opacity-90 transition duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.04]">
                    <Users className="h-5 w-5 text-violet-100" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.34em] text-slate-400">Community</span>
                </div>
                <h2 className="mt-10 max-w-[16ch] text-[clamp(2rem,2.3vw,3.1rem)] font-bold leading-[0.96] tracking-[-0.055em] text-white">
                  Browse Community
                </h2>
                <p className="mt-5 max-w-[30ch] text-base leading-8 text-slate-300/78">
                  Explore launches, telemetry, crews, and missions across the APRO network.
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
                  Open community
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Join APRO */}
            <Link
              to="/join"
              className="group px-0 py-10 transition duration-300 hover:bg-white/[0.025] md:px-2 xl:px-4 border-b border-white/10 lg:border-b-0 lg:border-r"
            >
              <div className="relative overflow-hidden rounded-[28px] px-2 py-2 md:px-6">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/14 via-transparent to-transparent opacity-90 transition duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.04]">
                    <User className="h-5 w-5 text-violet-100" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.34em] text-slate-400">Core Team</span>
                </div>
                <h2 className="mt-10 max-w-[16ch] text-[clamp(2rem,2.3vw,3.1rem)] font-bold leading-[0.96] tracking-[-0.055em] text-white">
                  Join APRO
                </h2>
                <p className="mt-5 max-w-[30ch] text-base leading-8 text-slate-300/78">
                  Contributor, internship, and internal execution roles across engineering and operations.
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
                  Apply now
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* Upcoming Events */}
            <Link
              to={upcomingEvent ? `/events` : `/events`}
              className="group px-0 py-10 transition duration-300 hover:bg-white/[0.025] md:px-2 xl:px-4"
            >
              <div className="relative overflow-hidden rounded-[28px] px-2 py-2 md:px-6">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/16 via-transparent to-transparent opacity-90 transition duration-300 group-hover:opacity-100" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.04]">
                    <Calendar className="h-5 w-5 text-violet-100" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.34em] text-slate-400">Events</span>
                </div>
                <h2 className="mt-10 max-w-[16ch] text-[clamp(2rem,2.3vw,3.1rem)] font-bold leading-[0.96] tracking-[-0.055em] text-white">
                  {upcomingEvent ? upcomingEvent.title : 'Upcoming Events'}
                </h2>
                <p className="mt-5 max-w-[30ch] text-base leading-8 text-slate-300/78">
                  {upcomingEvent
                    ? 'Register now for the next APRO event.'
                    : 'Check back soon for upcoming APRO events and activities.'}
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">
                  {upcomingEvent ? 'Register now' : 'Check events'}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* System Logic */}
      <section className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(20,20,40,0.96),rgba(7,10,18,1))]">
        <div className="mx-auto grid w-full max-w-[1880px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:px-12">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">
              System Logic
            </div>
            <h2 className="mt-5 max-w-[14ch] text-[clamp(3rem,5vw,6rem)] font-bold leading-[0.92] tracking-[-0.065em] text-white">
              Join APRO, start a chapter, or Join as an individual.
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
                to="/join"
                className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#8c6cff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.24),inset_-2px_-2px_6px_rgba(54,19,108,0.58),0_18px_28px_rgba(61,28,120,0.28)] transition duration-300 hover:-translate-y-0.5"
              >
                Become a member
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/chapter"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:border-white/18 hover:bg-white/[0.07]"
              >
                Start a chapter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,10,18,1),rgba(12,14,28,0.96))]">
        <div className="mx-auto grid w-full max-w-[1880px] gap-10 px-5 py-16 md:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:px-12">
          {/* Left — scrolling community feed */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400 mb-3">Live Feed</div>
            <h2 className="max-w-[16ch] text-[clamp(2.2rem,3.5vw,4rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white mb-6">
              What the community is building
            </h2>
            <div className="relative h-[500px] overflow-hidden rounded-2xl border border-white/5">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0c18] pointer-events-none z-10" />
              <div className="animate-scroll-up space-y-4 px-4 py-4">
                {communityPosts.length > 0 ? (
                  [...communityPosts, ...communityPosts].map((post, i) => (
                    <div key={`${post.id}-${i}`} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-300">
                          {(getCachedDisplayName(post.author_id)[0] || '?').toUpperCase()}
                        </div>
                        <span className="truncate">{getCachedDisplayName(post.author_id)}</span>
                      </div>
                      <p className="text-sm text-slate-200/80 line-clamp-2 leading-relaxed">{post.content}</p>
                      {post.images && post.images.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {post.images.slice(0, 2).map((img: string, idx: number) => (
                            <div key={idx} className="w-28 h-20 rounded-lg overflow-hidden border border-white/[0.06] shrink-0">
                              <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ))}
                          {post.images.length > 2 && (
                            <div className="w-28 h-20 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs text-slate-500 shrink-0">
                              +{post.images.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1"><MessageCircle size={12} />{post.comment_count ?? 0}</span>
                        <span className="flex items-center gap-1"><Repeat2 size={12} />{post.relaunch_of ? 1 : 0}</span>
                        <span className="flex items-center gap-1"><Eye size={12} />{post.altitude ?? 0}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 animate-pulse">
                      <div className="h-3 w-24 bg-white/5 rounded mb-3" />
                      <div className="h-4 w-full bg-white/5 rounded mb-2" />
                      <div className="h-4 w-3/4 bg-white/5 rounded" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right — stats + CTA */}
          <div className="flex flex-col justify-center lg:pl-8">
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400 mb-3">Community</div>
            <h2 className="max-w-[14ch] text-[clamp(2rem,3vw,3.6rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white mb-6">
              A network that builds together
            </h2>
            <p className="text-base leading-8 text-slate-300/80 mb-8 max-w-[40ch]">
              APRO's community is where members share launches, form crews, collaborate on missions, and push rocketry forward together.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                <div className="text-3xl font-bold text-white">{communityStats.members || '—'}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mt-1">Active members</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                <div className="text-3xl font-bold text-white">{communityStats.posts || '—'}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mt-1">New posts</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                <div className="text-3xl font-bold text-white">{communityStats.crews || '—'}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mt-1">Crews</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
                <div className="text-3xl font-bold text-white">{communityStats.projects || '—'}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mt-1">Projects</div>
              </div>
            </div>

            <Link
              to="/community"
              className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-7 py-3.5 text-sm font-semibold text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),inset_-2px_-2px_6px_rgba(54,19,108,0.65),0_20px_34px_rgba(61,28,120,0.42)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[inset_1px_1px_0_rgba(255,255,255,0.34),inset_-2px_-2px_8px_rgba(54,19,108,0.68),0_24px_38px_rgba(61,28,120,0.48)] self-start"
            >
              Join the community
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* APRO Works Section */}
      <section className="relative border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,10,18,1),rgba(12,14,28,0.96))]">
        <div className="mx-auto grid w-full max-w-[1880px] gap-8 px-5 py-20 md:px-8 lg:grid-cols-[1fr_1.3fr] xl:px-12">
          <div className="flex flex-col justify-center">
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400 mb-3">APRO Works</div>
            <h2 className="max-w-[14ch] text-[clamp(2.2rem,3.5vw,4rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white mb-6">
              Want to build your own rocket?
            </h2>
            <p className="text-base leading-8 text-slate-300/80 mb-6 max-w-[42ch]">
              APRO Works is a unified desktop toolset with multiple applications for designing, simulating, and launching rockets. 
              From grain geometry and propellant burn simulation to 6-DOF flight analysis and recovery system sizing, everything 
              you need to build, test, and improve your rocket designs in one place.
            </p>
            <Link
              to="/apro-works"
              className="inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-7 py-3.5 text-sm font-semibold text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.3),inset_-2px_-2px_6px_rgba(54,19,108,0.65),0_20px_34px_rgba(61,28,120,0.42)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[inset_1px_1px_0_rgba(255,255,255,0.34),inset_-2px_-2px_8px_rgba(54,19,108,0.68),0_24px_38px_rgba(61,28,120,0.48)] self-start"
            >
              Download now for free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_60px_rgba(123,44,191,0.18),0_20px_50px_rgba(4,7,16,0.4)]">
              <video
                src={aproWorksVideo}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* APRO Works Perks */}
      <section className="relative border-b border-white/10 bg-[linear-gradient(0deg,rgba(8,10,18,1),rgba(14,16,30,0.98))]">
        <div className="mx-auto w-full max-w-[1880px] px-5 py-20 md:px-8 xl:px-12">
          <div className="text-center mb-14">
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400 mb-3">Built for Performance</div>
            <h2 className="text-[clamp(2rem,3.2vw,3.6rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white">
              Everything you need to engineer rockets
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-base leading-8 text-slate-300/76">
              From simulation to collaboration. APRO Works packs professional-grade tools into a single desktop launcher.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[
              { img: blazingFast, title: 'Blazing Fast Calculation Engine', desc: 'Built in Rust for maximum performance. Complex simulations run in seconds, not minutes.' },
              { img: safeandreliable, title: 'Safe and Reliable', desc: 'Does not collect sensitive data without your permission. Your work stays yours.' },
              { img: crossCompatibility, title: 'Cross Compatibility', desc: 'Native support for Windows, Linux, and Mac. The same experience on any platform.' },
              { img: sharedCompute, title: 'Shared Compute Architecture', desc: 'Install on multiple systems and it will share the compute amongst them all.' },
              { img: realtimeCollab, title: 'Real-Time Collaboration Engine', desc: 'Multiple people can work on a single project simultaneously with live sync.' },
              { img: aiImplementation, title: 'AI Capabilities', desc: 'AI-powered automation for repetitive tasks so you can focus on design.' },
              { img: easytolearn, title: 'Easy to Learn', desc: 'Built for extreme beginners and total experts. All in one.' },
              { img: library, title: 'Built-in Library', desc: 'Store designs, commit changes, and track your design history, no more messy file names.', showNames: true },
              { img: community, title: 'Integrated with the Community', desc: 'Share your designs and projects with the community directly from the app.' },
            ].map((perk, i) => (
              <div
                key={i}
                className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-violet-500/20 hover:bg-white/[0.04] hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center transition-all duration-300 group-hover:border-violet-400/30 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.2),0_0_40px_rgba(139,92,246,0.1)]">
                      <img src={perk.img} alt={perk.title} className="w-8 h-8 md:w-9 md:h-9 object-contain transition-all duration-300 group-hover:scale-110 group-hover:brightness-110" style={{ filter: 'drop-shadow(0 0 0px transparent)', transition: 'filter 0.3s, transform 0.3s' }} />
                    </div>
                    {/* Glow aura */}
                    <div className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none" style={{ boxShadow: '0 0 30px 8px rgba(139,92,246,0.15)' }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm md:text-base font-semibold text-white leading-snug">{perk.title}</h3>
                    <p className="mt-1.5 text-xs md:text-sm leading-relaxed text-slate-400/90">{perk.desc}</p>
                    {'showNames' in perk && (
                      <div className="mt-2 space-y-0.5">
                        {['rocketDesign1', 'rocketDesign1Final', 'rocketDesign1FinalLast', 'rocketDesignFinalLastFinal', 'rocketDesignVeryLastFinal', 'rocketDesignFinalFinalFinal'].map((name) => (
                          <div key={name} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                            <span className="text-red-400/60 text-[10px]">✕</span>
                            <span className="line-through decoration-red-400/40">{name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-up {
          animation: scroll-up 40s linear infinite;
        }
        .animate-scroll-up:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default Home;

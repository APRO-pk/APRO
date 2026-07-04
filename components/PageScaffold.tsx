import React from "react";
import { Link } from "react-router-dom";

export const pageWidth = "mx-auto w-full max-w-[1880px] px-5 md:px-8 xl:px-12";

export const formInputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition duration-300 focus:border-violet-300/28 focus:bg-white/[0.06]";

export const formLabelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400";

export const helperTextClass = "text-sm text-slate-300/72";

export const statusMessageClass =
  "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-100";

type BaseProps = {
  children: React.ReactNode;
  className?: string;
};

type HeaderProps = BaseProps & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

type SplitProps = BaseProps & {
  left: React.ReactNode;
  right: React.ReactNode;
  className?: string;
};

type CalloutProps = {
  eyebrow?: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionTo?: string;
  actionHref?: string;
  accent?: "violet" | "blue" | "teal";
};

export const PageScaffold: React.FC<BaseProps> = ({ children, className = "" }) => (
  <div className={`relative pb-16 text-white ${className}`}>
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(123,44,191,0.16),transparent_18%),radial-gradient(circle_at_84%_14%,rgba(73,121,255,0.1),transparent_20%),linear-gradient(180deg,#060912_0%,#05070d_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.85) 0.55px, transparent 0.7px)",
          backgroundSize: "4px 4px",
        }}
      />
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

export const PageHero: React.FC<HeaderProps> = ({
  eyebrow = "APRO",
  title,
  description,
  actions,
  className = "",
}) => (
  <section className={`${pageWidth} pt-4 md:pt-6`}>
    <div className={`rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,18,34,0.92),rgba(8,10,18,0.98))] p-8 shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),0_24px_54px_rgba(4,7,16,0.26)] md:p-10 xl:p-14 ${className}`}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_auto] lg:items-end">
        <div>
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">{eyebrow}</div>
          <h1 className="mt-5 max-w-[14ch] text-[clamp(3.2rem,5.3vw,6.4rem)] font-bold leading-[0.92] tracking-[-0.065em] text-white">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 max-w-3xl text-[clamp(1rem,1.2vw,1.2rem)] leading-[1.9] text-slate-300/78">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-4">{actions}</div> : null}
      </div>
    </div>
  </section>
);

export const SectionBand: React.FC<BaseProps> = ({ children, className = "" }) => (
  <section className={`${pageWidth} mt-6`}>
    <div className={`rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,15,28,0.92),rgba(8,10,18,0.98))] p-8 shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),0_22px_48px_rgba(4,7,16,0.24)] md:p-10 ${className}`}>
      {children}
    </div>
  </section>
);

export const SplitBand: React.FC<SplitProps> = ({ left, right, className = "" }) => (
  <SectionBand className={className}>
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  </SectionBand>
);

export const SurfacePanel: React.FC<BaseProps> = ({ children, className = "" }) => (
  <div className={`rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,24,37,0.86),rgba(8,10,18,0.94))] p-6 shadow-[inset_1px_1px_0_rgba(255,255,255,0.04),0_20px_40px_rgba(4,7,16,0.2)] ${className}`}>
    {children}
  </div>
);

export const FormShell: React.FC<HeaderProps> = ({
  eyebrow = "Application",
  title,
  description,
  children,
}) => (
  <PageScaffold>
    <section className={`${pageWidth} flex min-h-[calc(100vh-10rem)] items-start justify-center pt-6`}>
      <div className="grid w-full max-w-[1500px] gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SurfacePanel className="h-fit bg-[linear-gradient(180deg,rgba(31,21,56,0.72),rgba(9,11,20,0.92))]">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">{eyebrow}</div>
          <h1 className="mt-4 text-[clamp(2.6rem,4vw,4.6rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
            {title}
          </h1>
          {description ? (
            <p className="mt-5 text-base leading-8 text-slate-300/76">{description}</p>
          ) : null}
        </SurfacePanel>

        <SurfacePanel className="p-8 md:p-10">{children}</SurfacePanel>
      </div>
    </section>
  </PageScaffold>
);

export const AuthShell: React.FC<HeaderProps> = ({
  eyebrow = "APRO Access",
  title,
  description,
  children,
}) => (
  <PageScaffold>
    <section className={`${pageWidth} flex min-h-[calc(100vh-10rem)] items-center justify-center pt-6`}>
      <div className="grid w-full max-w-[1320px] gap-6 lg:grid-cols-[0.95fr_0.75fr]">
        <SurfacePanel className="bg-[linear-gradient(180deg,rgba(28,20,51,0.78),rgba(8,10,18,0.94))] p-10">
          <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">{eyebrow}</div>
          <h1 className="mt-5 max-w-[12ch] text-[clamp(3rem,5vw,6rem)] font-bold leading-[0.9] tracking-[-0.065em] text-white">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 max-w-xl text-[clamp(1rem,1.2vw,1.2rem)] leading-[1.9] text-slate-300/78">
              {description}
            </p>
          ) : null}
        </SurfacePanel>
        <SurfacePanel className="p-8 md:p-10">{children}</SurfacePanel>
      </div>
    </section>
  </PageScaffold>
);

export const AdminShell: React.FC<HeaderProps> = ({
  eyebrow = "Admin",
  title,
  description,
  actions,
  children,
}) => (
  <PageScaffold>
    <section className={`${pageWidth} pt-6`}>
      <SurfacePanel className="p-8 md:p-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">{eyebrow}</div>
            <h1 className="mt-4 text-[clamp(2.8rem,4.6vw,5.4rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300/76">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        <div className="mt-8">{children}</div>
      </SurfacePanel>
    </section>
  </PageScaffold>
);

export const PrimaryButton: React.FC<{
  children: React.ReactNode;
  to?: string;
  href?: string;
  className?: string;
}> = ({ children, to, href, className = "" }) => {
  const base =
    "inline-flex items-center gap-2 rounded-full border border-violet-200/24 bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.26),inset_-2px_-2px_6px_rgba(54,19,108,0.58),0_18px_28px_rgba(61,28,120,0.28)] transition duration-300 hover:-translate-y-0.5";
  if (to) return <Link to={to} className={`${base} ${className}`}>{children}</Link>;
  if (href) return <a href={href} className={`${base} ${className}`}>{children}</a>;
  return <span className={`${base} ${className}`}>{children}</span>;
};

export const GhostButton: React.FC<{
  children: React.ReactNode;
  to?: string;
  href?: string;
  className?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
}> = ({ children, to, href, className = "", target, rel }) => {
  const base =
    "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-slate-100 transition duration-300 hover:border-white/18 hover:bg-white/[0.07]";
  if (to) return <Link to={to} className={`${base} ${className}`}>{children}</Link>;
  if (href) return <a href={href} target={target} rel={rel} className={`${base} ${className}`}>{children}</a>;
  return <span className={`${base} ${className}`}>{children}</span>;
};

export const CalloutBlock: React.FC<CalloutProps> = ({
  eyebrow = "APRO",
  title,
  body,
  actionLabel,
  actionTo,
  actionHref,
  accent = "violet",
}) => {
  const accentMap = {
    violet: "bg-[linear-gradient(180deg,rgba(31,21,56,0.72),rgba(9,11,20,0.92))] border-violet-300/12",
    blue: "bg-[linear-gradient(95deg,rgba(9,25,35,0.94),rgba(8,10,18,1))] border-cyan-300/10",
    teal: "bg-[linear-gradient(95deg,rgba(7,41,47,0.9),rgba(8,10,18,1))] border-cyan-300/10",
  } as const;

  return (
    <SurfacePanel className={`${accentMap[accent]} p-8 md:p-10`}>
      <div className="text-[11px] uppercase tracking-[0.34em] text-slate-400">{eyebrow}</div>
      <h2 className="mt-5 max-w-[14ch] text-[clamp(2.4rem,4vw,4.8rem)] font-bold leading-[0.92] tracking-[-0.06em] text-white">
        {title}
      </h2>
      <p className="mt-5 max-w-[34ch] text-base leading-8 text-slate-300/78">{body}</p>
      {actionLabel ? (
        <div className="mt-8">
          {actionTo ? <GhostButton to={actionTo}>{actionLabel}</GhostButton> : null}
          {actionHref ? <GhostButton href={actionHref}>{actionLabel}</GhostButton> : null}
        </div>
      ) : null}
    </SurfacePanel>
  );
};

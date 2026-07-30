import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Check, Flame, Rocket, Crown, User, Users, Building2, Briefcase, Loader2, Zap } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { PageScaffold, SectionBand, SurfacePanel, formInputClass, formLabelClass } from '../components/PageScaffold';
import { NumberTicker } from '../components/ui/number-ticker';
import { PricingCursor } from '../components/PricingCursor';
import { useCurrency } from '../src/context/CurrencyContext';
import { motion } from 'framer-motion';

function CalculateScreen({ selectedType, onDone }: { selectedType: string; onDone: () => void }) {
  const phrases: Record<string, string[]> = {
    individual: ['Crunching numbers...', 'Analyzing launch tiers...', 'Calculating best value...', 'Almost there...'],
    team: ['Calculating team discounts...', 'Applying group rates...', 'Optimizing seats...', 'Almost there...'],
    institute: ['Preparing academic pricing...', 'Calculating campus rates...', 'Almost there...'],
    industry: ['Calculating enterprise rates...', 'Applying volume discounts...', 'Almost there...'],
  };
  const steps = phrases[selectedType] || phrases.individual;
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (step >= steps.length) { onDone(); return; }
    const t = setTimeout(() => setStep(s => s + 1), 400);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 300);
    return () => clearInterval(interval);
  }, []);

  const done = step >= steps.length;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <Loader2 size={48} className={`text-violet-400 ${done ? 'opacity-0' : 'animate-spin'}`} />
          {done && <Zap size={48} className="text-emerald-400" />}
        </div>
        <div className="h-8 flex items-center">
          {step < steps.length ? (
            <motion.p key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-slate-400">
              {steps[step]}{dots}
            </motion.p>
          ) : (
            <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-sm font-bold text-emerald-400">
              Ready!
            </motion.p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function Pricing() {
  const [user, setUser] = useState<any>(null);
  const { currency, convert } = useCurrency();
  const [pricingStep, setPricingStep] = useState<'select' | 'calculating' | 'pricing'>('select');
  const [selectedType, setSelectedType] = useState<'individual' | 'team' | 'institute' | 'industry' | null>(null);
  const [billingType, setBillingType] = useState<'monthly' | 'annual'>('monthly');
  const [teamMembers, setTeamMembers] = useState(1);
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  return (
    <PageScaffold>
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

            {pricingStep === 'select' && (
              <>
                <div className="max-w-[900px] mx-auto mb-12">
                  <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-[0.2em] mb-6">Choose your type</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { type: 'individual', icon: <User size={28} />, label: 'Individual', desc: 'For hobbyists and solo builders' },
                      { type: 'team', icon: <Users size={28} />, label: 'Team', desc: 'For groups and clubs' },
                      { type: 'institute', icon: <Building2 size={28} />, label: 'Institute', desc: 'For universities and academies' },
                      { type: 'industry', icon: <Briefcase size={28} />, label: 'Industry', desc: 'For companies and professionals' },
                    ].map(t => (
                      <button key={t.type} onClick={() => { setSelectedType(t.type as any); setPricingStep('calculating'); }}
                        className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/5 hover:-translate-y-1"
                      >
                        <div className="text-slate-400 group-hover:text-violet-300 transition-colors">{t.icon}</div>
                        <div>
                          <div className="text-sm font-bold text-white text-center">{t.label}</div>
                          <div className="text-[10px] text-slate-500 text-center mt-0.5">{t.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <button onClick={() => { setSelectedType(null); setContactSent(false); setOrgName(''); setOrgEmail(''); }}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-4"
                  >
                    Back
                  </button>
                </div>
              </>
            )}

            {pricingStep === 'calculating' && (
              <CalculateScreen
                selectedType={selectedType!}
                onDone={() => setPricingStep('pricing')}
              />
            )}

            {pricingStep === 'pricing' && selectedType === 'individual' && (
              <>
                <div className="flex justify-center mb-10">
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
                    <button onClick={() => setBillingType('monthly')}
                      className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all ${billingType === 'monthly' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >Monthly</button>
                    <button onClick={() => setBillingType('annual')}
                      className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all ${billingType === 'annual' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      Annual
                      <span className="ml-1.5 text-[9px] text-emerald-400">-1mo</span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 max-w-[1400px] mx-auto px-4">
                  {[
                    { name: "Ignition", price: 0, icon: <Sparkles size={20} />, color: "from-slate-400/20", border: "border-white/8", textColor: "text-slate-300", features: ["R-Design", "120 Community Tokens / mo", "Feedback & Bug Reports", "Browse community channels", "Events (Viewing only)"] },
                    { name: "Thruster", price: 8.49, icon: <Flame size={20} />, color: "from-violet-500/20", border: "border-violet-500/30", textColor: "text-violet-200", popular: true, features: ["Everything in Ignition", "Burn & Geo Modeler, Propulsor, HexaDOF, RSD, RocketForge", "Unlimited community tokens", "Badges & Tags", "All Community Channel Features", "Event Participation", "Team Management & Weekly Challenges"] },
                    { name: "Afterburner", price: 14.99, icon: <Rocket size={20} />, color: "from-cyan-500/20", border: "border-cyan-500/30", textColor: "text-cyan-200", features: ["Everything in Thruster", "Industry applications (external)", "Priority Support", "All badges & tags", "Market access", "Event Hosting & Management"] },
                    { name: "Payload Max", price: 36.95, icon: <Crown size={20} />, color: "from-amber-500/20", border: "border-amber-500/30", textColor: "text-amber-200", features: ["Everything in Afterburner", "1-on-1 session booking (3 free/mo)", "Extra sessions $6.99 ea", "5% discount on all Market products"] },
                  ].map((tier, i) => {
                    const monthlyPrice = tier.price;
                    const effectivePrice = billingType === 'annual' ? (monthlyPrice * 11 / 12) : monthlyPrice;
                    const dp = effectivePrice > 0 ? convert(effectivePrice) : 0;
                    const whole = Math.floor(dp);
                    const dec = String(Math.round(dp % 1 * 100)).padStart(2, '0');
                    const annualTotal = monthlyPrice > 0 ? monthlyPrice * 11 : 0;
                    return (
                      <motion.div key={tier.name} data-pricing-card
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                        className={`relative flex flex-col rounded-2xl border bg-[linear-gradient(180deg,rgba(20,24,37,0.9),rgba(8,10,18,0.95))] p-6 md:p-8 shadow-[0_8px_32px_rgba(4,7,16,0.3)] ${tier.border} ${tier.popular ? "ring-1 ring-violet-500/40" : ""} cursor-none`}
                      >
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(123,44,191,0.4)]">Most Popular</div>
                        )}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tier.color} to-transparent ${tier.textColor}`}>{tier.icon}</div>
                          <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                        </div>
                        <div className="mb-6">
                          {effectivePrice > 0 ? (
                            <span className="text-[clamp(2.2rem,3.5vw,3rem)] font-extrabold tracking-tight text-white tabular-nums">
                              <span className="text-lg font-medium text-slate-400 align-top mr-0.5">{currency.symbol}</span>
                              <NumberTicker value={whole} decimalPlaces={0} className="text-inherit" />
                              <span className="text-[0.45em] font-medium text-slate-500 align-top">.{dec}</span>
                              <span className="ml-1 text-sm text-slate-500">/mo</span>
                            </span>
                          ) : (
                            <span className="text-[clamp(1.8rem,3vw,2.6rem)] font-bold text-slate-400">Free</span>
                          )}
                          {billingType === 'annual' && monthlyPrice > 0 && (
                            <div className="mt-1 text-[10px] text-emerald-400/80">{currency.symbol}{annualTotal.toFixed(2)} /yr &mdash; save {currency.symbol}{(monthlyPrice * 12 - annualTotal).toFixed(2)}</div>
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
                          className={`inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition duration-300 ${tier.popular ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(61,28,120,0.3)] hover:-translate-y-0.5" : "border border-white/10 text-slate-300 hover:border-white/20 hover:text-white"}`}
                        >
                          {user ? "Get Started" : "Log in"}
                          <ArrowRight size={16} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="text-center mt-10">
                  <button onClick={() => setPricingStep('select')}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-4"
                  >Change type</button>
                </div>
              </>
            )}

            {pricingStep === 'pricing' && selectedType === 'team' && (
              <>
                <div className="max-w-[400px] mx-auto mb-8">
                  <label className="block text-center text-sm font-semibold text-slate-300 mb-3">How many team members?</label>
                  <div className="flex items-center gap-3 justify-center">
                    <button onClick={() => setTeamMembers(Math.max(1, teamMembers - 1))}
                      className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] text-white text-lg font-bold hover:bg-white/[0.08] transition-colors">-</button>
                    <span className="w-16 text-center text-2xl font-bold text-white tabular-nums">{teamMembers}</span>
                    <button onClick={() => setTeamMembers(Math.min(100, teamMembers + 1))}
                      className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] text-white text-lg font-bold hover:bg-white/[0.08] transition-colors">+</button>
                  </div>
                  {teamMembers >= 5 && (
                    <p className="text-center text-[10px] text-emerald-400/70 mt-2">
                      Team discount applied: {Math.floor(teamMembers / 5)} free seat{Math.floor(teamMembers / 5) > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="flex justify-center mb-10">
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
                    <button onClick={() => setBillingType('monthly')}
                      className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all ${billingType === 'monthly' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >Monthly</button>
                    <button onClick={() => setBillingType('annual')}
                      className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all ${billingType === 'annual' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      Annual
                      <span className="ml-1.5 text-[9px] text-emerald-400">-1mo</span>
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 max-w-[1400px] mx-auto px-4">
                  {[
                    { name: "Ignition", price: 0, icon: <Sparkles size={20} />, color: "from-slate-400/20", border: "border-white/8", textColor: "text-slate-300", features: ["R-Design", "120 Community Tokens / mo", "Feedback & Bug Reports", "Browse community channels", "Events (Viewing only)"] },
                    { name: "Thruster", price: 8.49, icon: <Flame size={20} />, color: "from-violet-500/20", border: "border-violet-500/30", textColor: "text-violet-200", popular: true, features: ["Everything in Ignition", "Burn & Geo Modeler, Propulsor, HexaDOF, RSD, RocketForge", "Unlimited community tokens", "Badges & Tags", "All Community Channel Features", "Event Participation", "Team Management & Weekly Challenges"] },
                    { name: "Afterburner", price: 14.99, icon: <Rocket size={20} />, color: "from-cyan-500/20", border: "border-cyan-500/30", textColor: "text-cyan-200", features: ["Everything in Thruster", "Industry applications (external)", "Priority Support", "All badges & tags", "Market access", "Event Hosting & Management"] },
                    { name: "Payload Max", price: 36.95, icon: <Crown size={20} />, color: "from-amber-500/20", border: "border-amber-500/30", textColor: "text-amber-200", features: ["Everything in Afterburner", "1-on-1 session booking (3 free/mo)", "Extra sessions $6.99 ea", "5% discount on all Market products"] },
                  ].map((tier, i) => {
                    const paidSeats = Math.ceil(teamMembers * 4 / 5);
                    const monthlyPrice = tier.price;
                    const seatPrice = monthlyPrice > 0 ? (monthlyPrice * paidSeats / teamMembers) : 0;
                    const effectivePrice = billingType === 'annual' ? (seatPrice * 11 / 12) : seatPrice;
                    const dp = effectivePrice > 0 ? convert(effectivePrice) : 0;
                    const whole = Math.floor(dp);
                    const dec = String(Math.round(dp % 1 * 100)).padStart(2, '0');
                    return (
                      <motion.div key={tier.name} data-pricing-card
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                        className={`relative flex flex-col rounded-2xl border bg-[linear-gradient(180deg,rgba(20,24,37,0.9),rgba(8,10,18,0.95))] p-6 md:p-8 shadow-[0_8px_32px_rgba(4,7,16,0.3)] ${tier.border} ${tier.popular ? "ring-1 ring-violet-500/40" : ""} cursor-none`}
                      >
                        {tier.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_4px_12px_rgba(123,44,191,0.4)]">Most Popular</div>
                        )}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tier.color} to-transparent ${tier.textColor}`}>{tier.icon}</div>
                          <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                        </div>
                        <div className="mb-1 text-[10px] text-slate-500">{paidSeats} of {teamMembers} seats paid</div>
                        <div className="mb-6">
                          {effectivePrice > 0 ? (
                            <span className="text-[clamp(2.2rem,3.5vw,3rem)] font-extrabold tracking-tight text-white tabular-nums">
                              <span className="text-lg font-medium text-slate-400 align-top mr-0.5">{currency.symbol}</span>
                              <NumberTicker value={whole} decimalPlaces={0} className="text-inherit" />
                              <span className="text-[0.45em] font-medium text-slate-500 align-top">.{dec}</span>
                              <span className="ml-1 text-sm text-slate-500">/seat/mo</span>
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
                        <div className="text-[10px] text-slate-600 text-center mb-2">Total: {currency.symbol}{(effectivePrice * teamMembers).toFixed(2)}/mo</div>
                        <button
                          className={`inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-[0.12em] transition duration-300 ${tier.popular ? "bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.2),0_8px_20px_rgba(61,28,120,0.3)] hover:-translate-y-0.5" : "border border-white/10 text-slate-300 hover:border-white/20 hover:text-white"}`}
                        >
                          {user ? "Get Started" : "Log in"}
                          <ArrowRight size={16} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="text-center mt-10">
                  <button onClick={() => setPricingStep('select')}
                    className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-4"
                  >Change type</button>
                </div>
              </>
            )}

            {pricingStep === 'pricing' && (selectedType === 'institute' || selectedType === 'industry') && (
              <>
                {!contactSent ? (
                  <div className="max-w-[500px] mx-auto">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
                      <div className="text-4xl mb-4">{selectedType === 'institute' ? <Building2 size={40} className="mx-auto text-cyan-400" /> : <Briefcase size={40} className="mx-auto text-amber-400" />}</div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {selectedType === 'institute' ? 'Institute Plan' : 'Industry Plan'}
                      </h3>
                      <p className="text-sm text-slate-400 mb-6">
                        {selectedType === 'institute'
                          ? 'Get in touch for custom pricing and campus-wide access.'
                          : 'Contact us for enterprise-grade pricing and dedicated support.'}
                      </p>
                      <div className="space-y-4 text-left">
                        <div>
                          <label className={formLabelClass}>{selectedType === 'institute' ? 'Institute Name' : 'Company Name'}</label>
                          <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder={selectedType === 'institute' ? 'Institute name' : 'Company name'} className={formInputClass} />
                        </div>
                        <div>
                          <label className={formLabelClass}>Email Address</label>
                          <input type="email" value={orgEmail} onChange={e => setOrgEmail(e.target.value)} placeholder="email@example.com" className={formInputClass} />
                        </div>
                        <button onClick={() => { if (orgName.trim() && orgEmail.trim()) setContactSent(true); }}
                          disabled={!orgName.trim() || !orgEmail.trim()}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,#9879ff,#7b2cbf)] text-white py-3.5 text-sm font-bold uppercase tracking-[0.12em] shadow-[0_8px_20px_rgba(61,28,120,0.3)] hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Request Contact
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-center mt-6">
                      <button onClick={() => setPricingStep('select')}
                        className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-4"
                      >Change type</button>
                    </div>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-[500px] mx-auto text-center">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-8">
                      <div className="text-4xl mb-3">🎉</div>
                      <h3 className="text-xl font-bold text-white mb-2">Request received!</h3>
                      <p className="text-sm text-slate-400">
                        Someone from our team will contact you at <span className="text-emerald-400 font-semibold">{orgEmail}</span> shortly.
                      </p>
                    </div>
                    <button onClick={() => { setPricingStep('select'); setContactSent(false); setOrgName(''); setOrgEmail(''); }}
                      className="mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-4"
                    >Choose another type</button>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </SectionBand>
    </PageScaffold>
  );
}

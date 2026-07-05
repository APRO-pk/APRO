import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export function CurrencySelector() {
  const { currency, setCurrency, currencies, loading } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-slate-300 transition duration-300 hover:border-white/18 hover:bg-white/[0.08]"
      >
        <span>{currency.symbol}</span>
        <span className="uppercase">{currency.code}</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1120] shadow-xl"
          style={{ animation: 'dropdownFadeIn 0.15s ease-out' }}
        >
          {loading && (
            <div className="px-4 py-3 text-xs text-slate-400">Loading rates…</div>
          )}
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-white/[0.06] ${
                currency.code === c.code
                  ? 'text-white bg-white/[0.06]'
                  : 'text-slate-200'
              }`}
            >
              <span className="w-6 text-center text-xs">{c.symbol}</span>
              <span className="w-8 text-[11px] font-bold uppercase">{c.code}</span>
              <span className="text-slate-400 text-xs">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

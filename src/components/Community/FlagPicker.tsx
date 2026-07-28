import { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { searchFlags, OTHER_FLAGS } from '../../lib/flags';
import { FlagIcon } from './FlagIcon';

interface Props {
  value: string;
  onChange: (value: string) => void;
  defaultOpen?: boolean;
}

export function FlagPicker({ value, onChange, defaultOpen = false }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = searchFlags(query);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 mb-1.5">
        <button
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
            value
              ? 'border-cyan-500/50 bg-cyan-500/10 text-white'
              : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
          }`}
        >
          {value ? (
            <>
              <FlagIcon code={value} />
              <span>{value}</span>
              <X
                size={12}
                className="text-slate-500 hover:text-white cursor-pointer"
                onClick={(e) => { e.stopPropagation(); onChange(''); setQuery(''); }}
              />
            </>
          ) : (
            <span className="text-xs font-semibold">Select Flag</span>
          )}
        </button>
      </div>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-72 rounded-2xl border border-white/10 bg-[#0f1120]/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col"
          style={{ maxHeight: '320px' }}
        >
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 shrink-0">
            <Search size={14} className="text-slate-500 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search flags..."
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-0.5 rounded text-slate-500 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1 scroll-smooth overscroll-contain p-2">
            {/* Country flags */}
            {results.length > 0 && (
              <div className="grid grid-cols-6 gap-1">
                {results.map(f => (
                  <button
                    key={f.code}
                    onClick={() => { onChange(f.code); setOpen(false); setQuery(''); }}
                    className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all border ${
                      value === f.code
                        ? 'border-cyan-500/50 bg-cyan-500/10'
                        : 'border-transparent hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                    title={f.name}
                  >
                    <FlagIcon code={f.code} />
                    <span className="text-[8px] text-slate-500 truncate w-full text-center leading-tight">{f.code}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Other (emoji) flags */}
            <div className="mt-2 pt-2 border-t border-white/10">
              <p className="text-[10px] text-slate-500 mb-1.5 px-0.5">Symbols</p>
              <div className="flex flex-wrap gap-1">
                {OTHER_FLAGS.map(f => (
                  <button
                    key={f}
                    onClick={() => { onChange(f); setOpen(false); setQuery(''); }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all border ${
                      value === f ? 'border-cyan-500/50 bg-cyan-500/10 scale-110' : 'border-transparent hover:bg-white/[0.04] hover:border-white/10'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

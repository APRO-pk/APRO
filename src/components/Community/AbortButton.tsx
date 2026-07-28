import { useState } from 'react';

interface Props {
  count: number;
  userVote: number | null;
  onVote: (vote: 1 | -1) => void;
  vertical?: boolean;
  onAuthRequired?: () => void;
}

export function AbortButton({ count, userVote, onVote, vertical, onAuthRequired }: Props) {
  const [animating, setAnimating] = useState(false);
  const active = userVote === -1;

  const handleClick = () => {
    if (onAuthRequired) { onAuthRequired(); return; }
    setAnimating(true);
    onVote(-1);
    setTimeout(() => setAnimating(false), 300);
  };

  if (vertical) {
    return (
      <button
        onClick={handleClick}
        className={`group flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-all duration-200 ${
          active
            ? 'text-blue-400 bg-blue-500/10'
            : 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/5'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          className={`w-[18px] h-[18px] transition-transform duration-200 ${
            animating ? 'scale-110 translate-y-0.5' : ''
          } ${active ? '' : 'group-hover:scale-110'}`}
        >
          <path d="M4 10h16L12 22 4 10z" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="4" y1="2" x2="20" y2="2" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] leading-none font-semibold">{count}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`group flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'text-blue-400 bg-blue-500/10'
          : 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/5'
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        className={`w-4 h-4 transition-transform duration-200 ${
          animating ? 'scale-110 translate-y-0.5' : ''
        } ${active ? '' : 'group-hover:scale-110'}`}
      >
        <path d="M4 10h16L12 22 4 10z" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="4" y1="2" x2="20" y2="2" strokeLinecap="round" />
      </svg>
      <span>{count}</span>
    </button>
  );
}

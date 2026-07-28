import { useState } from 'react';
import { Repeat2 } from 'lucide-react';

interface Props {
  onRelaunch: () => void;
}

export function RelaunchButton({ onRelaunch }: Props) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    onRelaunch();
    setTimeout(() => setAnimating(false), 400);
  };

  return (
    <button
      onClick={handleClick}
      className={`group flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all duration-200 ${
        animating ? 'text-cyan-400' : ''
      }`}
    >
      <Repeat2
        size={14}
        className={`transition-all duration-300 ${
          animating ? 'rotate-180 scale-125' : 'group-hover:scale-110'
        }`}
      />
      <span className="text-xs">Relaunch</span>
    </button>
  );
}

import { useState } from 'react';
import { Radar } from 'lucide-react';

interface Props {
  isFollowing: boolean;
  onToggle: () => void;
}

export function TrackButton({ isFollowing, onToggle }: Props) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    onToggle();
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
        isFollowing
          ? 'bg-slate-700/50 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
          : 'bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30'
      } ${animating ? 'scale-95' : ''}`}
    >
      <Radar size={12} className={animating ? 'animate-spin' : ''} />
      <span>{isFollowing ? 'Tracking' : 'Track'}</span>
    </button>
  );
}

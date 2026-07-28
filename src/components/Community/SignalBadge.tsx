import { Bell } from 'lucide-react';

interface Props {
  unreadCount: number;
}

export function SignalBadge({ unreadCount }: Props) {
  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30 animate-pulse">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}

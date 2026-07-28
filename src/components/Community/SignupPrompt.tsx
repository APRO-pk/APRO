import { useNavigate } from 'react-router-dom';
import { Rocket, X, LogIn, UserPlus } from 'lucide-react';

interface Props {
  action: string | null;
  onClose: () => void;
}

const actionLabels: Record<string, string> = {
  ignite: 'ignite a launch',
  abort: 'abort a launch',
  comment: 'send telemetry',
  relaunch: 'relaunch a post',
  reply: 'reply to telemetry',
  commentVote: 'vote on telemetry',
  signals: 'view your signals',
};

export function SignupPrompt({ action, onClose }: Props) {
  const navigate = useNavigate();
  if (!action) return null;

  const label = actionLabels[action] || 'interact with the community';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#0f1120]/95 backdrop-blur-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-8 pb-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-4">
            <Rocket size={24} className="text-white" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Join the Mission</h2>
          <p className="text-sm text-slate-400 mb-1">
            You need an account to <span className="text-cyan-300 font-semibold">{label}</span>.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            Become part of the APRO community — it only takes a moment.
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-all duration-200 hover:scale-[1.02]"
            >
              <LogIn size={16} />
              Login
            </button>
            <button
              onClick={() => navigate('/login?signup=1')}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-5 py-3 text-sm font-semibold text-slate-200 transition-all duration-200 hover:scale-[1.02]"
            >
              <UserPlus size={16} />
              Create an Account
            </button>
          </div>

          <p className="mt-4 text-[11px] text-slate-600">
            Free to join. No commitment. Just pure propulsion.
          </p>
        </div>
      </div>
    </div>
  );
}

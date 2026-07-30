import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Crown, ArrowRight, X } from 'lucide-react';

const pillBase = 'rounded-2xl border border-white/10 bg-[#0f1120]/95 backdrop-blur-xl shadow-lg shadow-black/20';

export function InsufficientTokensModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-sm overflow-hidden p-6 ${pillBase}`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center">
            <Coins size={28} className="text-emerald-400" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">Not enough tokens</h3>
        <p className="text-sm text-slate-400 text-center leading-relaxed mb-6">
          You've run out of community tokens. Wait for your tokens to reset or upgrade to a higher tier for unlimited tokens.
        </p>
        <Link
          to="/pricing"
          onClick={onClose}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 py-3 text-sm font-bold text-white transition-all duration-200"
        >
          <Crown size={16} />
          View Plans
          <ArrowRight size={16} />
        </Link>
        <button
          onClick={onClose}
          className="w-full mt-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function UpgradeRequiredModal({ open, onClose, action }: { open: boolean; onClose: () => void; action: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-sm overflow-hidden p-6 ${pillBase}`}
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
            <Crown size={28} className="text-amber-400" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">Upgrade required</h3>
        <p className="text-sm text-slate-400 text-center leading-relaxed mb-6">
          {action} is not available on the Free plan. Upgrade to a paid tier to unlock this feature.
        </p>
        <Link
          to="/pricing"
          onClick={onClose}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 py-3 text-sm font-bold text-white transition-all duration-200"
        >
          <Crown size={16} />
          Upgrade Now
          <ArrowRight size={16} />
        </Link>
        <button
          onClick={onClose}
          className="w-full mt-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

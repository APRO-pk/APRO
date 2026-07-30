import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createCrew } from '../../lib/crew-api';
import { useTokens } from '../../lib/token-utils';
import { UpgradeRequiredModal } from './TokenModals';
import { FlagPicker } from './FlagPicker';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  onCreated: () => void;
}

export function CreateCrewModal({ open, onClose, userId, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [flag, setFlag] = useState('');
  const [creating, setCreating] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const { isFree } = useTokens(userId);

  if (!open) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (isFree) { setUpgradeModalOpen(true); return; }
    setCreating(true);
    try {
      await createCrew(name.trim(), description.trim(), flag, userId);
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create crew', err);
    } finally {
      setCreating(false);
    }
  };

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
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white">Propose a New Crew</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Crew Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="Enter crew name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              placeholder="What is your crew about?"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
            />
            <p className="text-[10px] text-slate-500 mt-1 text-right">{description.length}/500</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Flag</label>
            <FlagPicker value={flag} onChange={setFlag} />
          </div>
          <p className="text-[11px] text-slate-500">Your proposal will be reviewed by the admins before being accepted.</p>
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-sm font-bold text-white transition-all duration-200"
          >
            {creating ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Submit Proposal'}
          </button>
        </div>
      </div>
      <UpgradeRequiredModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} action="Creating a crew" />
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { updateProfile, uploadAvatar, isUsernameTaken } from '../../lib/community-api';
import { FlagPicker } from './FlagPicker';

const VALID_CHARS = /^[a-z0-9._-]+$/;

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  initialDisplayName: string;
  initialBio: string;
  initialAvatarUrl: string;
  initialFlag: string;
  onSaved: (displayName: string, bio: string, avatarUrl: string, flag: string) => void;
}

export function EditProfileModal({ open, onClose, userId, initialDisplayName, initialBio, initialAvatarUrl, initialFlag, onSaved }: Props) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [flag, setFlag] = useState(initialFlag);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameTaken, setNameTaken] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nameChanged = displayName !== initialDisplayName;

  useEffect(() => {
    if (!nameChanged || !displayName) {
      setNameTaken(false);
      setCheckingName(false);
      return;
    }
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    setCheckingName(true);
    checkTimerRef.current = setTimeout(async () => {
      try {
        const taken = await isUsernameTaken(displayName, userId);
        setNameTaken(taken);
      } catch {
        setNameTaken(false);
      } finally {
        setCheckingName(false);
      }
    }, 400);
    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, [displayName, nameChanged, userId]);

  if (!open) return null;

  const handleNameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    setDisplayName(cleaned);
    if (cleaned.length === 0) {
      setNameError('Username is required');
    } else if (cleaned.length < 3) {
      setNameError('Username must be at least 3 characters');
    } else if (!VALID_CHARS.test(cleaned)) {
      setNameError('Only lowercase letters, _, -, and . allowed');
    } else {
      setNameError(null);
    }
  };

  const handleSave = async () => {
    if (nameError || nameTaken || !displayName) return;
    setSaving(true);
    try {
      await updateProfile(userId, { display_name: displayName, bio: bio.trim(), avatar_url: avatarUrl, flag: flag || undefined });
      onSaved(displayName, bio.trim(), avatarUrl, flag);
      onClose();
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(userId, file);
      setAvatarUrl(url);
    } catch (err) {
      console.error('Failed to upload avatar', err);
    } finally {
      setUploading(false);
    }
  };

  const canSave = !nameError && !nameTaken && !checkingName && displayName.length >= 3;

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
          <h3 className="text-sm font-bold text-white">Edit Profile</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (displayName[0] || '?').toUpperCase()
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 flex items-center justify-center text-white shadow-lg transition-colors"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>
            <input
              value={displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={20}
              placeholder="your_username"
              className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ${
                nameError || nameTaken ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-cyan-500/50'
              }`}
            />
            {nameError && (
              <p className="text-[11px] text-red-400 mt-1">{nameError}</p>
            )}
            {nameTaken && !nameError && (
              <p className="text-[11px] text-red-400 mt-1">Username already taken</p>
            )}
            {checkingName && (
              <p className="text-[11px] text-slate-500 mt-1">Checking availability...</p>
            )}
            {!nameError && !nameTaken && !checkingName && nameChanged && (
              <p className="text-[11px] text-emerald-400 mt-1">Username available</p>
            )}
            <p className="text-[10px] text-slate-500 mt-1">3-20 chars: lowercase letters, numbers, _, -, and .</p>
          </div>

          {/* Flag */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Flag</label>
            <FlagPicker value={flag} onChange={setFlag} />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
              placeholder="Tell us about yourself..."
            />
            <p className="text-[10px] text-slate-500 mt-1 text-right">{bio.length}/200</p>
          </div>
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving || uploading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-sm font-bold text-white transition-all duration-200"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

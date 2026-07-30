import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../src/lib/supabase';
import { fetchProfile, getProfileAvatar, getDisplayName, updateProfile, uploadAvatar } from '../src/lib/community-api';
import { useTokens } from '../src/lib/token-utils';
import { InsufficientTokensModal } from '../src/components/Community/TokenModals';
import { PageScaffold } from '../components/PageScaffold';
import { Crown, Coins, Shield, ChevronRight, Camera, Pencil, Check, X, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [avatar, setAvatar] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameTaken, setNameTaken] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const { isFree, canAfford, deduct, tokens, resetAt, membershipClass } = useTokens(uid);

  useEffect(() => {
    const load = async () => {
      const session = await supabase.auth.getSession();
      const id = session.data.session?.user?.id;
      if (!id) { setLoading(false); return; }
      setUid(id);

      const p = await fetchProfile(id);
      setProfile(p);

      const [name, av] = await Promise.all([
        getDisplayName(id),
        getProfileAvatar(id),
      ]);
      setDisplayName(name);
      setAvatar(av);
      setBio(p?.bio || '');
      setEditName(name);
      setEditBio(p?.bio || '');

      setLoading(false);
    };
    load();
  }, []);

  // Username availability debounce
  useEffect(() => {
    if (!editing) return;
    const u = editName;
    if (u === displayName) { setNameTaken(false); setCheckingName(false); return; }
    if (u.length < 3 || nameError) { setNameTaken(false); setCheckingName(false); return; }
    if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    setCheckingName(true);
    checkTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await supabase.from('community_profiles').select('id').eq('display_name', u).maybeSingle();
        setNameTaken(!!data);
      } catch { setNameTaken(false); }
      setCheckingName(false);
    }, 400);
    return () => { if (checkTimerRef.current) clearTimeout(checkTimerRef.current); };
  }, [editName, nameError, editing, displayName]);

  const handleNameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 20);
    setEditName(cleaned);
    if (!cleaned) setNameError('Username is required');
    else if (cleaned.length < 3) setNameError('Must be at least 3 characters');
    else setNameError(null);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    if (isFree && !canAfford(1)) { setInsufficientModalOpen(true); return; }
    setUploading(true);
    try {
      const url = await uploadAvatar(uid, file);
      setAvatar(url);
      updateProfile(uid, { avatar_url: url });
      if (isFree) await deduct(1);
    } catch (err) {
      console.error('Failed to upload avatar', err);
    } finally {
      setUploading(false);
    }
  };

  const startEditing = () => {
    setEditName(displayName);
    setEditBio(bio);
    setNameError(null);
    setNameTaken(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setNameError(null);
    setNameTaken(false);
  };

  const saveEditing = async () => {
    if (!uid || nameError || nameTaken || editName.length < 3) return;
    const nameChanged = editName !== displayName;
    const bioChanged = editBio.trim() !== bio;
    const tokenCost = (nameChanged ? 1 : 0) + (bioChanged ? 1 : 0);
    if (isFree && tokenCost > 0 && !canAfford(tokenCost)) { setInsufficientModalOpen(true); return; }
    setSaving(true);
    try {
      await updateProfile(uid, { display_name: editName, bio: editBio.trim() });
      if (isFree && tokenCost > 0) await deduct(tokenCost);
      setDisplayName(editName);
      setBio(editBio.trim());
      setEditing(false);
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setSaving(false);
    }
  };

  const maxTokens = membershipClass === 'Free' ? 120 : 120;
  const progress = Math.min((tokens ?? 0) / maxTokens, 1);
  const daysUntilReset = resetAt
    ? Math.max(0, Math.ceil((new Date(resetAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const progressDays = Math.min(daysUntilReset / 30, 1);

  if (loading) {
    return (
      <PageScaffold title="Dashboard">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageScaffold>
    );
  }

  const canSave = !nameError && !nameTaken && !checkingName && editName.length >= 3;

  return (
    <PageScaffold title="Dashboard">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Profile Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-6 mb-4">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600/30 to-blue-600/30 flex items-center justify-center text-2xl font-bold text-cyan-200 border-2 border-white/10 overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (displayName[0]?.toUpperCase() ?? '?')
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 flex items-center justify-center text-white shadow-lg border border-white/20 transition-all duration-200"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name + Bio */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Username</label>
                    <input
                      value={editName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      maxLength={20}
                      placeholder="your_username"
                      className={`w-full bg-white/5 border rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ${
                        nameError || nameTaken ? 'border-red-500/50 focus:border-red-400' : 'border-white/10 focus:border-cyan-500/50'
                      }`}
                    />
                    {nameError && <p className="text-[11px] text-red-400 mt-1">{nameError}</p>}
                    {nameTaken && !nameError && <p className="text-[11px] text-red-400 mt-1">Username already taken</p>}
                    {checkingName && <p className="text-[11px] text-slate-500 mt-1">Checking availability...</p>}
                    {!nameError && !nameTaken && !checkingName && editName !== displayName && editName.length >= 3 && (
                      <p className="text-[11px] text-emerald-400 mt-1">Username available</p>
                    )}
                    <p className="text-[10px] text-slate-500 mt-0.5">3-20 chars: lowercase letters, numbers, _, -, and .</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value.slice(0, 200))}
                      maxLength={200}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                      placeholder="Tell us about yourself..."
                    />
                    <p className="text-[10px] text-slate-500 mt-1 text-right">{editBio.length}/200</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={cancelEditing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                    <button
                      onClick={saveEditing}
                      disabled={!canSave || saving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-sm font-bold text-white transition-all duration-200"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
                    <button
                      onClick={startEditing}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all shrink-0"
                      title="Edit profile"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                  {bio && <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{bio}</p>}
                  {!bio && <p className="text-sm text-slate-500 mt-1.5 italic">No bio yet</p>}
                  <p className="text-xs text-slate-500 mt-2 font-mono">{profile?.id?.slice(0, 8)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Membership Class Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-5 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                <Crown size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Membership Class</p>
                <p className="text-lg font-bold text-white">{membershipClass}</p>
              </div>
            </div>
            <Link to="/pricing" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/20 text-cyan-300 text-sm font-semibold hover:bg-cyan-600/30 transition-all">
              Upgrade
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Community Tokens Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20 flex items-center justify-center">
              <Coins size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Community Tokens</p>
              <p className="text-2xl font-bold text-white">{tokens ?? 0} / {maxTokens}</p>
            </div>
          </div>
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (tokens ?? 0) >= 72 ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' :
                (tokens ?? 0) >= 36 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                'bg-gradient-to-r from-red-500 to-rose-500'
              }`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Reset Timer Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
              <Shield size={20} className="text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tokens Reset In</p>
              <p className="text-lg font-bold text-white">{daysUntilReset} days</p>
            </div>
          </div>
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${progressDays * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Resets on {resetAt ? new Date(resetAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '...'}
          </p>
        </div>
      </div>
      <InsufficientTokensModal open={insufficientModalOpen} onClose={() => setInsufficientModalOpen(false)} />
    </PageScaffold>
  );
}

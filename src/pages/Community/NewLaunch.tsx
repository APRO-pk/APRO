import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Image, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createLaunch } from '../../lib/community-api';
import { useTokens } from '../../lib/token-utils';
import { InsufficientTokensModal } from '../../components/Community/TokenModals';
import { CommunityNavbar } from '../../components/Community/CommunityNavbar';

const NewLaunch: React.FC = () => {
  const navigate = useNavigate();

  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false);
  const { deduct, isFree, canAfford } = useTokens(user?.id ?? null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        navigate('/login', { replace: true });
        return;
      }
      setUser(data.session.user);
    });
  }, [navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setUploadError(null);
    const ext = file.name.split('.').pop();
    const path = `community/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('community_images').upload(path, file);
    if (error) {
      setUploadError(error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('community_images').getPublicUrl(path);
    setImages((prev) => [...prev, urlData.publicUrl]);
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;
    if (!user) return;
    const postTokenCost = 2 + images.length * 5;
    if (isFree && !canAfford(postTokenCost)) { setInsufficientModalOpen(true); return; }
    setSubmitting(true);
    try {
      await createLaunch(user.id, content.trim(), images);
      if (isFree) await deduct(postTokenCost);
      navigate('/community');
    } catch (err) {
      setSubmitError('Failed to launch. Check console for details.');
      console.error('Launch failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d]">
      <CommunityNavbar />

      <div className="max-w-xl mx-auto px-4 pt-4 pb-20 lg:pb-8">
        <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Launch Content
            </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind, rocketeer?"
                rows={6}
                maxLength={1000}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none transition-colors"
              />
              <div className="text-right text-[10px] text-slate-500">{content.length}/1000</div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Images
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt="" className="w-24 h-24 object-cover rounded-xl" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500/40 transition-colors">
                  <Image size={20} className="text-slate-500" />
                  <span className="text-[10px] text-slate-500 mt-1">
                    {uploading ? '...' : 'Add'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            {uploadError && (
              <p className="text-xs text-red-400 mt-1">{uploadError}</p>
            )}
          </div>

          {submitError && (
            <p className="text-sm text-red-400">{submitError}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || (!content.trim() && images.length === 0)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-cyan-600/20"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Rocket size={16} />
              )}
              {submitting ? 'Launching...' : 'Launch'}
            </button>
            <button
              onClick={() => navigate('/community')}
              className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            {isFree && (
              <span className="ml-auto text-[11px] text-slate-500">
                Cost: {2 + images.length * 5} tokens
              </span>
            )}
          </div>
        </div>
      </div>
      <InsufficientTokensModal open={insufficientModalOpen} onClose={() => setInsufficientModalOpen(false)} />
    </div>
  );
};

export default NewLaunch;

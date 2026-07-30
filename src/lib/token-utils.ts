import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

interface TokensState {
  tokens: number | null;
  resetAt: string | null;
  membershipClass: string;
  loading: boolean;
}

export function useTokens(userId: string | null) {
  const [state, setState] = useState<TokensState>({
    tokens: null,
    resetAt: null,
    membershipClass: 'Free',
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: rows } = await supabase.rpc('refresh_community_tokens', { uid: userId });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (row) {
        setState({
          tokens: row.community_tokens,
          resetAt: row.tokens_reset_at || null,
          membershipClass: row.membership_class || 'Free',
          loading: false,
        });
        return;
      }
    } catch {}
    try {
      const { data: direct } = await supabase
        .from('community_profiles')
        .select('community_tokens, tokens_reset_at, membership_class')
        .eq('id', userId)
        .maybeSingle();
      if (direct) {
        setState({
          tokens: direct.community_tokens ?? null,
          resetAt: direct.tokens_reset_at || null,
          membershipClass: direct.membership_class || 'Free',
          loading: false,
        });
      }
    } catch {}
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const isFree = state.membershipClass === 'Free';

  const deduct = useCallback(async (amount: number): Promise<boolean> => {
    if (!userId) return false;
    try {
      const { data: rows } = await supabase.rpc('deduct_community_tokens', { uid: userId, amount });
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (row?.success) {
        setState(s => ({ ...s, tokens: row.remaining_tokens }));
        window.dispatchEvent(new CustomEvent('tokens-updated'));
        return true;
      }
      if (row && !row.success) {
        setState(s => ({ ...s, tokens: row.remaining_tokens }));
        window.dispatchEvent(new CustomEvent('tokens-updated'));
      }
    } catch (e) {
      console.error('Token deduction failed:', e);
    }
    return false;
  }, [userId]);

  useEffect(() => {
    const onTokensUpdated = () => refresh();
    window.addEventListener('tokens-updated', onTokensUpdated);
    return () => window.removeEventListener('tokens-updated', onTokensUpdated);
  }, [refresh]);

  const canAfford = useCallback((amount: number): boolean => {
    if (!isFree) return true;
    if (state.tokens === null) return false;
    return state.tokens >= amount;
  }, [isFree, state.tokens]);

  return { ...state, isFree, deduct, canAfford, refresh };
}

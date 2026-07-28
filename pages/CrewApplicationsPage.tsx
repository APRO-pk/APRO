import React, { useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { AdminShell } from '../components/PageScaffold';
import type { Crew } from '../src/lib/crew-types';
import { getDisplayName, getProfileFlag, hydrateProfiles } from '../src/lib/community-api';
import { FlagIcon } from '../src/components/Community/FlagIcon';

type TabStatus = 'ALL' | 'PROPOSED' | 'ACTIVE' | 'REJECTED';

const CrewApplicationsPage: React.FC = () => {
  const [crews, setCrews] = useState<(Crew & { prime_name?: string; prime_flag?: string })[]>([]);
  const [activeTab, setActiveTab] = useState<TabStatus>('PROPOSED');
  const [loading, setLoading] = useState(true);

  const fetchCrews = async () => {
    setLoading(true);
    try {
      let query = supabase.from('crews').select('*').order('created_at', { ascending: false });
      if (activeTab !== 'ALL') query = query.eq('status', activeTab.toLowerCase());
      const { data, error } = await query;
      if (error) throw error;
      const list = (data || []) as Crew[];
      await hydrateProfiles(list.map(c => c.prime_id));
      const withNames = await Promise.all(
        list.map(async (c) => ({ ...c, prime_name: await getDisplayName(c.prime_id), prime_flag: getProfileFlag(c.prime_id) }))
      );
      setCrews(withNames);
    } catch (err) {
      console.error('Failed to fetch crews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCrews(); }, [activeTab]);

  const updateStatus = async (crewId: string, status: 'active' | 'rejected') => {
    await supabase.from('crews').update({ status }).eq('id', crewId);
    setCrews(prev => prev.map(c => c.id === crewId ? { ...c, status } : c));
  };

  const tabs: { key: TabStatus; label: string }[] = [
    { key: 'PROPOSED', label: 'Proposed' },
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  const countByStatus = (status: string) => crews.filter(c => c.status === status).length;

  return (
    <AdminShell
      eyebrow="Admin"
      title="Crew Applications"
      description="Review and manage crew proposals from the community."
      actions={<></>}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => {
          const count = tab.key === 'ALL' ? crews.length : countByStatus(tab.key.toLowerCase());
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-4 text-slate-200">
          Loading...
        </div>
      ) : crews.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-6 py-8 text-center text-slate-400">
          No crew applications found.
        </div>
      ) : (
        <div className="space-y-3">
          {crews.map(crew => (
            <div key={crew.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1">{crew.flag && <FlagIcon code={crew.flag} />}{crew.name}</h3>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      crew.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                      crew.status === 'rejected' ? 'bg-red-500/20 text-red-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {crew.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{crew.description || 'No description'}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>Level {crew.level}</span>
                    <span className="inline-flex items-center gap-0.5">By {crew.prime_flag && <FlagIcon code={crew.prime_flag} />}{crew.prime_name || crew.prime_id.slice(0, 8)}</span>
                    <span>{new Date(crew.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {crew.status === 'proposed' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => updateStatus(crew.id, 'active')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/30 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(crew.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-xs font-semibold hover:bg-red-600/30 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
};

export default CrewApplicationsPage;

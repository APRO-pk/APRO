import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Globe, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function CommunityNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) setUserId(data.session.user.id);
    });
  }, []);

  const handleNav = (path: string | null, isProfile?: boolean) => {
    if (isProfile && userId) navigate(`/community/user/${userId}`);
    else if (path) navigate(path);
  };

  const isActive = (path: string | null, exact?: boolean, isProfile?: boolean) => {
    if (exact) return location.pathname === '/community' || location.pathname === '/community/launchpad';
    if (isProfile) return location.pathname.startsWith('/community/user/');
    if (!path) return false;
    return location.pathname === path;
  };

  const items = [
    { path: '/community/missions', icon: Globe, label: 'Missions' },
    { path: '/community', icon: Home, label: 'Home', exact: true },
    { path: '/community/crew', icon: Users, label: 'Crew' },
    { path: null, icon: User, label: 'Profile', isProfile: true },
  ];

  return (
    <>
      {/* Desktop: sticky top bar */}
      <div className="hidden lg:flex sticky top-24 z-40 justify-center px-3 py-2">
        <div className="inline-flex items-center gap-0.5 rounded-2xl border border-white/10 bg-[#0f1120]/90 backdrop-blur-xl px-1.5 py-1 shadow-lg shadow-black/20">
          {items.map((item) => {
            const active = isActive(item.path, item.exact, item.isProfile);
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path, item.isProfile)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600/25 to-blue-600/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
                )}
                <item.icon size={15} className="relative" />
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: fixed bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3 pb-3 pt-1">
        <div className="w-full max-w-md flex items-center justify-around rounded-2xl border border-white/10 bg-[#0f1120]/95 backdrop-blur-xl px-2 py-2 shadow-lg shadow-black/30">
          {items.map((item) => {
            const active = isActive(item.path, item.exact, item.isProfile);
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.path, item.isProfile)}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                  active
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20" />
                )}
                <item.icon size={20} className="relative" />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

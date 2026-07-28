import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ArrowUp, ArrowDown, MessageCircle, Repeat2, Radar, CheckCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchNotifications, markSignalsRead, getDisplayName, getProfileFlag, hydrateProfiles } from '../../lib/community-api';
import { FlagIcon } from '../../components/Community/FlagIcon';
import { CommunityNavbar } from '../../components/Community/CommunityNavbar';
import type { CommunityNotification } from '../../lib/community-types';

const signalIcons: Record<string, React.ReactNode> = {
  ignite: <ArrowUp size={14} className="text-orange-400" />,
  abort: <ArrowDown size={14} className="text-blue-400" />,
  telemetry: <MessageCircle size={14} className="text-cyan-400" />,
  reply: <MessageCircle size={14} className="text-sky-400" />,
  relaunch: <Repeat2 size={14} className="text-cyan-400" />,
  track: <Radar size={14} className="text-violet-400" />,
};

const signalLabels: Record<string, string> = {
  ignite: 'ignited your launch',
  abort: 'aborted your launch',
  telemetry: 'sent telemetry on your launch',
  reply: 'replied to your telemetry',
  relaunch: 'relaunched your post',
  track: 'started tracking you',
};

const Signals: React.FC = () => {
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [userId, setUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const session = await supabase.auth.getSession();
      const uid = session.data.session?.user?.id;
      if (!uid) return;
      setUserId(uid);

      const data = await fetchNotifications(uid);
      setNotifications(data);
      setLoading(false);
    };
    init();
  }, []);

  const handleMarkRead = async () => {
    if (!userId) return;
    await markSignalsRead(userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#05070d]">
      <CommunityNavbar />

      <div className="max-w-xl mx-auto px-4 pb-20 lg:pb-8">
        <div className="rounded-2xl border border-white/10 bg-[#0f1120]/80 backdrop-blur-sm p-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-rose-400" />
              <h2 className="text-lg font-bold text-white">
                Signals
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs font-normal text-rose-400">
                    ({unreadCount} new)
                  </span>
                )}
              </h2>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={36} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-500 text-sm">No signals yet.</p>
              <p className="text-slate-600 text-xs mt-1">
                Interact with the community to receive signals.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => (
                <SignalRow key={n.id} notification={n} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function SignalRow({ notification }: { notification: CommunityNotification }) {
  const [actorName, setActorName] = useState('');
  const [actorFlag, setActorFlag] = useState('');
  useEffect(() => {
    hydrateProfiles([notification.actor_id]).then(() => {
      getDisplayName(notification.actor_id).then(setActorName);
      setActorFlag(getProfileFlag(notification.actor_id));
    });
  }, [notification.actor_id]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-colors ${
        notification.read ? 'opacity-50' : 'bg-white/[0.03]'
      }`}
    >
      <div className="mt-0.5">{signalIcons[notification.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">
          <span className="font-semibold text-white inline-flex items-center gap-0.5">
            {actorFlag && <FlagIcon code={actorFlag} />}
            {actorName || notification.actor_id.slice(0, 8)}
          </span>{' '}
          {signalLabels[notification.type]}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {new Date(notification.created_at).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      {notification.post_id && (
        <Link
          to={`/community/post/${notification.post_id}`}
          className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] text-cyan-400 hover:bg-cyan-500/10 transition-colors"
        >
          View
        </Link>
      )}
    </div>
  );
}

export default Signals;

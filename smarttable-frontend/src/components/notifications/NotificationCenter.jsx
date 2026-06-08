import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatNotificationTime, getNotificationConfig } from '../../lib/notificationUtils';
import Button from '../ui/Button';

export default function NotificationCenter({
  open,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkRead,
  onMarkAllRead,
  onDelete,
}) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleClick = (notification) => {
    if (notification.is_unread) {
      onMarkRead(notification.id);
    }
    if (notification.data?.link) {
      navigate(notification.data.link);
      onClose();
    }
  };

  return (
    <>
      <button type="button" className="fixed inset-0 z-[140] bg-slate-900/20 backdrop-blur-[1px] dark:bg-black/30" onClick={onClose} aria-label="Fermer" />
      <div className="fixed right-4 top-[4.5rem] z-[150] w-[min(100vw-2rem,24rem)] animate-scale-in overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card-hover dark:border-zinc-700 dark:bg-zinc-900 sm:right-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button type="button" onClick={onMarkAllRead} className="btn-icon !p-2" title="Tout marquer comme lu">
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-icon !p-2" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[min(28rem,60vh)] overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton-shine h-16 rounded-xl" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-zinc-600" />
              <p className="text-sm text-slate-500 dark:text-zinc-500">Aucune notification</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {notifications.map((n) => {
                const cfg = getNotificationConfig(n.type);
                const Icon = cfg.icon;
                return (
                  <li key={n.id}>
                    <div
                      className={`group flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50 ${
                        n.is_unread ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''
                      }`}
                    >
                      <button type="button" onClick={() => handleClick(n)} className="flex min-w-0 flex-1 gap-3 text-left">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                            {n.is_unread && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-zinc-400">{n.message}</p>
                          <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500">{formatNotificationTime(n.created_at)}</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(n.id)}
                        className="btn-icon !p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {notifications.length > 0 && unreadCount > 0 && (
          <div className="border-t border-slate-200/80 p-3 dark:border-zinc-800">
            <Button variant="secondary" className="w-full" size="sm" onClick={onMarkAllRead}>
              Tout marquer comme lu
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

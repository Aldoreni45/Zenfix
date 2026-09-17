'use client';

import { useState, useCallback, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, FileText, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function iconForType(type: string) {
  if (type.startsWith('task_rejected') || type.startsWith('task_overdue')) return AlertCircle;
  if (type.startsWith('task_assigned') || type.startsWith('task_updated') || type.startsWith('task_completed')) return FileText;
  if (type.startsWith('video_')) return Clock;
  return Bell;
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await api.get<any>(
      filter === 'unread' ? apiEndpoints.unreadNotifications : apiEndpoints.notifications
    );
    if (res.error) {
      setLoadError(extractApiErrorMessage(res));
    } else if (res.data) {
      setNotifications(res.data.results || res.data || []);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const displayed = notifications.filter((n: any) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAsRead = async (id: number) => {
    setBusyId(id);
    const res = await api.post(apiEndpoints.markRead(id), {});
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
    setBusyId(null);
  };

  const markAllAsRead = async () => {
    const res = await api.post(apiEndpoints.markAllRead, {});
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    }
  };

  const deleteNotification = async (id: number) => {
    setBusyId(id);
    const res = await api.delete(apiEndpoints.notification(id));
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/50 border border-white/10 rounded-lg p-1">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  filter === f
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-slate-400 hover:text-white"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">Failed to load notifications.</p>
          <Button variant="outline" size="sm" onClick={fetchNotifications} className="border-red-500/30 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      )}

      {/* Notifications List */}
      {!loading && !loadError && (
        <div className="space-y-3">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-900/50 border border-white/10 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
              <p className="text-slate-400 text-sm">
                {filter === 'unread'
                  ? 'You have no unread notifications'
                  : 'Your notification list is empty'}
              </p>
            </div>
          ) : (
            displayed.map((n: any) => {
              const Icon = iconForType(n.type);
              const unread = !n.read;
              return (
                <div
                  key={n.id}
                  className={cn(
                    'group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:bg-white/5',
                    unread ? 'bg-slate-900/50 border-cyan-500/20' : 'bg-slate-900/30 border-white/5'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center border shrink-0',
                      unread
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn('font-medium', unread ? 'text-white' : 'text-slate-300')}>
                            {n.title}
                          </h3>
                          {n.priority === 'urgent' && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{n.message}</p>
                        <p className="text-xs text-slate-500 mt-2">{timeAgo(n.created_at)}</p>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {unread && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            disabled={busyId === n.id}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            {busyId === n.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                              <Check className="h-4 w-4 text-slate-400 hover:text-white" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          disabled={busyId === n.id}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
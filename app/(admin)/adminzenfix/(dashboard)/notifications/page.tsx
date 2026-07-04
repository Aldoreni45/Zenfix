'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Bell, Check, CheckCheck, Trash2, Filter, MoreHorizontal, Clock, User, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  sender?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }
  }, [status]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (status === 'authenticated') {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (filter === 'unread') params.append('unreadOnly', 'true');
          
          const response = await fetch(`/api/notifications?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setNotifications(data.notifications || []);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
          toast.error('Failed to fetch notifications');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchNotifications();
  }, [status, filter]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, action: 'markAsRead' }),
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n._id === id ? { ...n, read: true } : n
        ));
        toast.success('Notification marked as read');
      }
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, action: 'delete' }),
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n._id !== id));
        toast.success('Notification deleted');
      }
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'task': return FileText;
      case 'success': return Check;
      case 'warning': return Clock;
      case 'mention': return User;
      case 'error': return AlertCircle;
      case 'info': return User;
      default: return Bell;
    }
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

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const Icon = getIconForType(notification.type);
          const iconColor = {
            task: 'text-cyan-400',
            success: 'text-green-400',
            warning: 'text-yellow-400',
            mention: 'text-purple-400',
            error: 'text-red-400',
            info: 'text-blue-400',
          }[notification.type] || 'text-slate-400';

          const bgColor = {
            task: 'bg-cyan-500/10 border-cyan-500/20',
            success: 'bg-green-500/10 border-green-500/20',
            warning: 'bg-yellow-500/10 border-yellow-500/20',
            mention: 'bg-purple-500/10 border-purple-500/20',
            error: 'bg-red-500/10 border-red-500/20',
            info: 'bg-blue-500/10 border-blue-500/20',
          }[notification.type] || 'bg-slate-500/10 border-slate-500/20';

          return (
            <div
              key={notification._id}
              className={cn(
                'group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 hover:bg-white/5',
                notification.read
                  ? 'bg-slate-900/30 border-white/5'
                  : 'bg-slate-900/50 border-cyan-500/20'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center border',
                  bgColor
                )}
              >
                <Icon className={cn('h-5 w-5', iconColor)} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className={cn('font-medium', notification.read ? 'text-slate-300' : 'text-white')}>
                      {notification.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-2">{formatTimestamp(notification.createdAt)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4 text-slate-400 hover:text-white" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreHorizontal className="h-4 w-4 text-slate-400 hover:text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-900/50 border border-white/10 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No notifications</h3>
            <p className="text-slate-400 text-sm">
              {filter === 'unread' ? 'You have no unread notifications' : 'Your notification list is empty'}
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <p className="text-sm text-slate-500">
          Showing {filteredNotifications.length} of {notifications.length} notifications
        </p>
        <Button variant="outline" size="sm" className="border-white/10 text-slate-400 hover:text-white">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
      </div>
    </div>
  );
}

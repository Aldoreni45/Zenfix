'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Filter, Activity, Clock, User, FileText, Settings, LogOut, Shield, CheckCircle, XCircle } from 'lucide-react';

interface ActivityLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  timestamp: string;
}

const actionIcons: Record<string, any> = {
  login: LogOut,
  logout: LogOut,
  password_change: Settings,
  task_created: FileText,
  task_assigned: CheckCircle,
  task_updated: FileText,
  task_completed: CheckCircle,
  task_rejected: XCircle,
  task_deleted: XCircle,
  user_created: User,
  user_updated: User,
  user_deleted: XCircle,
  role_changed: Shield,
};

const actionColors: Record<string, string> = {
  login: 'bg-green-500/20 text-green-400 border-green-500/30',
  logout: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  password_change: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  task_created: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  task_assigned: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  task_updated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  task_completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  task_rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  task_deleted: 'bg-red-500/20 text-red-400 border-red-500/30',
  user_created: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  user_updated: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  user_deleted: 'bg-red-500/20 text-red-400 border-red-500/30',
  role_changed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function ActivityLogsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }
  }, [status]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (status === 'authenticated') {
        setLoading(true);
        try {
          const params = new URLSearchParams();
          if (searchQuery) params.append('search', searchQuery);
          if (filterAction) params.append('action', filterAction);
          
          const response = await fetch(`/api/activity-logs?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setLogs(data.logs || []);
          }
        } catch (error) {
          console.error('Error fetching activity logs:', error);
          toast.error('Failed to fetch activity logs');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLogs();
  }, [status, searchQuery, filterAction]);

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-gray-400 mt-1">Track all system activities</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-surface/50 border-white/10 text-white"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-surface/50 border-white/10 text-white"
        >
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="task_created">Task Created</option>
          <option value="task_updated">Task Updated</option>
          <option value="task_completed">Task Completed</option>
          <option value="user_created">User Created</option>
          <option value="user_deleted">User Deleted</option>
        </select>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No activity logs found</p>
          </div>
        ) : (
          logs.map((log) => {
            const Icon = actionIcons[log.action] || Activity;
            return (
              <div
                key={log._id}
                className="glass-card rounded-xl p-4 hover:border-cyan-500/30 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${actionColors[log.action] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium">{formatAction(log.action)}</h3>
                      <span className="text-sm text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {log.user?.name || 'Unknown User'} - {log.entity}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {Object.entries(log.details).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            <span className="text-gray-400">{key}:</span> {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

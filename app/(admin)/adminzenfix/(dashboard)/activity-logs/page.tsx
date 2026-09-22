'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Search, Activity, Clock, User, FileText, Settings,
  LogIn, LogOut, Shield, CheckCircle, XCircle, RefreshCw,
  Download, ChevronLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';

interface LogEntry {
  id: number;
  user: number;
  user_email: string;
  user_name: string;
  action: string;
  action_name: string;
  entity: string;
  entity_name: string;
  entity_id: string;
  details: any;
  ip_address?: string;
  timestamp: string;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

const PAGE_SIZE = 20;
const ACTION_SET = [
  'login', 'logout', 'password_change', 'task_created', 'task_assigned',
  'task_updated', 'task_completed', 'task_rejected', 'user_created',
  'user_updated', 'user_deleted',
];

function iconForAction(action: string) {
  if (action === 'login') return LogIn;
  if (action === 'logout') return LogOut;
  if (action === 'password_change') return Settings;
  if (action.includes('task') && (action.includes('reject') || action.includes('delete'))) return XCircle;
  if (action.includes('task') && action.includes('complete')) return CheckCircle;
  if (action.includes('task')) return FileText;
  if (action.includes('user')) return User;
  if (action.includes('role')) return Shield;
  return Activity;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setLoadError(null);

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      page: String(page),
    });
    if (search.trim()) params.set('search', search.trim());
    if (filterAction) params.set('action', filterAction);

    const res = await api.get<{ items: LogEntry[]; count: number }>(`${apiEndpoints.activityLogs}?${params}`);

    if (res.error) {
      setLoadError(extractApiErrorMessage(res));
      toast.error('Failed to fetch activity logs');
    } else if (res.data) {
      setLogs(res.data.items || []);
      setTotal(res.data.count || 0);
    }
    setLoading(false);
    setRefreshing(false);
  }, [search, filterAction, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterAction]);

  const exportCSV = () => {
    if (!logs.length) return;
    const csv = [
      'Time,User,Action,Entity,Details',
      ...logs.map((l) => {
        const details = l.details
          ? Object.entries(l.details).map(([k, v]) => `${k}:${v}`).join('; ')
          : '';
        const user = l.user_name || l.user_email || 'Unknown';
        return `"${new Date(l.timestamp).toLocaleString()}","${user}","${l.action_name || l.action}","${l.entity_name || l.entity}","${details}"`;
      }),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-slate-400 mt-1">
            {total.toLocaleString()} total event{total !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/5"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/5"
            onClick={exportCSV}
            disabled={!logs.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
          <p className="text-red-400 text-sm">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => fetchLogs()} className="border-red-500/30 text-red-400">
            Retry
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by user name, email or entity id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="h-10 w-full sm:w-52 rounded-xl border border-white/10 bg-slate-900/50 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        >
          <option value="">All Actions</option>
          {ACTION_SET.map((a) => (
            <option key={a} value={a} className="bg-slate-900">
              {a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      )}

      {/* Logs list */}
      {!loading && !loadError && (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-slate-900/50 border border-white/10 rounded-2xl">
              <Activity className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400 font-medium">No activity logs found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            logs.map((log) => {
              const Icon = iconForAction(log.action);
              const severity =
                log.action.includes('reject') || log.action.includes('delete')
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : log.action.includes('complete') || log.action === 'login'
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 bg-slate-900/50 border border-white/5 rounded-xl hover:border-white/10 transition-all duration-150"
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0 mt-0.5',
                      severity
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-medium text-sm capitalize">
                            {log.action_name || log.action.replace(/_/g, ' ')}
                          </span>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs border', severity)}>
                            {log.entity_name || log.entity}
                          </span>
                          {log.entity_id && (
                            <span className="text-xs text-slate-500">#{log.entity_id}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {log.user_name || 'Unknown User'}
                            {log.user_email && (
                              <span className="text-slate-500 ml-1 text-xs">({log.user_email})</span>
                            )}
                          </span>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                            {Object.entries(log.details).slice(0, 4).map(([k, v]) => (
                              <span key={k} className="text-xs text-slate-500">
                                <span className="text-slate-400">{k}:</span>{' '}
                                {String(v).slice(0, 60)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 flex items-center gap-1 flex-shrink-0 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {timeAgo(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} — {total} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
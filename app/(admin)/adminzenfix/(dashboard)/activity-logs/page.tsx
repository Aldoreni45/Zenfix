'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { toast } from 'sonner';
import {
  Search, Activity, Clock, User, FileText, Settings,
  LogIn, LogOut, Shield, CheckCircle, XCircle, RefreshCw,
  Download, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ActivityLog {
  _id: string;
  user: { _id: string; name: string; email: string; avatar?: string; role: string } | null;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  timestamp: string;
}

const ACTION_ICON: Record<string, any> = {
  login: LogIn, logout: LogOut, password_change: Settings,
  task_created: FileText, task_assigned: CheckCircle, task_updated: FileText,
  task_completed: CheckCircle, task_rejected: XCircle, task_deleted: XCircle,
  user_created: User, user_updated: User, user_deleted: XCircle, role_changed: Shield,
};

const ACTION_COLOR: Record<string, string> = {
  login: 'bg-green-500/10 text-green-400 border-green-500/20',
  logout: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  password_change: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  task_created: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  task_assigned: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  task_updated: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  task_completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  task_rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  task_deleted: 'bg-red-500/10 text-red-400 border-red-500/20',
  user_created: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  user_updated: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  user_deleted: 'bg-red-500/10 text-red-400 border-red-500/20',
  role_changed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

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
const ALL_ACTIONS = [
  'login','logout','password_change','task_created','task_assigned',
  'task_updated','task_completed','task_rejected','task_deleted',
  'user_created','user_updated','user_deleted','role_changed',
];

export default function ActivityLogsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [page, setPage] = useState(1);

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/adminzenfix');
  }, [status]);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (status !== 'authenticated') return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const p = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(page),
      });
      if (search) p.set('search', search);
      if (filterAction) p.set('action', filterAction);

      const res = await fetch(`/api/activity-logs?${p}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status, search, filterAction, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, filterAction]);

  const exportCSV = () => {
    if (!logs.length) return;
    let csv = 'Time,User,Role,Action,Entity,Details\n';
    logs.forEach((l) => {
      const details = l.details ? Object.entries(l.details).map(([k,v]) => `${k}:${v}`).join('; ') : '';
      csv += `"${new Date(l.timestamp).toLocaleString()}","${l.user?.name || 'Unknown'}","${l.user?.role || ''}","${l.action}","${l.entity}","${details}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
        <p className="text-slate-400">Loading activity logs…</p>
      </div>
    </div>
  );

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
          <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5"
            onClick={() => fetchLogs(true)} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5"
            onClick={exportCSV} disabled={!logs.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={userRole === 'admin' ? 'Search by user name or email…' : 'Search logs…'}
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
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a} className="bg-slate-900">
              {a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Action filter pills (quick access) */}
      <div className="flex flex-wrap gap-2">
        {['','task_created','task_completed','task_rejected','login','logout','user_created'].map((a) => (
          <button key={a} onClick={() => setFilterAction(a)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              filterAction === a
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                : 'bg-white/5 text-slate-400 border-white/5 hover:text-white hover:bg-white/10'
            )}>
            {a ? a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
          </button>
        ))}
      </div>

      {/* Logs list */}
      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/50 border border-white/10 rounded-2xl">
            <Activity className="h-12 w-12 text-slate-600 mb-4" />
            <p className="text-slate-400 font-medium">No activity logs found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          logs.map((log) => {
            const Icon = ACTION_ICON[log.action] || Activity;
            const colorCls = ACTION_COLOR[log.action] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            return (
              <div key={log._id}
                className="flex items-start gap-4 p-4 bg-slate-900/50 border border-white/5 rounded-xl hover:border-white/10 hover:bg-white/3 transition-all duration-150">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0 mt-0.5', colorCls)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span className={cn('px-2 py-0.5 rounded-full text-xs border', colorCls)}>
                          {log.entity}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {log.user?.name || 'Unknown User'}
                          {log.user?.email && <span className="text-slate-500 ml-1 text-xs">({log.user.email})</span>}
                        </span>
                        {log.user?.role && (
                          <span className="px-1.5 py-0.5 bg-white/5 text-slate-500 text-xs rounded capitalize">
                            {log.user.role}
                          </span>
                        )}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                          {Object.entries(log.details).slice(0, 4).map(([k, v]) => (
                            <span key={k} className="text-xs text-slate-500">
                              <span className="text-slate-400">{k}:</span> {String(v).slice(0, 60)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} — {total} total
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2;
              if (pg < 1 || pg > totalPages) return null;
              return (
                <Button key={pg} variant={pg === page ? 'default' : 'outline'} size="sm"
                  className={pg === page
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'border-white/10 text-white hover:bg-white/5'}
                  onClick={() => setPage(pg)}>
                  {pg}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

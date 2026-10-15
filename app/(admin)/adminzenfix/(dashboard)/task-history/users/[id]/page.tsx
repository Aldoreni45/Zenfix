'use client';

import { useMemo } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, Mail, Building2, CheckCircle2, ListTodo, Clock,
  PlayCircle, AlertTriangle, XCircle, Activity, RefreshCw, CalendarDays, Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatSeconds } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUserRole, useTaskHistoryUserDetail } from '@/lib/hooks';

const ACTION_BADGE: Record<string, string> = {
  CREATE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  SUBMIT: 'bg-green-500/10 text-green-400 border-green-500/20',
  ASSIGN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  STATUS_CHANGE: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  REJECT: 'bg-red-500/10 text-red-400 border-red-500/20',
  CARRY_FORWARD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  LOGIN: 'bg-green-500/10 text-green-400 border-green-500/20',
  LOGOUT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
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

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatClock(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds?: number | null) {
  if (seconds == null) return '—';
  return formatSeconds(seconds);
}

export default function TaskHistoryUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { initialized } = useAuth();
  const userRole = useUserRole();
  const userId = Number(params.id);
  const isOwner = initialized && userRole === 'owner';

  const inheritedStart = searchParams.get('start');
  const inheritedEnd = searchParams.get('end');
  const inheritedAll = searchParams.get('all') === '1';
  const filterDate = searchParams.get('date') ?? '';

  // Keep the selected day in the URL so a refresh or shared link preserves it.
  // The inherited period params are left untouched, so clearing the date falls
  // back to the period the page was opened with.
  const applyFilter = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set('date', value);
    else next.delete('date');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // A picked day wins; otherwise honour the period inherited from the team
  // table link; otherwise show everything.
  const rangeParams = useMemo(() => {
    if (filterDate) return `date=${filterDate}`;
    if (inheritedAll) return 'all=1';
    if (inheritedStart && inheritedEnd) return `start=${inheritedStart}&end=${inheritedEnd}`;
    return 'all=1';
  }, [filterDate, inheritedAll, inheritedStart, inheritedEnd]);

  const { data, loading, error, refetch } = useTaskHistoryUserDetail(userId, rangeParams, isOwner);

  const { today, yesterday } = useMemo(() => {
    const now = new Date();
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { today: toISODate(now), yesterday: toISODate(y) };
  }, []);

  if (initialized && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-900/50 border border-white/10 rounded-2xl">
        <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
        <h1 className="text-xl font-bold text-white">Owner access required</h1>
        <p className="text-slate-400 text-sm mt-2">Task History is only available to the owner.</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-900/50 border border-white/10 rounded-2xl gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-slate-400 text-sm">{error}</p>
        <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const user = data.user;
  const counts = data.counts || {};
  const cards = [
    { label: 'Assigned', value: counts.total ?? 0, icon: ListTodo, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Completed', value: counts.completed ?? 0, sub: `${counts.completion_rate ?? 0}% rate`, icon: CheckCircle2, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { label: 'Pending', value: counts.pending ?? 0, icon: Clock, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { label: 'In Progress', value: counts.in_progress ?? 0, icon: PlayCircle, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Overdue', value: counts.overdue ?? 0, icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { label: 'Rejected', value: counts.rejected ?? 0, icon: XCircle, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  ];

  const completedTasks: any[] = data.completed_tasks || [];
  const totalCompletedSeconds = completedTasks.reduce((sum, t) => sum + (t.total_seconds || 0), 0);
  const avgCompletedSeconds = completedTasks.length
    ? Math.round(totalCompletedSeconds / completedTasks.length)
    : 0;

  const periodLabel = filterDate
    ? new Date(`${filterDate}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : data.filter?.start && data.filter?.end
      ? `${data.filter.start} → ${data.filter.end}`
      : 'All time';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Person History</h1>
          <p className="text-slate-400 mt-1">Task activity for this team member · {periodLabel}</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5 ml-auto" onClick={() => refetch()}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Date filter */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-3 bg-slate-900/50 border border-white/10 rounded-2xl p-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> Filter by date
          </label>
          <input
            type="date"
            value={filterDate}
            max={today}
            onChange={(e) => applyFilter(e.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyFilter(today)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              filterDate === today
                ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
            )}
          >
            Today
          </button>
          <button
            onClick={() => applyFilter(yesterday)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              filterDate === yesterday
                ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
            )}
          >
            Yesterday
          </button>
          {filterDate && (
            <button
              onClick={() => applyFilter('')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="lg:ml-auto text-xs text-slate-500">
          Showing tasks <span className="text-slate-300">{filterDate ? `completed on ${filterDate}` : periodLabel}</span>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
            {(user.name || user.username || 'U')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white">{user.name || user.username}</h2>
            <p className="text-sm text-slate-400 capitalize mt-0.5">{user.role_name}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-slate-400">
              {user.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </span>
              )}
              {user.department_name && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {user.department_name}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:text-right">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-bold text-white">{data.all_time?.completed ?? 0}</p>
              <p className="text-xs text-slate-500">Completed all time</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-2xl font-bold text-white">{data.all_time?.assigned ?? 0}</p>
              <p className="text-xs text-slate-500">Assigned all time</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border mb-3', card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
            <p className="text-slate-400 text-sm mt-1">{card.label}</p>
            {card.sub && <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Completed tasks with time taken */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              {filterDate ? `Completed on ${periodLabel}` : 'Completed Tasks'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {completedTasks.length} task{completedTasks.length === 1 ? '' : 's'} completed
              {completedTasks.length > 0 && (
                <>
                  {' · '}total time <span className="text-slate-300">{formatSeconds(totalCompletedSeconds)}</span>
                  {' · '}average <span className="text-slate-300">{formatSeconds(avgCompletedSeconds)}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {completedTasks.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            {filterDate ? 'No tasks completed on this date' : 'No completed tasks in this period'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase">
                  <th className="py-2.5 pr-4">Task</th>
                  <th className="py-2.5 pr-4">Client</th>
                  <th className="py-2.5 pr-4">Started → Completed</th>
                  <th className="py-2.5 pr-4">Time Taken</th>
                  <th className="py-2.5 pr-4">Work Time</th>
                  <th className="py-2.5 pr-4">Hold Time</th>
                  <th className="py-2.5">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {completedTasks.map((t: any) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4">
                      <Link href={`/adminzenfix/task-history/tasks/${t.id}`} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {(t.title || 'T')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate group-hover:text-cyan-300 transition-colors max-w-64">{t.title}</p>
                          <p className="text-xs text-slate-500">{t.task_id}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{t.client_name || '—'}</td>
                    <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                      {t.completed_at
                        ? (
                          <>
                            {t.started_at ? `${formatClock(t.started_at)} → ` : ''}
                            {formatClock(t.completed_at)}
                            <span className="text-slate-600"> · {new Date(t.completed_at).toLocaleDateString()}</span>
                          </>
                        )
                        : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1.5 text-cyan-400 font-medium">
                        <Timer className="h-3.5 w-3.5" />
                        {formatDuration(t.total_seconds)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{formatDuration(t.actual_work_seconds)}</td>
                    <td className="py-3 pr-4 text-orange-400">{formatDuration(t.total_hold_seconds)}</td>
                    <td className="py-3">
                      {t.work_efficiency_percent == null ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs border',
                            t.work_efficiency_percent >= 70
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : t.work_efficiency_percent >= 40
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                          )}
                        >
                          {t.work_efficiency_percent}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-5">
            {filterDate ? 'Tasks in this period' : 'Recent Tasks'}
          </h3>
          {data.recent_tasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No tasks in this period</p>
          ) : (
            <div className="space-y-2.5">
              {data.recent_tasks.map((t: any) => (
                <Link
                  key={t.id}
                  href={`/adminzenfix/task-history/tasks/${t.id}`}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0',
                      t.status === 'completed' ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : t.status === 'in_progress' ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                        : t.status === 'overdue' || t.is_overdue ? 'bg-gradient-to-br from-red-500 to-orange-600'
                        : 'bg-gradient-to-br from-cyan-500 to-purple-600'
                    )}>
                      {(t.title || 'T')[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-slate-500">{t.task_id} · {t.client_name || 'No client'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {t.status === 'completed' && t.total_seconds != null && (
                      <span className="text-xs text-cyan-400 whitespace-nowrap">{formatDuration(t.total_seconds)}</span>
                    )}
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs capitalize border',
                      t.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : t.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : t.status === 'overdue' || t.is_overdue ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    )}>
                      {t.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" /> Recent Activity
          </h3>
          {data.activity.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No activity recorded</p>
          ) : (
            <div className="space-y-3">
              {data.activity.slice(0, 15).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 capitalize border',
                    ACTION_BADGE[log.action] || 'bg-slate-500/20 text-slate-400 border-white/10'
                  )}>
                    {log.action_name}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">{log.description || `${log.entity_name} updated`}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{timeAgo(log.timestamp)} · {log.entity_name}{log.entity_id ? ` #${log.entity_id}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

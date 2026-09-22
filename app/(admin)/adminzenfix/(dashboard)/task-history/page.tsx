'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search, RefreshCw, Download, Loader2, Clock, CheckCircle2, ListTodo,
  PlayCircle, AlertTriangle, XCircle, ChevronLeft, ChevronRight, Users, CalendarDays,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, PieChart, Pie, Cell,
} from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth, useUserRole, useTaskHistorySummary, useTaskHistoryUsers, useTaskHistoryDaily, useTaskHistoryDailyDetail, useTaskHistoryTasks } from '@/lib/hooks';

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: 12,
};

const PIE_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#64748B'];

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  assigned: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  blocked: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  submitted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

function toISODate(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function TaskHistoryPage() {
  const { initialized } = useAuth();
  const userRole = useUserRole();

  const [preset, setPreset] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userId, setUserId] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [tableStatus, setTableStatus] = useState('');
  const [search, setSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const dateParams = useMemo(() => {
    if (preset === 'all') return 'all=1';
    if (preset === 'custom') {
      if (!startDate || !endDate) return '';
      return `start=${startDate}&end=${endDate}`;
    }
    const end = new Date();
    const start = new Date();
    if (preset === 'month') {
      start.setDate(1);
    } else {
      start.setDate(end.getDate() - (Number(preset) - 1));
    }
    return `start=${toISODate(start)}&end=${toISODate(end)}`;
  }, [preset, startDate, endDate]);

  const userParam = userId ? `&user=${userId}` : '';

  const isOwner = initialized && userRole === 'owner';

  const { data: summary, loading: summaryLoading, refetch: refetchSummary } = useTaskHistorySummary({ params: dateParams + userParam, enabled: isOwner });
  const { data: dailyRows, loading: dailyLoading, refetch: refetchDaily } = useTaskHistoryDaily({ params: dateParams + userParam, enabled: isOwner });
  const { data: dayDetail, loading: dayLoading, error: dayError, refetch: refetchDay } = useTaskHistoryDailyDetail(selectedDate, isOwner);
  const { data: team, loading: teamLoading, refetch: refetchTeam } = useTaskHistoryUsers({ params: dateParams + userParam, enabled: isOwner });
  const {
    data: pageData, loading: tableLoading, refetch: refetchTable,
  } = useTaskHistoryTasks(
    {
      params: `${dateParams}${userParam}${tableStatus ? `&status=${tableStatus}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}&page=${tablePage}&page_size=20`,
      enabled: isOwner,
    }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchDaily(), refetchTeam(), refetchTable()]);
    setRefreshing(false);
    toast.success('Task history refreshed');
  };

  const summaryCards = [
    { label: 'Total Tasks', value: summary?.total ?? 0, sub: `${summary?.total_all_time ?? 0} all time`, icon: ListTodo, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Completed', value: summary?.completed ?? 0, sub: `${summary?.completion_rate ?? 0}% rate`, icon: CheckCircle2, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { label: 'Pending', value: summary?.pending ?? 0, sub: 'Not started', icon: Clock, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    { label: 'In Progress', value: summary?.in_progress ?? 0, sub: 'Working', icon: PlayCircle, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Overdue', value: summary?.overdue ?? 0, sub: 'Past deadline', icon: AlertTriangle, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    { label: 'Rejected', value: summary?.rejected ?? 0, sub: `Carried fwd ${summary?.carried_forward ?? 0}`, icon: XCircle, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  ];

  const pieData = [
    { name: 'Completed', value: summary?.completed ?? 0 },
    { name: 'Pending', value: summary?.pending ?? 0 },
    { name: 'In Progress', value: summary?.in_progress ?? 0 },
    { name: 'Overdue', value: summary?.overdue ?? 0 },
    { name: 'Rejected', value: summary?.rejected ?? 0 },
    { name: 'Cancelled', value: summary?.cancelled ?? 0 },
  ].filter((d) => d.value > 0);

  const chartDays = (dailyRows || []).slice(-30);

  const filteredTeam = (team || []).filter((u: any) => !roleFilter || u.role === roleFilter);

  const items = pageData?.items ?? [];
  const total = pageData?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (pageData?.page_size || 20)));

  const exportCSV = () => {
    if (!items.length) return;
    const csv = [
      'Task ID,Title,Client,Assignee,Due Date,Status,Priority,Completed At',
      ...items.map((t: any) =>
        `"${t.task_id}","${(t.title || '').replace(/"/g, '""')}",` +
        `"${t.client_name || ''}","${t.assigned_to_name || ''}",` +
        `"${t.due_date || ''}","${t.status}","${t.priority}",` +
        `"${t.completed_at ? new Date(t.completed_at).toLocaleString() : ''}"`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loading = summaryLoading || dailyLoading || teamLoading;

  if (initialized && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-900/50 border border-white/10 rounded-2xl">
        <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
        <h1 className="text-xl font-bold text-white">Owner access required</h1>
        <p className="text-slate-400 text-sm mt-2">Task History is only available to the owner.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Task History</h1>
          <p className="text-slate-400 mt-1">Who was assigned, completed, pending or overdue — per person and per day.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5" onClick={exportCSV} disabled={!items.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-end gap-3 bg-slate-900/50 border border-white/10 rounded-2xl p-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Period</label>
          <div className="flex flex-wrap gap-2">
            {[
              { k: '7', label: 'Last 7 days' },
              { k: '30', label: 'Last 30 days' },
              { k: '90', label: 'Last 90 days' },
              { k: 'month', label: 'This month' },
              { k: 'all', label: 'All time' },
              { k: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.k}
                onClick={() => setPreset(p.k)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  preset === p.k
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                    : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {preset === 'custom' && (
          <>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-slate-950/60 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]"
              />
            </div>
          </>
        )}
        <div className="flex-1">
          <label className="block text-xs text-slate-500 mb-1.5">Team member</label>
          <select
            value={userId}
            onChange={(e) => { setUserId(e.target.value); setTablePage(1); }}
            className="h-10 w-full rounded-xl border border-white/10 bg-slate-900/50 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="">Everyone</option>
            {(team || []).map((u: any) => (
              <option key={u.id} value={u.id} className="bg-slate-900">
                {u.name || u.username} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      )}

      {!loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {summaryCards.map((card) => (
              <div key={card.label} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border mb-3', card.color)}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-bold text-white">{card.value}</p>
                <p className="text-slate-400 text-sm mt-1">{card.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-5">Daily Activity</h3>
              {chartDays.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-slate-500 text-sm">No task data in this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartDays}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="in_progress" name="In Progress" stackId="a" fill="#3B82F6" />
                    <Bar dataKey="overdue" name="Overdue" stackId="a" fill="#EF4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-5">Status Breakdown</h3>
              {pieData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-slate-500 text-sm">No task data in this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                      {pieData.map((d: any, i: number) => (
                        <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [v, n]} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-cyan-400" /> Daily Activity — {dateParams || 'All time'}
              </h3>
              <div className="flex gap-3">
                <label className="block text-xs text-slate-500">Role filter</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-9 rounded-xl border border-white/10 bg-slate-900/50 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="">All roles</option>
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase">
                    <th className="py-2.5 pr-4">Date</th>
                    <th className="py-2.5 pr-4">Total</th>
                    <th className="py-2.5 pr-4">Completed</th>
                    <th className="py-2.5 pr-4">Pending</th>
                    <th className="py-2.5 pr-4">In Progress</th>
                    <th className="py-2.5 pr-4">Overdue</th>
                    <th className="py-2.5">Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {(dailyRows || []).slice(-15).reverse().map((row: any) => (
                    <tr
                      key={row.date}
                      onClick={() => setSelectedDate(row.date)}
                      title="Click to view tasks for this date"
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 pr-4 text-white font-medium hover:text-cyan-300 transition-colors">{row.date}</td>
                      <td className="py-2.5 pr-4 text-white font-medium">{row.total}</td>
                      <td className="py-2.5 pr-4 text-green-400">{row.completed}</td>
                      <td className="py-2.5 pr-4 text-yellow-400">{row.pending}</td>
                      <td className="py-2.5 pr-4 text-blue-400">{row.in_progress}</td>
                      <td className="py-2.5 pr-4 text-red-400">{row.overdue}</td>
                      <td className="py-2.5 text-orange-400">{row.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" /> Team Performance
              </h3>
              <p className="text-xs text-slate-500">Click a person to see their full history</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase">
                    <th className="py-2.5 pr-4">Person</th>
                    <th className="py-2.5 pr-4">Role</th>
                    <th className="py-2.5 pr-4">Assigned</th>
                    <th className="py-2.5 pr-4">Pending</th>
                    <th className="py-2.5 pr-4">In Progress</th>
                    <th className="py-2.5 pr-4">Completed</th>
                    <th className="py-2.5 pr-4">Overdue</th>
                    <th className="py-2.5">Done %</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeam.map((u: any) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                      <td className="py-2.5 pr-4">
                        <Link href={`/adminzenfix/task-history/users/${u.id}${dateParams ? `?${dateParams}` : ''}`} className="flex items-center gap-3 group">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {(u.name || u.username || 'U')[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium group-hover:text-cyan-300 transition-colors truncate">{u.name || u.username}</p>
                            <p className="text-xs text-slate-500 truncate">{u.department_name || '—'}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-400 capitalize">{u.role_name}</td>
                      <td className="py-2.5 pr-4 text-white font-medium">{u.assigned}</td>
                      <td className="py-2.5 pr-4 text-yellow-400">{u.pending}</td>
                      <td className="py-2.5 pr-4 text-blue-400">{u.in_progress}</td>
                      <td className="py-2.5 pr-4 text-green-400">{u.completed}</td>
                      <td className="py-2.5 pr-4 text-red-400">{u.overdue}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 min-w-16 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-green-500 rounded-full" style={{ width: `${Math.min(u.completion_rate, 100)}%` }} />
                          </div>
                          <span className="text-xs text-slate-300 w-10 text-right">{u.completion_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTeam.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">No team members match this filter</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Task History — {total.toLocaleString()} task{total === 1 ? '' : 's'}</h3>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by title or task id..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setTablePage(1); }}
                    className="pl-10 bg-slate-950/40 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
                <select
                  value={tableStatus}
                  onChange={(e) => { setTableStatus(e.target.value); setTablePage(1); }}
                  className="h-10 w-full sm:w-44 rounded-xl border border-white/10 bg-slate-900/50 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="">All statuses</option>
                  {['pending', 'assigned', 'in_progress', 'blocked', 'submitted', 'completed', 'rejected', 'cancelled', 'overdue'].map((s) => (
                    <option key={s} value={s} className="bg-slate-900">{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            {tableLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <ListTodo className="h-12 w-12 text-slate-600 mb-4" />
                <p className="text-slate-400 font-medium">No tasks found</p>
                <p className="text-slate-500 text-sm mt-1">Try adjusting the search or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase">
                      <th className="py-2.5 pr-4">Task</th>
                      <th className="py-2.5 pr-4">Client</th>
                      <th className="py-2.5 pr-4">Assignee</th>
                      <th className="py-2.5 pr-4">Status</th>
                      <th className="py-2.5 pr-4">Priority</th>
                      <th className="py-2.5 pr-4">Due Date</th>
                      <th className="py-2.5">Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((t: any) => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                        <td className="py-2.5 pr-4">
                          <Link href={`/adminzenfix/task-history/tasks/${t.id}`} className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {(t.title || 'T')[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium group-hover:text-cyan-300 transition-colors truncate max-w-72">{t.title}</p>
                              <p className="text-xs text-slate-500">{t.task_id}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-400">{t.client_name || '—'}</td>
                        <td className="py-2.5 pr-4 text-slate-400">{t.assigned_to_name || t.assigned_manager_name || '—'}</td>
                        <td className="py-2.5 pr-4">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs capitalize border',
                            STATUS_BADGE[t.status] || STATUS_BADGE.overdue
                          )}>
                            {t.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs capitalize border', PRIORITY_BADGE[t.priority] || PRIORITY_BADGE.medium)}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-slate-400">{t.due_date || '—'}</td>
                        <td className="py-2.5 text-slate-400">{t.completed_at ? new Date(t.completed_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!tableLoading && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <p className="text-sm text-slate-500">Page {pageData?.page} of {totalPages} — {total.toLocaleString()} total</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline" size="sm"
                    className="border-white/10 text-white hover:bg-white/5"
                    onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                    disabled={tablePage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="border-white/10 text-white hover:bg-white/5"
                    onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
                    disabled={tablePage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:p-8" onClick={() => setSelectedDate(null)}>
          <div
            className="w-full max-w-3xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-5">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-cyan-400" />
                  Task Details — {selectedDate}
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">{dayDetail ? `${dayDetail.total} task${dayDetail.total === 1 ? '' : 's'} on this date` : 'Loading…'}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 flex-shrink-0" onClick={() => setSelectedDate(null)}>
                Close
              </Button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {dayLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                </div>
              ) : dayError ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <AlertTriangle className="h-10 w-10 text-red-400" />
                  <p className="text-slate-400 text-sm">{dayError}</p>
                  <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5" onClick={() => refetchDay()}>
                    Retry
                  </Button>
                </div>
              ) : dayDetail && (
                <div className="space-y-5">
                  {[
                    { key: 'completed', label: 'Completed', color: 'text-green-400', badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
                    { key: 'pending', label: 'Pending', color: 'text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                    { key: 'in_progress', label: 'In Progress', color: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                    { key: 'overdue', label: 'Overdue', color: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
                    { key: 'rejected', label: 'Rejected', color: 'text-orange-400', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
                    { key: 'cancelled', label: 'Cancelled', color: 'text-slate-400', badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
                  ].map((section) => {
                    const tasks = dayDetail.groups?.[section.key] || [];
                    return (
                      <div key={section.key}>
                        <h4 className={cn('text-sm font-semibold mb-2 flex items-center gap-2', section.color)}>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs border', section.badge)}>{tasks.length}</span>
                          {section.label}
                        </h4>
                        {tasks.length === 0 ? (
                          <p className="text-slate-600 text-sm px-1">None</p>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-white/5">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase bg-white/5">
                                  <th className="py-2.5 px-3">Task</th>
                                  <th className="py-2.5 px-3">Assignee</th>
                                  <th className="py-2.5 px-3">Status</th>
                                  <th className="py-2.5 px-3">Due Date</th>
                                  <th className="py-2.5 px-3">Completed At</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tasks.map((t: any) => (
                                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-2.5 px-3">
                                      <Link href={`/adminzenfix/task-history/tasks/${t.id}`} className="text-white font-medium hover:text-cyan-300 transition-colors">
                                        {t.title}
                                      </Link>
                                      <p className="text-xs text-slate-500">{t.task_id}</p>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-400">{t.assigned_to_name || '—'}</td>
                                    <td className="py-2.5 px-3">
                                      <span className={cn('px-2 py-0.5 rounded-full text-xs capitalize border', STATUS_BADGE[t.status] || STATUS_BADGE.overdue)}>
                                        {t.status_name || t.status}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-400">{t.due_date || '—'}</td>
                                    <td className="py-2.5 px-3 text-slate-400">{t.completed_at ? new Date(t.completed_at).toLocaleString() : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isWithinDays(ts: string, days: number) {
  return Date.now() - new Date(ts).getTime() <= days * 86400000;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [tasksRes, employeesRes] = await Promise.all([
      api.get<any>(apiEndpoints.tasks),
      api.get<any>(apiEndpoints.employees),
    ]);

    if (tasksRes.error) {
      setError(extractApiErrorMessage(tasksRes));
    } else if (tasksRes.data) {
      setTasks(tasksRes.data.results || tasksRes.data || []);
    }

    if (employeesRes.error) {
      setError(extractApiErrorMessage(employeesRes));
    } else if (employeesRes.data) {
      setEmployees(employeesRes.data.results || employeesRes.data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const rangeDays = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;

  const filtered = tasks.filter((t: any) => !t.created_at || isWithinDays(t.created_at, rangeDays));
  const totalTasks = filtered.length;
  const completedTasks = filtered.filter((t: any) => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const avgEfficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Team performance: group by assignee
  const byAssignee = new Map<string, { total: number; completed: number }>();
  filtered.forEach((t: any) => {
    const key = t.assigned_to_name || 'Unassigned';
    const entry = byAssignee.get(key) || { total: 0, completed: 0 };
    entry.total += 1;
    if (t.status === 'completed') entry.completed += 1;
    byAssignee.set(key, entry);
  });
  const teamPerformance = [...byAssignee.entries()].map(([name, v]) => ({
    name,
    total: v.total,
    completed: v.completed,
    efficiency: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
  }));

  // Department performance from employee task counts
  const byDept = new Map<string, { assigned: number; completed: number }>();
  employees.forEach((e: any) => {
    const dept = e.department_name || 'Unassigned';
    const entry = byDept.get(dept) || { assigned: 0, completed: 0 };
    entry.assigned += e.assigned_tasks_count || 0;
    entry.completed += e.completed_tasks_count || 0;
    byDept.set(dept, entry);
  });
  const departmentStats = [...byDept.entries()].map(([name, v]) => ({
    name,
    total: v.assigned,
    completed: v.completed,
    efficiency: v.assigned > 0 ? Math.round((v.completed / v.assigned) * 100) : 0,
  }));

  // Completion trend by day of week
  const trendCounts = new Array(7).fill(0);
  filtered
    .filter((t: any) => t.status === 'completed' && t.completed_at)
    .forEach((t: any) => {
      const day = new Date(t.completed_at).getDay();
      trendCounts[day] += 1;
    });
  const completionTrendData = DAY_NAMES.map((day, index) => ({ day, count: trendCounts[index] }));
  const maxCount = Math.max(...trendCounts, 1);

  const stats = [
    {
      title: 'Total Tasks',
      value: totalTasks.toString(),
      change: timeRange.toUpperCase(),
      trend: 'up' as const,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Completed',
      value: completedTasks.toString(),
      change: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`,
      trend: completedTasks > 0 ? 'up' as const : ('down' as const),
      color: 'text-green-400 bg-green-500/10 border-green-500/20',
    },
    {
      title: 'Pending',
      value: pendingTasks.toString(),
      change: `${totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}%`,
      trend: pendingTasks > 0 ? ('down' as const) : ('up' as const),
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    },
    {
      title: 'Efficiency',
      value: `${avgEfficiency}%`,
      change: `${totalTasks} tasks analyzed`,
      trend: avgEfficiency >= 70 ? ('up' as const) : ('down' as const),
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">Unable to load analytics</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <Button onClick={fetchAnalytics} className="bg-cyan-500 hover:bg-cyan-600">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Track performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/50 border border-white/10 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  timeRange === range
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/5"
            onClick={fetchAnalytics}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border', stat.color)}>
                {stat.trend === 'up' ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
              </div>
              <span
                className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                )}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-slate-400 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Task Completion Trend (by Day of Week)</h3>
          {completionTrendData.every((d) => d.count === 0) ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-slate-400 text-sm">No completed tasks data available</p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-2">
              {completionTrendData.map((item) => {
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-cyan-500 to-purple-600 rounded-t-lg transition-all duration-300 hover:opacity-80"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-slate-400">{item.day}</span>
                    <span className="text-xs text-slate-500">{item.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Department Performance */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Department Performance</h3>
          <div className="space-y-4">
            {departmentStats.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">No employee data available</p>
            ) : (
              departmentStats.map((dept) => (
                <div key={dept.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{dept.name}</span>
                    <span className="text-slate-400">
                      {dept.completed}/{dept.total} · {dept.efficiency}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${dept.efficiency}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Team Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-sm font-medium text-slate-400">Team Member</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Total Tasks</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Completed</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                    No tasks in this period
                  </td>
                </tr>
              ) : (
                teamPerformance.map((member) => (
                  <tr
                    key={member.name}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                          {member.name
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')}
                        </div>
                        <span className="text-white font-medium">{member.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{member.total}</td>
                    <td className="p-4 text-slate-300">{member.completed}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full"
                            style={{ width: `${member.efficiency}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-sm">{member.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Download,
  TrendingUp,
  FileText,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  FileDown,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';

const COLORS = ['#06B6D4', '#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981',
  in_progress: '#3B82F6',
  pending: '#F59E0B',
  rejected: '#EF4444',
  overdue: '#DC2626',
};

const tooltipStyle = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [spendingStats, setSpendingStats] = useState<any>(null);
  const [activeChart, setActiveChart] = useState<'bar' | 'line' | 'area'>('bar');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [tasksRes, employeesRes, spendingRes] = await Promise.all([
      api.get<any>(apiEndpoints.tasks),
      api.get<any>(apiEndpoints.employees),
      api.get<any>(apiEndpoints.spendingStats),
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

    if (spendingRes.error) {
      console.error('Spending stats error:', spendingRes.error);
    } else if (spendingRes.data) {
      setSpendingStats(spendingRes.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const statusCounts = new Map<string, number>();
  tasks.forEach((t: any) => {
    const key = t.status || 'unknown';
    statusCounts.set(key, (statusCounts.get(key) || 0) + 1);
  });
  const statusPieData = [...statusCounts.entries()].map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
    fill: STATUS_COLORS[status] || '#94A3B8',
  }));

  const byAssignee = new Map<string, { total: number; completed: number }>();
  tasks.forEach((t: any) => {
    const key = t.assigned_to_name || 'Unassigned';
    const entry = byAssignee.get(key) || { total: 0, completed: 0 };
    entry.total += 1;
    if (t.status === 'completed') entry.completed += 1;
    byAssignee.set(key, entry);
  });
  const efficiencyData = [...byAssignee.entries()].map(([name, v]) => ({
    name,
    total: v.total,
    completed: v.completed,
    efficiency: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
  }));

  const byPriority = new Map<string, number>();
  tasks.forEach((t: any) => {
    const priority = t.priority || 'unknown';
    byPriority.set(priority, (byPriority.get(priority) || 0) + 1);
  });
  const priorityData = [...byPriority.entries()].map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: name === 'urgent' ? '#EF4444' : name === 'high' ? '#F97316' : name === 'medium' ? '#F59E0B' : '#10B981',
  }));

  const trendCounts = new Array(7).fill(0);
  tasks
    .filter((t: any) => t.status === 'completed' && t.completed_at)
    .forEach((t: any) => {
      trendCounts[new Date(t.completed_at).getDay()] += 1;
    });
  const trendData = DAY_NAMES.map((day, i) => ({ name: day, completed: trendCounts[i] }));

  // Employee task stats for selected date - includes all users (employees and managers)
  const getEmployeeStatsForDate = (date: Date | null) => {
    if (!date) return [];
    
    const dateStr = date.toISOString().split('T')[0];
    const userStats = new Map<string, { completed: number; pending: number; inProgress: number }>();
    
    tasks.forEach((t: any) => {
      if (t.due_date && t.due_date.startsWith(dateStr)) {
        const name = t.assigned_to_name || 'Unassigned';
        const stats = userStats.get(name) || { completed: 0, pending: 0, inProgress: 0 };
        
        if (t.status === 'completed') stats.completed++;
        else if (t.status === 'in_progress') stats.inProgress++;
        else stats.pending++;
        
        userStats.set(name, stats);
      }
    });
    
    return [...userStats.entries()].map(([name, stats]) => ({
      name,
      completed: stats.completed,
      pending: stats.pending,
      inProgress: stats.inProgress,
      total: stats.completed + stats.pending + stats.inProgress,
    }));
  };

  const employeeDateStats = getEmployeeStatsForDate(selectedDate);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const calendarDays = [];
    
    for (let i = firstDay - 1; i >= 0; i--) {
      calendarDays.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({ day: i, isCurrentMonth: true });
    }
    
    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({ day: i, isCurrentMonth: false });
    }
    
    return calendarDays;
  };

  const getTaskCountForDay = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return 0;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter((t: any) => t.due_date && t.due_date.startsWith(dateStr)).length;
  };

  const calendarDays = getDaysInMonth(currentMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const avgEfficiency = efficiencyData.length
    ? Math.round(efficiencyData.reduce((s: number, i: any) => s + i.efficiency, 0) / efficiencyData.length)
    : 0;
  const totalSpending = spendingStats?.total_spending || 0;

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    try {
      let csv = 'ZenFix Report\n';
      csv += `Generated:,${new Date().toLocaleString()}\n\n`;
      csv += 'Status Distribution\n';
      csv += 'Status,Count\n';
      statusPieData.forEach((item) => {
        csv += `"${item.name}",${item.value}\n`;
      });
      csv += `\nTeam Performance\n`;
      csv += 'Member,Total Tasks,Completed,Pending,Efficiency\n';
      efficiencyData.forEach((item) => {
        csv += `"${item.name}",${item.total},${item.completed},${item.total - item.completed},${item.efficiency}%\n`;
      });
      csv += `\nSummary\n`;
      csv += `Total Tasks,${totalTasks}\n`;
      csv += `Completed,${completedTasks}\n`;
      csv += `Pending,${pendingTasks}\n`;
      csv += `Avg Efficiency,${avgEfficiency}%\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenfix-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMenuOpen(false);
    } catch (e) {
      console.error('CSV export error', e);
    }
  };

  // ── Export PDF (print window) ────────────────────────────────────────────────
  const handleExportPDF = () => {
    const rows = efficiencyData
      .map(
        (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.total}</td>
        <td>${item.completed}</td>
        <td>${item.total - item.completed}</td>
        <td>${item.efficiency}%</td>
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><title>ZenFix Report</title>
      <style>
        body{font-family:Arial,sans-serif;padding:30px;color:#1e293b}
        h1{color:#06B6D4;margin-bottom:4px}
        .meta{color:#64748b;margin-bottom:24px;font-size:13px}
        .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
        .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center}
        .card .val{font-size:28px;font-weight:700;color:#06B6D4}
        .card .lbl{font-size:12px;color:#64748b;margin-top:4px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th{background:#06B6D4;color:#fff;padding:10px 14px;text-align:left}
        td{padding:10px 14px;border-bottom:1px solid #e2e8f0}
        tr:nth-child(even) td{background:#f8fafc}
        @media print{body{padding:0}}
      </style></head><body>
      <h1>ZenFix Analytics Report</h1>
      <div class="meta">Generated: ${new Date().toLocaleString()}</div>
      <div class="summary">
        <div class="card"><div class="val">${totalTasks}</div><div class="lbl">Total Tasks</div></div>
        <div class="card"><div class="val">${completedTasks}</div><div class="lbl">Completed</div></div>
        <div class="card"><div class="val">${pendingTasks}</div><div class="lbl">Pending</div></div>
        <div class="card"><div class="val">${avgEfficiency}%</div><div class="lbl">Avg Efficiency</div></div>
      </div>
      <h2>Team Performance</h2>
      <table><thead><tr><th>Member</th><th>Total</th><th>Completed</th><th>Pending</th><th>Efficiency</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">No data</td></tr>'}</tbody></table>
      </body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 300);
    setExportMenuOpen(false);
  };

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
          <p className="text-white font-medium mb-2">Unable to load reports</p>
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
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-slate-400 mt-1">Comprehensive performance insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/5"
            onClick={fetchAnalytics}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <div className="relative">
            <Button
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
            {exportMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setExportMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-cyan-400" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                  >
                    <Download className="h-4 w-4 text-purple-400" />
                    Export PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: 'Total Tasks',
            value: totalTasks,
            sub: 'All time',
            icon: BarChart2,
            color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          },
          {
            label: 'Completed',
            value: completedTasks,
            sub: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% rate`,
            icon: CheckCircle2,
            color: 'text-green-400 bg-green-500/10 border-green-500/20',
          },
          {
            label: 'Pending',
            value: pendingTasks,
            sub: `${totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}% pending`,
            icon: Clock,
            color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
          },
          {
            label: 'Total Spending',
            value: `₹${totalSpending.toFixed(2)}`,
            sub: 'All expenses',
            icon: DollarSign,
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          },
          {
            label: 'Team Efficiency',
            value: `${avgEfficiency}%`,
            sub: 'Average',
            icon: TrendingUp,
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-sm">{card.label}</span>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border', card.color)}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-slate-400 mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Completion Trend */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Completion Trend (by Day of Week)</h3>
            <div className="flex gap-1 bg-white/5 rounded-lg p-1">
              {(['bar', 'line', 'area'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveChart(t)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                    activeChart === t
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            {activeChart === 'bar' ? (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="completed" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            ) : activeChart === 'line' ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="completed" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4', r: 4 }} name="Completed" />
              </LineChart>
            ) : (
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="completed" stroke="#06B6D4" strokeWidth={2} fill="url(#trendGrad)" name="Completed" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Task Status Distribution</h3>
          {statusPieData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-slate-500">No task data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={statusPieData[index].fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 12, textTransform: 'capitalize' }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Calendar & Employee Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-400" />
              Task Calendar
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(prev => {
                  const newDate = new Date(prev);
                  newDate.setMonth(prev.getMonth() - 1);
                  return newDate;
                })}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-400" />
              </button>
              <span className="text-white font-medium min-w-[140px] text-center">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={() => setCurrentMonth(prev => {
                  const newDate = new Date(prev);
                  newDate.setMonth(prev.getMonth() + 1);
                  return newDate;
                })}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-medium text-slate-400">
                {day}
              </div>
            ))}
            {calendarDays.map((calendarDay, index) => {
              const taskCount = getTaskCountForDay(calendarDay.day, calendarDay.isCurrentMonth);
              const isSelected = selectedDate && 
                calendarDay.isCurrentMonth &&
                selectedDate.getDate() === calendarDay.day &&
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getFullYear() === currentMonth.getFullYear();
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (calendarDay.isCurrentMonth) {
                      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), calendarDay.day);
                      setSelectedDate(selectedDate && selectedDate.getTime() === newDate.getTime() ? null : newDate);
                    }
                  }}
                  className={cn(
                    'min-h-[60px] p-2 border border-white/5 rounded-lg transition-all relative',
                    !calendarDay.isCurrentMonth && 'bg-slate-950/30 opacity-50',
                    calendarDay.isCurrentMonth && 'hover:bg-white/5 cursor-pointer',
                    isSelected && 'bg-cyan-500/20 border-cyan-500/30'
                  )}
                >
                  <span
                    className={cn(
                      'text-xs font-medium',
                      calendarDay.isCurrentMonth ? 'text-white' : 'text-slate-600'
                    )}
                  >
                    {calendarDay.day}
                  </span>
                  {taskCount > 0 && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="text-[10px] text-cyan-400">{taskCount}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Employee Stats for Selected Date */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            {selectedDate 
              ? `Employee Tasks - ${selectedDate.toLocaleDateString()}`
              : 'Select a date to view employee tasks'}
          </h3>
          {!selectedDate ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-slate-500">Click on a date in the calendar to view employee task stats</p>
            </div>
          ) : employeeDateStats.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center">
              <p className="text-slate-500">No tasks found for this date</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={employeeDateStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" radius={[0, 0, 0, 4]} />
                <Bar dataKey="inProgress" stackId="a" fill="#3B82F6" name="In Progress" />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" radius={[4, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Charts Row 2 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Priority */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Tasks by Priority</h3>
          {priorityData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-slate-500">No priority data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {priorityData.map((entry: any, index: number) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Team Efficiency */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Team Member Efficiency</h3>
          {efficiencyData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-slate-500">No efficiency data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={efficiencyData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(val: any) => [`${val}%`, 'Efficiency']}
                />
                <Bar dataKey="efficiency" radius={[4, 4, 0, 0]} name="Efficiency">
                  {efficiencyData.slice(0, 8).map((entry: any, i: number) => (
                    <Cell
                      key={entry.name}
                      fill={entry.efficiency >= 80 ? '#10B981' : entry.efficiency >= 50 ? '#F59E0B' : '#EF4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Detailed Report Table ── */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Detailed Team Report</h3>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/5"
            onClick={handleExportCSV}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left pb-3 pl-2 text-slate-400 font-medium">Member</th>
                <th className="text-right pb-3 px-4 text-slate-400 font-medium">Total</th>
                <th className="text-right pb-3 px-4 text-slate-400 font-medium">Completed</th>
                <th className="text-right pb-3 px-4 text-slate-400 font-medium">Pending</th>
                <th className="text-right pb-3 px-4 text-slate-400 font-medium">Efficiency</th>
                <th className="text-left pb-3 px-4 text-slate-400 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {efficiencyData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No data available
                  </td>
                </tr>
              ) : (
                efficiencyData.map((item, i) => {
                  const eff = item.efficiency;
                  const effColor =
                    eff >= 80
                      ? 'text-green-400 bg-green-500/10 border-green-500/20'
                      : eff >= 50
                      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                      : 'text-red-400 bg-red-500/10 border-red-500/20';
                  const barColor = eff >= 80 ? '#10B981' : eff >= 50 ? '#F59E0B' : '#EF4444';
                  return (
                    <tr key={item.name} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="py-3 pl-2">
                        <p className="text-white font-medium">{item.name}</p>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">{item.total}</td>
                      <td className="py-3 px-4 text-right text-green-400">{item.completed}</td>
                      <td className="py-3 px-4 text-right text-yellow-400">{item.total - item.completed}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', effColor)}>
                          {eff}%
                        </span>
                      </td>
                      <td className="py-3 px-4 w-32">
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${eff}%`, backgroundColor: barColor }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
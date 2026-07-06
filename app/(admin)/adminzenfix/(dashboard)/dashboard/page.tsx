'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckSquare, Clock, AlertCircle, TrendingUp, Users,
  Calendar, ArrowUpRight, MoreHorizontal, Activity,
  Target, Zap, Award, RefreshCw, Bell, Filter,
  BarChart3, PieChart as PieChartIcon, Download,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#10B981',
};
const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981', in_progress: '#3B82F6', pending: '#F59E0B',
  not_completed: '#F97316', rejected: '#EF4444',
};
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#fff', fontSize: 12,
};
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({ totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0, totalUsers: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  const userRole = (session?.user as any)?.role || 'worker';

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/adminzenfix');
    if (status === 'authenticated') fetchAll();
  }, [status]);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [statsRes, tasksRes, analyticsRes, logsRes, notifRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/tasks'),
        fetch('/api/analytics'),
        userRole === 'admin' ? fetch('/api/activity-logs?limit=8') : Promise.resolve(null),
        fetch('/api/notifications'),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());

      if (tasksRes.ok) {
        const td = await tasksRes.json();
        setRecentTasks(td.tasks?.slice(0, 6) || []);
      }

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());

      if (logsRes && logsRes.ok) {
        const ld = await logsRes.json();
        setActivityLogs(ld.logs || []);
      }

      if (notifRes.ok) {
        const nd = await notifRes.json();
        setNotifications(nd.notifications || []);
      }
    } catch (e) {
      console.error('Dashboard fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Chart data ────────────────────────────────────────────────────────────
  const trendData = DOW.map((day, i) => {
    const found = analytics?.dayOfWeekTrend?.find((d: any) => d._id === i + 1);
    return { day, completed: found?.count || 0 };
  });

  const statusPieData = (analytics?.tasksByStatus || []).map((s: any) => ({
    name: s._id?.replace(/_/g, ' ') || 'unknown',
    value: s.count,
  }));

  const PIE_COLORS = ['#10B981','#3B82F6','#F59E0B','#F97316','#EF4444','#8B5CF6'];

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  function timeAgo(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const ACTION_COLOR: Record<string, string> = {
    task_created: 'bg-cyan-500/20 text-cyan-400', task_completed: 'bg-green-500/20 text-green-400',
    task_rejected: 'bg-red-500/20 text-red-400', login: 'bg-slate-500/20 text-slate-400',
    user_created: 'bg-purple-500/20 text-purple-400', task_updated: 'bg-blue-500/20 text-blue-400',
  };

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

  const getTasksForDay = (day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return [];
    
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return recentTasks.filter((task) => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const calendarDays = getDaysInMonth(currentDate);
  const today = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
        <p className="text-slate-400">Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {(session?.user as any)?.name?.split(' ')[0]}!
          </h1>
          <p className="text-slate-400 mt-1">Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-white hover:bg-white/5 relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-4 w-4" />
              {notifications.filter((n: any) => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notifications.filter((n: any) => !n.read).length}
                </span>
              )}
            </Button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50">
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Notifications</h3>
                    <Link href="/adminzenfix/notifications" className="text-cyan-400 text-sm hover:underline">
                      View All
                    </Link>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">No notifications</p>
                  ) : (
                    notifications.slice(0, 5).map((notif: any) => (
                      <div
                        key={notif._id}
                        className={cn(
                          'p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer',
                          !notif.read && 'bg-cyan-500/5'
                        )}
                      >
                        <p className="text-white text-sm font-medium">{notif.title}</p>
                        <p className="text-slate-400 text-xs mt-1">{notif.message}</p>
                        <p className="text-slate-500 text-xs mt-2">{timeAgo(notif.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5"
            onClick={() => fetchAll(true)} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats.totalTasks, icon: CheckSquare, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', sub: 'All time' },
          { label: 'Completed', value: stats.completedTasks, icon: Target, color: 'text-green-400 bg-green-500/10 border-green-500/20', sub: `${completionRate}% rate` },
          { label: 'Pending', value: stats.pendingTasks, icon: Clock, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', sub: 'In progress / waiting' },
          { label: 'Overdue', value: stats.overdueTasks, icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20', sub: 'Past deadline' },
        ].map((card) => (
          <div key={card.label} className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
            <p className="text-slate-400 text-sm mt-1">{card.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Admin extras */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            <p className="text-slate-400 text-sm mt-1">Total Users</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{completionRate}%</p>
            <p className="text-slate-400 text-sm mt-1">Completion Rate</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">
              {analytics?.teamEfficiency?.length > 0
                ? Math.round(analytics.teamEfficiency.reduce((s: number, i: any) => s + i.efficiency, 0) / analytics.teamEfficiency.length)
                : 0}%
            </p>
            <p className="text-slate-400 text-sm mt-1">Team Efficiency</p>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion trend */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-5">Weekly Completion Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="completed" stroke="#06B6D4" strokeWidth={2}
                fill="url(#dashGrad)" name="Completed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-5">Task Status Breakdown</h3>
          {statusPieData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-slate-500 text-sm">No task data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {statusPieData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [v, n]} />
                <Legend formatter={(v) => (
                  <span style={{ color: '#94a3b8', fontSize: 11, textTransform: 'capitalize' }}>{v}</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick actions for admin */}
      {userRole === 'admin' && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Quick Actions</h3>
            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" onClick={() => {
              const data = {
                stats,
                recentTasks,
                activityLogs,
                exportedAt: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            }}>
              <Download className="h-3.5 w-3.5 mr-1" />
              Export Data
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Create Task', href: '/adminzenfix/tasks/create', icon: CheckSquare, color: 'text-cyan-400' },
              { label: 'Add User', href: '/adminzenfix/users/create', icon: Users, color: 'text-purple-400' },
              { label: 'View Reports', href: '/adminzenfix/reports', icon: TrendingUp, color: 'text-green-400' },
              { label: 'Activity Logs', href: '/adminzenfix/activity-logs', icon: Activity, color: 'text-amber-400' },
            ].map((action) => (
              <Link key={action.label} href={action.href}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-white/10 transition-all group">
                <action.icon className={cn('h-5 w-5 flex-shrink-0', action.color)} />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tasks + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">Recent Tasks</h3>
            <Link href="/adminzenfix/tasks">
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 -mr-2">
                View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentTasks.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No tasks yet</p>
            ) : (
              recentTasks.map((task) => (
                <Link key={task._id} href={`/adminzenfix/tasks/${task._id}`}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/8 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {task.title[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-cyan-300 transition-colors">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : 'No deadline'}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 capitalize',
                    task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
                    task.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-slate-500/10 text-slate-400'
                  )}>
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Activity feed (admin only) or Upcoming deadlines */}
        {userRole === 'admin' ? (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" /> Live Activity
              </h3>
              <Link href="/adminzenfix/activity-logs">
                <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 -mr-2">
                  View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No recent activity</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log._id} className="flex items-start gap-3">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 capitalize',
                      ACTION_COLOR[log.action] || 'bg-slate-500/20 text-slate-400'
                    )}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">
                        <span className="text-white font-medium">{log.user?.name || 'Unknown'}</span>
                        {' · '}{log.entity}
                      </p>
                      <p className="text-xs text-slate-500">{timeAgo(log.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Upcoming Deadlines</h3>
              <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-2.5">
              {recentTasks.filter(t => t.deadline && new Date(t.deadline) > new Date() && t.status !== 'completed')
                .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                .slice(0, 5).map((task) => {
                  const days = Math.ceil((new Date(task.deadline).getTime() - Date.now()) / 86400000);
                  return (
                    <div key={task._id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                      <p className="text-white text-sm">{task.title}</p>
                      <span className={cn('text-xs flex-shrink-0 ml-2 font-medium',
                        days === 0 ? 'text-red-400' : days <= 2 ? 'text-yellow-400' : 'text-slate-400')}>
                        {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Section */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentDate(prev => {
                const newDate = new Date(prev);
                newDate.setMonth(prev.getMonth() - 1);
                return newDate;
              })}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowUpRight className="h-4 w-4 text-slate-400 rotate-180" />
            </button>
            <h3 className="text-lg font-semibold text-white">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={() => setCurrentDate(prev => {
                const newDate = new Date(prev);
                newDate.setMonth(prev.getMonth() + 1);
                return newDate;
              })}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </button>
          </div>
          <Link href="/adminzenfix/calendar">
            <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
              View Full Calendar
              <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {DOW.map((day) => (
            <div key={day} className="p-2 text-center text-xs font-medium text-slate-400">
              {day}
            </div>
          ))}
          {calendarDays.map((calendarDay, index) => {
            const isToday = calendarDay.isCurrentMonth && 
                           calendarDay.day === today.getDate() && 
                           currentDate.getMonth() === today.getMonth() &&
                           currentDate.getFullYear() === today.getFullYear();
            
            const dayTasks = getTasksForDay(calendarDay.day, calendarDay.isCurrentMonth);
            
            return (
              <div
                key={index}
                className={cn(
                  'min-h-[80px] p-2 border border-white/5 rounded-lg transition-colors',
                  !calendarDay.isCurrentMonth && 'bg-slate-950/30',
                  calendarDay.isCurrentMonth && 'hover:bg-white/5'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isToday
                        ? 'w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                        : calendarDay.isCurrentMonth
                        ? 'text-white'
                        : 'text-slate-600'
                    )}
                  >
                    {calendarDay.day}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task._id}
                      className={cn(
                        'px-1.5 py-0.5 rounded text-xs truncate cursor-pointer',
                        task.priority === 'high' || task.priority === 'critical'
                          ? 'bg-red-500/10 text-red-400'
                          : task.priority === 'medium'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-cyan-500/10 text-cyan-400'
                      )}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="text-xs text-slate-500">+{dayTasks.length - 2} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

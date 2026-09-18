'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckSquare, Clock, AlertCircle, TrendingUp, Users,
  Calendar, ArrowUpRight, Activity, Target, Zap, Award,
  RefreshCw, Bell, Video, Users as UsersIcon,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useDashboard, useTodayTasks, usePendingTasks, useOverdueTasks, usePendingPreviousTasks, useUnreadNotifications, useNotificationCount, useMyActivityLogs } from '@/lib/hooks';
import { api, apiEndpoints } from '@/lib/api';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#10B981',
};
const STATUS_COLORS: Record<string, string> = {
  completed: '#10B981', in_progress: '#3B82F6', pending: '#F59E0B',
  overdue: '#EF4444', rejected: '#EF4444',
};
const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', color: '#fff', fontSize: 12,
};
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, initialized, isAuthenticated } = useAuth();
  const { data: dashboardData, loading: dashboardLoading, refetch: refetchDashboard } = useDashboard();
  const { data: todayTasks, loading: todayLoading } = useTodayTasks();
  const { data: pendingTasks, loading: pendingLoading } = usePendingTasks();
  const { data: overdueTasks, loading: overdueLoading } = useOverdueTasks();
  const { data: pendingPreviousTasks, loading: pendingPreviousLoading } = usePendingPreviousTasks();
  const { data: notifications, loading: notificationsLoading } = useUnreadNotifications();
  const { data: notificationCount, loading: countLoading } = useNotificationCount();
  const { data: activityLogs, loading: activityLoading } = useMyActivityLogs();

  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only redirect after auth initialization completes and user is not authenticated
    if (initialized && !isAuthenticated) {
      router.push('/adminzenfix/login');
    }
  }, [initialized, isAuthenticated, router]);

  const userRole = user?.role || 'employee';

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        refetchDashboard(),
      ]);
    } catch (err) {
      setError('Failed to refresh dashboard data');
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const loading = authLoading || dashboardLoading || todayLoading || pendingLoading || overdueLoading || pendingPreviousLoading || notificationsLoading || countLoading || activityLoading;

  // Computed stats from dashboard data
  const stats = dashboardData || {
    total_clients: 0,
    total_users: 0,
    total_monthly_target: 0,
    videos_completed: 0,
    videos_remaining: 0,
    videos_posted: 0,
    pending_tasks: 0,
    overdue_tasks: 0,
    waiting_approval: 0,
    client_progress: [],
  };

  // Chart data
  const trendData = DOW.map((day) => {
    return { day, completed: 0 };
  });

  const statusPieData = [
    { name: 'Completed', value: stats.videos_completed || 0 },
    { name: 'In Progress', value: stats.pending_tasks || 0 },
    { name: 'Pending', value: pendingTasks?.length || 0 },
    { name: 'Overdue', value: stats.overdue_tasks || 0 },
  ];

  const PIE_COLORS = ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6'];

  const completionRate = stats.total_monthly_target > 0
    ? Math.round((stats.videos_completed / stats.total_monthly_target) * 100) : 0;

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
    video_submitted: 'bg-amber-500/20 text-amber-400', video_approved: 'bg-green-500/20 text-green-400',
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
    const allTasks = [...(todayTasks || []), ...(pendingTasks || []), ...(overdueTasks || [])];
    return allTasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const calendarDays = getDaysInMonth(currentDate);
  const today = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.first_name || user?.username?.split('@')[0]}!
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
              {notificationCount?.unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notificationCount.unread}
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
                  {(!notifications || notifications.length === 0) ? (
                    <p className="text-slate-400 text-sm text-center py-4">No notifications</p>
                  ) : (
                    (notifications || []).slice(0, 5).map((notif: any) => (
                      <div
                        key={notif.id}
                        className={cn(
                          'p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer',
                          !notif.read && 'bg-cyan-500/5'
                        )}
                      >
                        <p className="text-white text-sm font-medium">{notif.title}</p>
                        <p className="text-slate-400 text-xs mt-1">{notif.message}</p>
                        <p className="text-slate-500 text-xs mt-2">{timeAgo(notif.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5"
            onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: stats.total_clients, icon: UsersIcon, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', sub: 'Active clients' },
          { label: 'Videos Completed', value: stats.videos_completed, icon: Video, color: 'text-green-400 bg-green-500/10 border-green-500/20', sub: `${completionRate}% rate` },
          { label: 'Pending Tasks', value: pendingTasks?.length || stats.pending_tasks || 0, icon: Clock, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', sub: 'In progress / waiting' },
          { label: 'Overdue Tasks', value: overdueTasks?.length || stats.overdue_tasks || 0, icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20', sub: 'Past deadline' },
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

      {/* Role-specific additional cards */}
      {userRole === 'owner' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_users}</p>
            <p className="text-slate-400 text-sm mt-1">Total Users</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.videos_posted}</p>
            <p className="text-slate-400 text-sm mt-1">Videos Posted</p>
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{stats.waiting_approval}</p>
            <p className="text-slate-400 text-sm mt-1">Waiting Approval</p>
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
          {statusPieData.filter(d => d.value > 0).length === 0 ? (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-slate-500 text-sm">No task data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPieData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {statusPieData.filter(d => d.value > 0).map((_: any, i: number) => (
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

      {/* Quick actions for owner */}
      {userRole === 'owner' && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Create Task', href: '/adminzenfix/tasks/create', icon: CheckSquare, color: 'text-cyan-400' },
              { label: 'Add Client', href: '/adminzenfix/clients/create', icon: Users, color: 'text-purple-400' },
              { label: 'View Reports', href: '/adminzenfix/analytics', icon: TrendingUp, color: 'text-green-400' },
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

      {/* Pending from previous days */}
      {pendingPreviousTasks && pendingPreviousTasks.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              Pending from Previous Days
            </h3>
            <span className="text-red-400 text-sm font-medium">{pendingPreviousTasks.length} tasks</span>
          </div>
          <div className="space-y-2">
            {pendingPreviousTasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {task.title[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.client_name || 'No client'} · {task.task_type_name}</p>
                  </div>
                </div>
                <span className="text-xs text-red-400 font-medium">
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tasks + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent tasks */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white">Today's Tasks</h3>
            <Link href="/adminzenfix/tasks">
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 -mr-2">
                View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2.5">
            {(!todayTasks || todayTasks.length === 0) ? (
              <p className="text-slate-500 text-sm text-center py-8">No tasks for today</p>
            ) : (
              (todayTasks || []).slice(0, 6).map((task: any) => (
                <Link key={task.id} href={`/adminzenfix/tasks/${task.id}`}
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
                        {task.client_name || 'No client'} · {task.task_type_name}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 capitalize',
                    task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                    task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
                    task.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                    task.is_overdue ? 'bg-red-500/10 text-red-400' :
                    'bg-slate-500/10 text-slate-400'
                  )}>
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" /> Recent Activity
            </h3>
            <Link href="/adminzenfix/activity-logs">
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 -mr-2">
                View All <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {(!activityLogs || activityLogs.length === 0) ? (
              <p className="text-slate-500 text-sm text-center py-8">No recent activity</p>
            ) : (
              (activityLogs || []).slice(0, 6).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 mt-0.5 capitalize',
                    ACTION_COLOR[log.action] || 'bg-slate-500/20 text-slate-400'
                  )}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 truncate">
                      <span className="text-white font-medium">{log.user_name || 'Unknown'}</span>
                      {' · '}{log.entity_name}
                    </p>
                    <p className="text-xs text-slate-500">{timeAgo(log.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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
                  {dayTasks.slice(0, 2).map((task: any) => (
                    <div
                      key={task.id}
                      className={cn(
                        'px-1.5 py-0.5 rounded text-xs truncate cursor-pointer',
                        task.priority === 'urgent' || task.priority === 'high'
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
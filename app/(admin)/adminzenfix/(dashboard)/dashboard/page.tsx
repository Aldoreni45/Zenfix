'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ArrowUpRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    totalUsers: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const userRole = (session?.user as any)?.role || 'worker';
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/tasks'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setRecentTasks(tasksData.tasks?.slice(0, 5) || []);
        
        // Filter upcoming deadlines
        const now = new Date();
        const upcoming = tasksData.tasks
          ?.filter((task: any) => task.deadline && new Date(task.deadline) > now && task.status !== 'completed')
          .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
          .slice(0, 5) || [];
        setUpcomingDeadlines(upcoming);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, trend, icon: Icon, color }: any) => (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border', color)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          trend === 'up' ? 'text-green-400' : 'text-red-400'
        )}>
          {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {change}
        </div>
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-slate-400 text-sm">{title}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Welcome back, {(session?.user as any)?.name}!
        </h1>
        <p className="text-slate-400">
          Here's what's happening with your tasks today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          change="+12.5%"
          trend="up"
          icon={CheckSquare}
          color="text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
        />
        <StatCard
          title="Completed"
          value={stats.completedTasks}
          change="+8.2%"
          trend="up"
          icon={CheckSquare}
          color="text-green-400 bg-green-500/10 border-green-500/20"
        />
        <StatCard
          title="Pending"
          value={stats.pendingTasks}
          change="-3.1%"
          trend="down"
          icon={Clock}
          color="text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
        />
        <StatCard
          title="Overdue"
          value={stats.overdueTasks}
          change="+2.4%"
          trend="up"
          icon={AlertCircle}
          color="text-red-400 bg-red-500/10 border-red-500/20"
        />
      </div>

      {/* Admin/Manager Only Stats */}
      {userRole !== 'worker' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userRole === 'admin' && (
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              change="+5.0%"
              trend="up"
              icon={Users}
              color="text-purple-400 bg-purple-500/10 border-purple-500/20"
            />
          )}
          <StatCard
            title="Team Performance"
            value={stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) + '%' : '0%'}
            change={stats.totalTasks > 0 ? '+' + Math.round((stats.completedTasks / stats.totalTasks) * 10) + '%' : '+0%'}
            trend="up"
            icon={TrendingUp}
            color="text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
          />
        </div>
      )}

      {/* Manager Quick Actions */}
      {userRole === 'manager' && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 justify-start" asChild>
              <a href="/adminzenfix/tasks">
                <CheckSquare className="h-4 w-4 mr-2" />
                View All Tasks
              </a>
            </Button>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 justify-start" asChild>
              <a href="/adminzenfix/analytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </a>
            </Button>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 justify-start" asChild>
              <a href="/adminzenfix/activity-logs">
                <Clock className="h-4 w-4 mr-2" />
                Activity Logs
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Manager Team Overview */}
      {userRole === 'manager' && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Your Team Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-sm">Assigned Tasks</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalTasks}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.completedTasks}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Recent Tasks</h2>
          <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300" asChild>
            <a href="/adminzenfix/tasks">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
        
        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No recent tasks</p>
          ) : (
            recentTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {task.title[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">{task.title}</p>
                    <p className="text-sm text-slate-400">
                      {task.deadline ? `Due ${new Date(task.deadline).toLocaleDateString()}` : 'No deadline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border',
                    task.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    task.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    task.status === 'pending' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  )}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <button className="p-2 hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Upcoming Deadlines</h2>
          <Calendar className="h-5 w-5 text-slate-400" />
        </div>
        
        <div className="space-y-3">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No upcoming deadlines</p>
          ) : (
            upcomingDeadlines.map((task) => {
              const daysUntil = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="text-white font-medium">{task.title}</p>
                    <p className="text-sm text-slate-400">
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                    </p>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border',
                    task.priority === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                    'bg-green-500/10 text-green-400 border-green-500/20'
                  )}>
                    {task.priority}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

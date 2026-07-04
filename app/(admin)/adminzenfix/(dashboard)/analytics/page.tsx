'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, AlertCircle, Download, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }

    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalTasks = analytics?.teamEfficiency?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
  const completedTasks = analytics?.teamEfficiency?.reduce((sum: number, item: any) => sum + item.completed, 0) || 0;
  const pendingTasks = totalTasks - completedTasks;
  const avgEfficiency = analytics?.teamEfficiency?.length > 0 
    ? Math.round(analytics.teamEfficiency.reduce((sum: number, item: any) => sum + item.efficiency, 0) / analytics.teamEfficiency.length)
    : 0;

  const stats = [
    {
      title: 'Total Tasks',
      value: totalTasks.toString(),
      change: '+0%',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'cyan',
    },
    {
      title: 'Completed',
      value: completedTasks.toString(),
      change: '+0%',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Pending',
      value: pendingTasks.toString(),
      change: '+0%',
      trend: 'down' as const,
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Efficiency',
      value: `${avgEfficiency}%`,
      change: '+0%',
      trend: 'up' as const,
      icon: AlertCircle,
      color: 'red',
    },
  ];

  const teamPerformance = analytics?.teamEfficiency?.map((item: any) => ({
    name: item.name,
    tasks: item.total,
    completed: item.completed,
    efficiency: Math.round(item.efficiency),
  })) || [];

  const departmentStats = analytics?.tasksByDepartment?.map((item: any) => ({
    name: item._id || 'Unknown',
    tasks: item.count,
    completed: Math.floor(item.count * 0.8),
    efficiency: 85 + Math.floor(Math.random() * 10),
  })) || [];

  // Map day of week numbers to names (MongoDB uses 1=Sunday, 7=Saturday)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const completionTrendData = dayNames.map((day, index) => {
    const dayData = analytics?.dayOfWeekTrend?.find((item: any) => item._id === index + 1);
    return {
      day,
      count: dayData?.count || 0,
    };
  });

  const maxCount = Math.max(...completionTrendData.map((d: any) => d.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
            green: 'text-green-400 bg-green-500/10 border-green-500/20',
            yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
            red: 'text-red-400 bg-red-500/10 border-red-500/20',
          }[stat.color];

          return (
            <div
              key={stat.title}
              className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center border', colorClasses)}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                )}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-slate-400 text-sm">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Task Completion Trend</h3>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {completionTrendData.map((item: any) => {
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
        </div>

        {/* Department Performance */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Department Performance</h3>
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <Calendar className="h-4 w-4 mr-2" />
              This Month
            </Button>
          </div>
          <div className="space-y-4">
            {departmentStats.map((dept: any) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-medium">{dept.name}</span>
                  <span className="text-slate-400">{dept.efficiency}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${dept.efficiency}%` }}
                  />
                </div>
              </div>
            ))}
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
                <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance.map((member: any) => (
                <tr key={member.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <span className="text-white font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300">{member.tasks}</td>
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
                  <td className="p-4">
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
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
  Cell
} from 'recharts';
import { Download, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COLORS = ['#06B6D4', '#2563EB', '#7C3AED', '#F59E0B', '#10B981'];

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
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

  const handleExport = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        
        // Create CSV content
        let csvContent = 'Department,Total Tasks,Completed,Pending,Overdue,Efficiency\n';
        
        if (data.teamEfficiency && Array.isArray(data.teamEfficiency)) {
          data.teamEfficiency.forEach((item: any) => {
            csvContent += `${item.department || 'N/A'},${item.total},${item.completed},${item.total - item.completed},0,${Math.round(item.efficiency)}%\n`;
          });
        }
        
        // Add summary
        const totalTasks = data.teamEfficiency?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
        const completedTasks = data.teamEfficiency?.reduce((sum: number, item: any) => sum + item.completed, 0) || 0;
        csvContent += `\nSummary\nTotal Tasks,${totalTasks}\nCompleted,${completedTasks}\nPending,${totalTasks - completedTasks}\n`;
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  const taskData = analytics?.dayOfWeekTrend?.map((item: any) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      name: dayNames[item._id - 1] || 'Unknown',
      completed: item.count,
      pending: 0,
      overdue: 0,
    };
  }) || [];

  const departmentData = analytics?.tasksByDepartment?.map((item: any) => ({
    name: item._id || 'Unknown',
    value: item.count,
  })) || [];

  const performanceData = analytics?.teamEfficiency?.map((item: any) => ({
    name: item.name,
    efficiency: Math.round(item.efficiency),
  })) || [];

  const totalTasks = analytics?.teamEfficiency?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;
  const completedTasks = analytics?.teamEfficiency?.reduce((sum: number, item: any) => sum + item.completed, 0) || 0;
  const pendingTasks = totalTasks - completedTasks;
  const avgEfficiency = analytics?.teamEfficiency?.length > 0 
    ? Math.round(analytics.teamEfficiency.reduce((sum: number, item: any) => sum + item.efficiency, 0) / analytics.teamEfficiency.length)
    : 0;

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
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 mt-1">Track performance and generate insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
            <Calendar className="h-4 w-4 mr-2" />
            {timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : 'This Year'}
          </Button>
          <Button className="bg-gradient-to-r from-electric-cyan to-purple" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Total Tasks</span>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{totalTasks}</p>
          <p className="text-sm text-gray-400 mt-2">All time</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Completed</span>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">{completedTasks}</p>
          <p className="text-sm text-gray-400 mt-2">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completion rate</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Pending</span>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white">{pendingTasks}</p>
          <p className="text-sm text-gray-400 mt-2">{totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}% pending</p>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Efficiency</span>
            <TrendingUp className="h-4 w-4 text-electric-cyan" />
          </div>
          <p className="text-3xl font-bold text-white">{avgEfficiency}%</p>
          <p className="text-sm text-gray-400 mt-2">Team average</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Chart */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Task Completion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="completed" fill="#06B6D4" name="Completed" />
              <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              <Bar dataKey="overdue" fill="#EF4444" name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Distribution */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Tasks by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Trend */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-xl font-bold text-white mb-6">Team Efficiency Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#94A3B8" />
              <YAxis stroke="#94A3B8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="efficiency" 
                stroke="#06B6D4" 
                strokeWidth={2}
                dot={{ fill: '#06B6D4' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Report Table */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Detailed Report</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-gray-400">Department</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Total Tasks</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Completed</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Pending</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Overdue</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.teamEfficiency?.map((item: any, i: number) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="p-4 text-white">{item.department}</td>
                  <td className="p-4 text-gray-300">{item.total}</td>
                  <td className="p-4 text-green-400">{item.completed}</td>
                  <td className="p-4 text-yellow-400">{item.total - item.completed}</td>
                  <td className="p-4 text-red-400">0</td>
                  <td className="p-4">
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      item.efficiency >= 85 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    )}>
                      {Math.round(item.efficiency)}%
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

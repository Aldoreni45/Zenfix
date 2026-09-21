'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Calendar, Clock, AlertCircle, CheckCircle, ArrowUpRight, RefreshCw, Loader2, Link2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTodayTasks, usePendingTasks, useOverdueTasks, usePendingPreviousTasks, useMyTasks, useCanManage } from '@/lib/hooks';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDueDate, todayLocalISO } from '@/lib/date-utils';

function TaskCardSkeleton() {
  return (
    <div className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
          </div>
          <div className="h-5 w-3/4 rounded bg-white/10 animate-pulse mb-2" />
          <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
        </div>
        <div className="h-6 w-16 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
        <div className="h-5 w-16 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { data: todayTasks, loading: todayLoading } = useTodayTasks();
  const { data: pendingTasks, loading: pendingLoading } = usePendingTasks();
  const { data: overdueTasks, loading: overdueLoading } = useOverdueTasks();
  const { data: pendingPreviousTasks, loading: previousLoading, refetch: refetchPrevious } = usePendingPreviousTasks();
  const { data: myTasks, loading: myTasksLoading } = useMyTasks();
  
  const canManage = useCanManage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('today');
  const [carryForwardingAll, setCarryForwardingAll] = useState(false);
  const [carryForwardDate, setCarryForwardDate] = useState('');

  const getTaskTypeColor = (taskType: string) => {
    const colors: Record<string, string> = {
      shoot_video: 'bg-cyan-500/10 text-cyan-400',
      edit_video: 'bg-purple-500/10 text-purple-400',
      review_video: 'bg-blue-500/10 text-blue-400',
      client_approval: 'bg-green-500/10 text-green-400',
      instagram_post: 'bg-pink-500/10 text-pink-400',
      general: 'bg-slate-500/10 text-slate-400',
    };
    return colors[taskType] || colors.general;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      low: 'bg-green-500/10 text-green-400 border-green-500/20',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'bg-red-500/10 text-red-400';
    const colors: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-400',
      in_progress: 'bg-blue-500/10 text-blue-400',
      pending: 'bg-yellow-500/10 text-yellow-400',
      assigned: 'bg-cyan-500/10 text-cyan-400',
      submitted: 'bg-purple-500/10 text-purple-400',
      rejected: 'bg-red-500/10 text-red-400',
      overdue: 'bg-red-500/10 text-red-400',
    };
    return colors[status] || colors.pending;
  };

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'today': return todayTasks || [];
      case 'my': return myTasks || [];
      case 'pending': return pendingTasks || [];
      case 'overdue': 
      case 'previous':
        return (overdueTasks && overdueTasks.length > 0) ? overdueTasks : (pendingPreviousTasks || []);
      default: return [];
    }
  };

  const filteredTasks = getCurrentTasks().filter((task: any) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.client_name && task.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.task_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      task.status === statusFilter || 
      (statusFilter === 'overdue' && task.is_overdue);
    
    return matchesSearch && matchesStatus;
  });

  const handleBulkCarryForward = async () => {
    if (!carryForwardDate) {
      toast.error('Please select a new due date');
      return;
    }
    setCarryForwardingAll(true);
    const res = await api.post<{ carried_count: number }>(apiEndpoints.carryForwardAllPending, {
      new_due_date: carryForwardDate,
    });
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else if (res.data) {
      toast.success(`${res.data.carried_count} task(s) carried forward to ${formatDueDate(carryForwardDate)}`);
      setCarryForwardDate('');
      refetchPrevious();
    }
    setCarryForwardingAll(false);
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'today': return todayLoading;
      case 'my': return myTasksLoading;
      case 'pending': return pendingLoading;
      case 'overdue':
      case 'previous':
        return overdueLoading || previousLoading;
      default: return false;
    }
  };
  const currentLoading = getCurrentLoading();

  const overdueCount = (overdueTasks && overdueTasks.length > 0) 
    ? overdueTasks.length 
    : (pendingPreviousTasks?.length || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-slate-400 mt-1">Manage daily tasks and workload allocation</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Link href="/adminzenfix/tasks/create">
              <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </Link>
            <Link href="/adminzenfix/tasks/bulk">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Bulk Create
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Pending from Previous Days Alert */}
      {overdueCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-white font-medium">Overdue Tasks</p>
                <p className="text-slate-400 text-sm">{overdueCount} task(s) past their due date need attention</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {canManage && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    min={todayLocalISO(new Date(Date.now() + 86400000))}
                    value={carryForwardDate}
                    onChange={(e) => setCarryForwardDate(e.target.value)}
                    className="bg-slate-800/50 border-white/10 text-white text-sm w-40"
                    placeholder="New date"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                    onClick={handleBulkCarryForward}
                    disabled={carryForwardingAll || !carryForwardDate}
                  >
                    {carryForwardingAll ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Carry Forward All
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => setActiveTab('overdue')}
              >
                View Overdue Tasks
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto">
        {[
          { id: 'today', label: "Today's Tasks", count: todayTasks?.length || 0 },
          { id: 'my', label: 'My Tasks', count: myTasks?.length || 0 },
          { id: 'pending', label: 'Pending', count: pendingTasks?.length || 0 },
          { id: 'overdue', label: 'Overdue', count: overdueCount, alert: overdueCount > 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap',
              activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:text-white'
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                'ml-2 px-2 py-0.5 rounded-full text-xs',
                tab.alert ? 'bg-red-500 text-white' :
                activeTab === tab.id ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'
              )}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-600" />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-800/50 border border-white/10 text-white rounded-lg px-4 py-2"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="submitted">Submitted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentLoading ? (
          <>
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
            <TaskCardSkeleton />
          </>
        ) : filteredTasks.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500">
              {activeTab === 'overdue' ? 'No overdue tasks - great job!' :
               activeTab === 'pending' ? 'No pending tasks' :
               activeTab === 'today' ? 'No tasks for today' :
               'No tasks found'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task: any) => (
            <Link
              key={task.id}
              href={`/adminzenfix/tasks/${task.id}`}
              className="bg-slate-900/50 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', getTaskTypeColor(task.task_type))}>
                      {task.task_type_name}
                    </span>
                    {task.is_overdue && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Overdue
                      </span>
                    )}
                    {task.carry_forward_count > 0 && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-400">
                        CF×{task.carry_forward_count}
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-medium mb-1 group-hover:text-cyan-300 transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2">{task.description || 'No description'}</p>
                </div>
                <span className={cn('px-2 py-1 rounded text-xs font-medium border capitalize', getPriorityColor(task.priority))}>
                  {task.priority_name}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className={cn('h-4 w-4', task.is_overdue ? 'text-red-400' : 'text-slate-400')} />
                  <span className={task.is_overdue ? 'text-red-400 font-medium' : 'text-slate-400'}>
                    {formatDueDate(task.due_date)}
                  </span>
                </div>
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium capitalize', getStatusColor(task.status, task.is_overdue))}>
                  {task.is_overdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'overdue' : task.status.replace(/_/g, ' ')}
                </span>
              </div>

              {task.client_name && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-slate-500 text-xs">Client: {task.client_name}</p>
                </div>
              )}

              {task.assigned_to_name && (
                <div className="mt-1">
                  <p className="text-slate-500 text-xs">Assigned: {task.assigned_to_name}</p>
                </div>
              )}

              {task.status === 'completed' && task.drive_link && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-3 w-3 text-green-400 shrink-0" />
                    {/* span (role=link) instead of <a>: this lives inside the card's
                        outer <Link>, and nesting an <a> inside an <a> is invalid HTML
                        that breaks hydration. */}
                    <span
                      role="link"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(task.drive_link, '_blank', 'noopener,noreferrer');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(task.drive_link, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="text-green-400 text-xs hover:underline truncate cursor-pointer"
                    >
                      {task.drive_link}
                    </span>
                  </div>
                  {task.completion_notes && (
                    <div className="flex items-start gap-1.5 mt-1">
                      <FileText className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-slate-400 text-xs line-clamp-2">{task.completion_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))
        )}
      </div>

      {/* Quick Actions for Managers */}
      {canManage && (
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/adminzenfix/tasks/bulk" className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-white text-sm">Bulk Create</span>
            </Link>
            <Link href="/adminzenfix/tasks/carry-forward" className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
              <Clock className="h-5 w-5 text-yellow-400" />
              <span className="text-white text-sm">Carry Forward</span>
            </Link>
            <Link href="/adminzenfix/calendar" className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all">
              <Calendar className="h-5 w-5 text-purple-400" />
              <span className="text-white text-sm">Calendar View</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, User, Calendar,
  Play, CheckCircle2, XCircle, Loader2, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function getStatusColor(status: string, isOverdue: boolean) {
  if (isOverdue) return 'bg-red-500/10 text-red-400 border-red-500/20';
  const colors: Record<string, string> = {
    completed: 'bg-green-500/10 text-green-400 border-green-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    assigned: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    waiting_approval: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = String(params.id);
  const { user } = useAuth();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchTask = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const res = await api.get<any>(apiEndpoints.task(Number(taskId)));
    if (res.error) {
      setFetchError(extractApiErrorMessage(res));
    } else if (res.data) {
      setTask(res.data);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  const runAction = async (action: () => Promise<any>, successMessage: string) => {
    setActing(true);
    const res = await action();
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success(successMessage);
      await fetchTask();
    }
    setActing(false);
  };

  const handleStart = () =>
    runAction(() => api.post(apiEndpoints.startTask(Number(taskId)), {}), 'Task started');

  const handleComplete = () =>
    runAction(() => api.post(apiEndpoints.completeTask(Number(taskId)), { notes: 'Task completed' }), 'Task completed');

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    setActing(true);
    const res = await api.post(apiEndpoints.rejectTask(Number(taskId)), { reason: rejectReason.trim() });
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success('Task rejected');
      setRejectReason('');
      setRejecting(false);
      await fetchTask();
    }
    setActing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-slate-400 text-center max-w-sm">{fetchError}</p>
        <Button onClick={fetchTask} className="bg-cyan-500 hover:bg-cyan-600">
          Retry
        </Button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Task not found</p>
      </div>
    );
  }

  const canManage = user?.role === 'owner' || user?.role === 'manager';
  const isAssignee = !canManage && task.assigned_to !== undefined && task.assigned_to === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/adminzenfix/tasks">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
                {task.task_id}
              </span>
              {task.task_type_name && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize">
                  {task.task_type_name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 break-words">{task.title}</h1>
            {task.description && (
              <p className="text-slate-400 whitespace-pre-wrap">{task.description}</p>
            )}
          </div>
          <span className={cn('px-3 py-1 rounded-full text-sm font-medium capitalize border shrink-0', getStatusColor(task.status, task.is_overdue))}>
            {task.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Assigned To</p>
              <p className="text-white text-sm truncate">{task.assigned_to_name || 'Unassigned'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Due Date</p>
              <p className="text-white text-sm">
                {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Priority</p>
              <p className="text-white text-sm capitalize">{task.priority_name || task.priority}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Client</p>
              <p className="text-white text-sm truncate">{task.client_name || '—'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {(isAssignee || canManage) && task.status === 'pending' && (
            <Button onClick={handleStart} disabled={acting} className="bg-cyan-500 hover:bg-cyan-600">
              <Play className="h-4 w-4 mr-2" />
              Start Task
            </Button>
          )}
          {(isAssignee || canManage) && ['assigned', 'in_progress'].includes(task.status) && (
            <Button onClick={handleComplete} disabled={acting} className="bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Task
            </Button>
          )}
          {(isAssignee || canManage) && ['in_progress', 'completed', 'waiting_approval'].includes(task.status) && !rejecting && (
            <Button onClick={() => setRejecting(true)} disabled={acting} variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
              <XCircle className="h-4 w-4 mr-2" />
              Mark Not Complete
            </Button>
          )}
          {canManage && (task.status === 'completed' || task.status === 'waiting_approval') && (
            <Button onClick={() => setRejecting(true)} disabled={acting} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          )}
        </div>

        {/* Reject form */}
        {rejecting && (
          <div className="mt-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
            <label htmlFor="reject-reason" className="block text-sm text-slate-300 mb-2">
              Reason for rejection
            </label>
            <div className="flex gap-3">
              <input
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Required — explain what needs to change"
                className="flex-1 h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <Button onClick={handleReject} disabled={acting} className="bg-orange-500 hover:bg-orange-600">
                <XCircle className="h-4 w-4 mr-2" />
                Confirm
              </Button>
              <Button variant="ghost" onClick={() => setRejecting(false)} className="text-slate-400">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {task.rejection_reason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1">Rejection Reason</h3>
          <p className="text-slate-300 text-sm">{task.rejection_reason}</p>
        </div>
      )}

      {task.notes && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1">Notes</h3>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">{task.notes}</p>
        </div>
      )}
    </div>
  );
}
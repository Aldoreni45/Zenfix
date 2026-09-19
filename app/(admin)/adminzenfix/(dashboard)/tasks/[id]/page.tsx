'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Clock, User, Calendar, Link2, FileText, RefreshCw,
  Play, CheckCircle2, XCircle, Loader2, AlertTriangle, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    submitted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return colors[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}

function getDaysUntilDue(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)} day(s) overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays} day(s)`;
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
  const [completing, setCompleting] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [carryingForward, setCarryingForward] = useState(false);
  const [carryForwardDate, setCarryForwardDate] = useState('');
  const [carryForwarding, setCarryForwarding] = useState(false);

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

  const handleComplete = async () => {
    if (!driveLink.trim()) {
      toast.error('Drive link is required to complete a task');
      return;
    }
    setActing(true);
    const res = await api.post(apiEndpoints.completeTask(Number(taskId)), {
      drive_link: driveLink.trim(),
      completion_notes: completionNotes.trim(),
    });
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success('Task completed');
      setCompleting(false);
      setDriveLink('');
      setCompletionNotes('');
      await fetchTask();
    }
    setActing(false);
  };

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

  const handleCarryForward = async () => {
    if (!carryForwardDate) {
      toast.error('Please select a new due date');
      return;
    }
    setCarryForwarding(true);
    const res = await api.post(apiEndpoints.carryForwardTask(Number(taskId)), {
      new_due_date: carryForwardDate,
    });
    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success('Task carried forward successfully');
      setCarryingForward(false);
      setCarryForwardDate('');
      await fetchTask();
    }
    setCarryForwarding(false);
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
  const isAssignee = Boolean(
    (
      task?.assigned_to != null &&
      user?.id != null &&
      (
        task.assigned_to === user.id ||
        String(task.assigned_to) === String(user.id) ||
        (typeof task.assigned_to === 'object' && (task.assigned_to.id === user.id || String(task.assigned_to.id) === String(user.id)))
      )
    ) ||
    (
      user != null &&
      task?.assigned_to_name &&
      (
        user.full_name?.trim().toLowerCase() === task.assigned_to_name?.trim().toLowerCase() ||
        user.username?.trim().toLowerCase() === task.assigned_to_name?.trim().toLowerCase()
      )
    )
  );
  const isOverdue = task.is_overdue;
  const isOpen = ['pending', 'assigned', 'in_progress', 'blocked', 'submitted', 'rejected'].includes(task.status);
  // ONLY the assigned employee can start and complete tasks
  const canStart = isAssignee && isOpen && ['pending', 'assigned', 'rejected'].includes(task.status);
  const canComplete = isAssignee && isOpen && ['pending', 'assigned', 'in_progress', 'submitted', 'rejected'].includes(task.status);
  const canCarryForward = canManage && isOpen;
  const canReject = canManage && ['in_progress', 'completed', 'waiting_approval', 'submitted'].includes(task.status);
  const dueDateInfo = getDaysUntilDue(task.due_date);

  // Debug logging
  console.log('[TASK DETAIL DEBUG]', {
    'user.id': user?.id, 'user.role': user?.role, 'user.full_name': user?.full_name,
    'task.assigned_to': task?.assigned_to, 'task.assigned_to_name': task?.assigned_to_name,
    'task.status': task?.status,
    isAssignee, isOpen, canStart, canComplete, canManage,
    'type_assigned_to': typeof task?.assigned_to, 'type_user_id': typeof user?.id,
  });

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
              {isOverdue && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  OVERDUE
                </span>
              )}
              {task.carry_forward_count > 0 && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Carried forward {task.carry_forward_count}x
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 break-words">{task.title}</h1>
            {task.description && (
              <p className="text-slate-400 whitespace-pre-wrap">{task.description}</p>
            )}
          </div>
          <span className={cn('px-3 py-1 rounded-full text-sm font-medium capitalize border shrink-0', getStatusColor(task.status, isOverdue))}>
            {isOverdue && task.status !== 'completed' && task.status !== 'cancelled' ? 'Overdue' : task.status.replace(/_/g, ' ')}
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
              <p className={cn('text-sm', isOverdue ? 'text-red-400 font-medium' : 'text-white')}>
                {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString() : '—'}
              </p>
              {dueDateInfo && (
                <p className={cn('text-xs', isOverdue ? 'text-red-400' : 'text-slate-500')}>
                  {dueDateInfo}
                </p>
              )}
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
        <div className="flex flex-wrap gap-3 items-center">
          {canStart && (
            <Button onClick={handleStart} disabled={acting} className="bg-cyan-500 hover:bg-cyan-600">
              <Play className="h-4 w-4 mr-2" />
              Start Task
            </Button>
          )}
          {canComplete && !completing && (
            <Button onClick={() => setCompleting(true)} disabled={acting} className="bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Task
            </Button>
          )}
          {canManage && canCarryForward && !carryingForward && (
            <Button onClick={() => setCarryingForward(true)} disabled={acting} variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
              <RefreshCw className="h-4 w-4 mr-2" />
              Carry Forward
            </Button>
          )}
          {canReject && !rejecting && (
            <Button onClick={() => setRejecting(true)} disabled={acting} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          )}
          {canManage && !isAssignee && task.assigned_to && ['pending', 'assigned', 'in_progress'].includes(task.status) && (
            <span className="text-xs text-slate-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-cyan-400" />
              Assigned to {task.assigned_to_name || 'employee'} (only assignee can start & complete)
            </span>
          )}
          {canManage && !task.assigned_to && (
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Unassigned — Assign to an employee so they can start work
            </span>
          )}
        </div>

        {/* Complete form with drive link requirement */}
        {completing && (
          <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-3">
            <p className="text-sm text-slate-300 font-medium">Complete Task</p>
            <div className="space-y-2">
              <label htmlFor="drive-link" className="text-xs text-slate-400 flex items-center gap-1.5">
                <Link2 className="h-3 w-3" /> Google Drive Link <span className="text-red-400">*</span>
              </label>
              <input
                id="drive-link"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="completion-notes" className="text-xs text-slate-400 flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Completion Notes
              </label>
              <textarea
                id="completion-notes"
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Optional notes about the completed work..."
                rows={2}
                className="w-full rounded-xl bg-slate-800/50 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleComplete} disabled={acting || !driveLink.trim()} className="bg-green-500 hover:bg-green-600">
                {acting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Confirm Complete
              </Button>
              <Button variant="ghost" onClick={() => { setCompleting(false); setDriveLink(''); setCompletionNotes(''); }} className="text-slate-400">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Carry Forward form */}
        {carryingForward && (
          <div className="mt-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl space-y-3">
            <p className="text-sm text-slate-300 font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-orange-400" />
              Carry Forward Task
            </p>
            <p className="text-xs text-slate-500">
              Move this task to a new due date. Current due: {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString() : 'None'}
            </p>
            <div className="space-y-2">
              <Label htmlFor="carry-forward-date" className="text-slate-400 text-xs">New Due Date <span className="text-red-400">*</span></Label>
              <Input
                id="carry-forward-date"
                type="date"
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                value={carryForwardDate}
                onChange={(e) => setCarryForwardDate(e.target.value)}
                className="bg-slate-800/50 border-white/10 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCarryForward} disabled={carryForwarding || !carryForwardDate} className="bg-orange-500 hover:bg-orange-600">
                {carryForwarding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Confirm Carry Forward
              </Button>
              <Button variant="ghost" onClick={() => { setCarryingForward(false); setCarryForwardDate(''); }} className="text-slate-400">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reject form */}
        {rejecting && (
          <div className="mt-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
            <p className="text-sm text-slate-300 font-medium">Reject Task</p>
            <div className="space-y-2">
              <label htmlFor="reject-reason" className="text-xs text-slate-400">
                Reason for rejection <span className="text-red-400">*</span>
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what needs to change..."
                rows={2}
                className="w-full rounded-xl bg-slate-800/50 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReject} disabled={acting || !rejectReason.trim()} className="bg-red-500 hover:bg-red-600">
                <XCircle className="h-4 w-4 mr-2" />
                Confirm Reject
              </Button>
              <Button variant="ghost" onClick={() => { setRejecting(false); setRejectReason(''); }} className="text-slate-400">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {task.rejection_reason && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            Rejection Reason
          </h3>
          <p className="text-slate-300 text-sm">{task.rejection_reason}</p>
          <p className="text-slate-500 text-xs mt-2">Rejected {task.rejection_count} time(s)</p>
        </div>
      )}

      {task.notes && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-1">Notes</h3>
          <p className="text-slate-300 text-sm whitespace-pre-wrap">{task.notes}</p>
        </div>
      )}

      {task.status === 'completed' && (
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              </div>
              <h3 className="text-white font-semibold text-sm">Submission Details</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
              Completed
            </span>
          </div>

          {/* Meta: submitted by + submitted on */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5">
              <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Submitted by</p>
                <p className="text-white text-sm font-medium">
                  {task.submitted_by_name || task.assigned_to_name || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Submitted on</p>
                <p className="text-white text-sm font-medium">
                  {(task.submitted_at || task.completed_at)
                    ? new Date(task.submitted_at || task.completed_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Drive Link */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Drive Link</p>
            </div>
            {task.drive_link ? (
              <a
                href={task.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/15 hover:text-green-300 transition-all text-sm font-medium group max-w-full"
              >
                <Link2 className="h-4 w-4 shrink-0" />
                <span className="truncate">Open Google Drive</span>
                <span className="shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">↗</span>
              </a>
            ) : (
              <p className="text-slate-500 text-sm italic">No Drive Link</p>
            )}
          </div>

          {/* Comments / Completion Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Comments</p>
            </div>
            {task.completion_notes ? (
              <div className="px-3 py-2.5 rounded-lg bg-slate-800/60 border border-white/5">
                <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                  &ldquo;{task.completion_notes}&rdquo;
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">No Comments</p>
            )}
          </div>
        </div>
      )}

      {/* Task metadata */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-3">Task Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Created By</p>
            <p className="text-white">{task.created_by_name || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Manager</p>
            <p className="text-white">{task.assigned_manager_name || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Estimated Hours</p>
            <p className="text-white">{task.estimated_hours || '—'}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Actual Hours</p>
            <p className="text-white">{task.actual_hours || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

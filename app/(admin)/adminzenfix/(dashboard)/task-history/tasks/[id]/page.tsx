'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, ArrowLeft, AlertTriangle, RefreshCw, Calendar, User as UserIcon,
  Building2, Link as LinkIcon, FileText, Plus, PlayCircle, CheckCircle2,
  XCircle, RefreshCw as RefreshCwIcon, ArrowRightCircle, Trash2, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, useUserRole, useTaskHistoryTaskDetail } from '@/lib/hooks';

const TIMELINE_META: Record<string, { icon: any; color: string }> = {
  CREATE: { icon: Plus, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  UPDATE: { icon: PlayCircle, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  SUBMIT: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  ASSIGN: { icon: ArrowRightCircle, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  STATUS_CHANGE: { icon: RefreshCwIcon, color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  REJECT: { icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  DELETE: { icon: Trash2, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  CARRY_FORWARD: { icon: Calendar, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  assigned: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  blocked: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  submitted: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function TaskHistoryTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { initialized } = useAuth();
  const userRole = useUserRole();
  const taskId = Number(params.id);
  const isOwner = initialized && userRole === 'owner';
  const { data, loading, error, refetch } = useTaskHistoryTaskDetail(taskId, isOwner);

  if (initialized && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-900/50 border border-white/10 rounded-2xl">
        <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
        <h1 className="text-xl font-bold text-white">Owner access required</h1>
        <p className="text-slate-400 text-sm mt-2">Task History is only available to the owner.</p>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-slate-900/50 border border-white/10 rounded-2xl gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-slate-400 text-sm">{error}</p>
        <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const task = data.task;
  const timeline = data.timeline || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">Task Detail</h1>
          <p className="text-slate-400 mt-1">{task.task_id} · History and activity timeline</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5 ml-auto" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-white">{task.title}</h2>
            <span className={cn('px-2.5 py-1 rounded-full text-xs capitalize border', STATUS_BADGE[task.status] || STATUS_BADGE.overdue)}>
              {task.status.replace(/_/g, ' ')}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs capitalize border bg-purple-500/10 text-purple-400 border-purple-500/20">
              {task.task_type_name}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={Building2} label="Client" value={task.client_name || '—'} />
              <InfoRow icon={LinkIcon} label="Video" value={task.video_code || '—'} />
              <InfoRow icon={FileText} label="Priority" value={task.priority_name || '—'} />
              <InfoRow icon={Calendar} label="Due date" value={task.due_date ? `${task.due_date}${task.due_time ? ` · ${task.due_time}` : ''}` : '—'} />
              <InfoRow icon={UserIcon} label="Assignee" value={task.assigned_to_name || '—'} />
              <InfoRow icon={UserIcon} label="Created by" value={task.created_by_name || '—'} />
            </div>

            {task.description && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-slate-500 uppercase mb-2">Description</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {task.completion_notes && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-slate-500 uppercase mb-2">Completion notes</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{task.completion_notes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/5 pt-4">
              <Stat label="Created" value={task.created_at ? new Date(task.created_at).toLocaleDateString() : '—'} />
              <Stat label="Started" value={task.started_at ? new Date(task.started_at).toLocaleDateString() : '—'} />
              <Stat label="Completed" value={task.submitted_at ? new Date(task.submitted_at).toLocaleDateString() : '—'} />
              <Stat label="Carried fwd" value={String(task.carry_forward_count ?? 0)} />
            </div>

            {task.drive_link && (
              <a
                href={task.drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <LinkIcon className="h-4 w-4" /> Open deliverable in Drive
              </a>
            )}
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" /> Activity Timeline
          </h3>
          {timeline.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">
              No activity recorded for this task.
              <br />
              <span className="text-xs">Review any assignment, status change or completion you perform from now on.</span>
            </p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10" />
              <div className="space-y-4">
                {timeline.map((log: any, idx: number) => {
                  const meta = TIMELINE_META[log.action] || { icon: Activity, color: 'bg-slate-500/10 text-slate-400 border-white/10' };
                  const Icon = meta.icon;
                  return (
                    <div key={log.id || idx} className="relative flex gap-4">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0 z-10', meta.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm text-white font-medium capitalize">{log.action_name}</p>
                        <p className="text-sm text-slate-300 mt-0.5">{log.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {log.user_name || 'System'} · {new Date(log.timestamp).toLocaleString()} ({timeAgo(log.timestamp)})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-white truncate">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
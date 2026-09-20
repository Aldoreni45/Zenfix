'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Target, CheckCircle2, Clock, AlertTriangle, Video,
  Camera, Edit3, Eye, ThumbsUp, Send, Lock, Unlock, Play, User,
  Calendar, BarChart3, TrendingUp, AlertCircle, ChevronDown, ChevronUp,
  Users, RefreshCw, Link2, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { api, apiEndpoints, extractApiErrorMessage, VideoProtocolDashboard, VideoRecord, VideoStage } from '@/lib/api';
import { useIsOwner, useIsManager } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const STAGE_ICONS: Record<string, any> = {
  shoot: Camera,
  edit: Edit3,
  review: Eye,
  client_approval: ThumbsUp,
  instagram_post: Send,
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  not_started: { color: 'text-slate-400', bg: 'bg-slate-500/10', label: 'Not Started' },
  shooting: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Shooting' },
  editing: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Editing' },
  in_review: { color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'In Review' },
  client_approval: { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Client Approval' },
  ready_to_post: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Ready to Post' },
  posted: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Posted' },
  blocked: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Blocked' },
};

const STAGE_STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  not_started: { color: 'text-slate-500', icon: Lock },
  in_progress: { color: 'text-cyan-400', icon: Play },
  completed: { color: 'text-green-400', icon: CheckCircle2 },
  blocked: { color: 'text-red-400', icon: AlertCircle },
  rejected: { color: 'text-orange-400', icon: AlertTriangle },
};

function StageBar({ stage, onAction, canManage, onShowDetails }: { stage: VideoStage; onAction: (action: string, stageId: number, data?: any) => void; canManage: boolean; onShowDetails?: (stageId: number) => void }) {
  const config = STAGE_STATUS_CONFIG[stage.status] || STAGE_STATUS_CONFIG.not_started;
  const Icon = config.icon;
  const StageIcon = STAGE_ICONS[stage.stage_type] || Camera;
  const isLocked = stage.is_locked;
  const isCompleted = stage.status === 'completed';
  const isInProgress = stage.status === 'in_progress';

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
      isCompleted ? "bg-green-500/5 border-green-500/20" :
      isInProgress ? "bg-cyan-500/5 border-cyan-500/20" :
      stage.status === 'rejected' ? "bg-orange-500/5 border-orange-500/20" :
      isLocked ? "bg-slate-800/30 border-slate-700/30 opacity-50" :
      "bg-slate-800/30 border-white/5"
    )}>
      <StageIcon className={cn("h-4 w-4 shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-medium truncate", config.color)}>
          {stage.stage_display}
        </p>
        {stage.assigned_to_detail ? (
          <p className="text-[10px] text-slate-500 truncate">
            {stage.assigned_to_detail.first_name} {stage.assigned_to_detail.last_name}
            {stage.due_date && (
              <span className="ml-1 text-slate-600">due {stage.due_date}</span>
            )}
          </p>
        ) : stage.due_date ? (
          <p className="text-[10px] text-slate-600 truncate">due {stage.due_date}</p>
        ) : null}
      </div>
      {isCompleted && (
        <div className="flex items-center gap-1.5 shrink-0">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <button
            className="text-[10px] text-green-400 font-medium hover:text-green-300 transition-colors"
            onClick={() => onShowDetails?.(stage.id)}
          >
            Done
          </button>
        </div>
      )}
      {!isCompleted && !isInProgress && stage.status === 'not_started' && !isLocked && canManage && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-[10px] text-cyan-400 hover:bg-cyan-500/10"
          onClick={() => onAction('assign', stage.id)}
        >
          <User className="h-3 w-3 mr-0.5" /> Assign
        </Button>
      )}
      {!isCompleted && !isInProgress && stage.status === 'not_started' && stage.assigned_to && !isLocked && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-[10px] text-cyan-400 hover:bg-cyan-500/10"
          onClick={() => onAction('start', stage.id)}
        >
          <Play className="h-3 w-3 mr-0.5" /> Start
        </Button>
      )}
      {isInProgress && (
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-[10px] text-green-400 hover:bg-green-500/10"
          onClick={() => onAction('complete', stage.id)}
        >
          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Done
        </Button>
      )}
      {isLocked && !isCompleted && (
        <Lock className="h-3 w-3 text-slate-600 shrink-0" />
      )}
    </div>
  );
}

function VideoCard({ video, users, onAction, canManage }: { video: VideoRecord; users: any[]; onAction: (action: string, stageId: number, data?: any) => void; canManage: boolean }) {
  const [expanded, setExpanded] = useState(video.current_status !== 'posted');
  const [showAssign, setShowAssign] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showReject, setShowReject] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showComplete, setShowComplete] = useState<number | null>(null);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeDriveLink, setCompleteDriveLink] = useState('');
  const [showStageDetails, setShowStageDetails] = useState<number | null>(null);

  const statusCfg = STATUS_CONFIG[video.current_status] || STATUS_CONFIG.not_started;
  const completedCount = video.stages.filter((s) => s.status === 'completed').length;

  const handleAssign = async (stageId: number) => {
    if (!selectedUser) { toast.error('Select an employee'); return; }
    setAssigning(true);
    const payload: any = { assigned_to: Number(selectedUser) };
    if (assignDueDate) payload.due_date = assignDueDate;
    await onAction('assign', stageId, payload);
    setAssigning(false);
    setShowAssign(null);
    setSelectedUser('');
    setAssignDueDate('');
  };

  const handleReject = async (stageId: number) => {
    if (!rejectReason.trim()) { toast.error('Rejection reason required'); return; }
    await onAction('reject', stageId, { rejection_reason: rejectReason });
    setShowReject(null);
    setRejectReason('');
  };

  const handleComplete = async (stageId: number) => {
    const payload: any = {};
    if (completeDriveLink.trim()) payload.drive_link = completeDriveLink.trim();
    if (completeNotes.trim()) payload.completion_notes = completeNotes.trim();
    if (completeNotes.trim()) payload.notes = completeNotes.trim();
    console.log('[VideoCard handleComplete] stageId=', stageId, 'payload=', payload, 'completeDriveLink=', completeDriveLink);
    await onAction('complete', stageId, payload);
    setShowComplete(null);
    setCompleteNotes('');
    setCompleteDriveLink('');
    // Auto-open the submission details so user can verify the drive link was saved
    setShowStageDetails(stageId);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm",
            video.current_status === 'posted' ? "bg-green-500/20 text-green-400" :
            video.current_status === 'not_started' ? "bg-slate-500/20 text-slate-400" :
            "bg-cyan-500/20 text-cyan-400"
          )}>
            {video.current_status === 'posted' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              String(video.video_number).padStart(2, '0')
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Video {String(video.video_number).padStart(2, '0')}</h3>
            <p className={cn("text-xs font-medium", statusCfg.color)}>
              {statusCfg.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{completedCount}/{video.stages.length}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div
            className={cn("h-1.5 rounded-full transition-all", video.current_status === 'posted' ? "bg-green-500" : "bg-cyan-500")}
            style={{ width: `${video.completion_percentage}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {video.stages.map((stage) => (
            <div key={stage.id}>
              <StageBar stage={stage} canManage={canManage} onAction={(action, stageId) => {
                if (action === 'start') onAction('start', stageId);
                if (action === 'complete') setShowComplete(stageId);
                if (action === 'assign') setShowAssign(showAssign === stageId ? null : stageId);
              }} onShowDetails={(stageId) => setShowStageDetails(showStageDetails === stageId ? null : stageId)} />

              {showAssign === stage.id && (
                <div className="mt-1 ml-8 space-y-1 p-2 bg-slate-800/50 rounded-lg border border-white/5">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full rounded border border-white/10 bg-slate-800 px-2 py-1.5 text-xs text-white"
                  >
                    <option value="" className="bg-slate-900">Select employee...</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id} className="bg-slate-900">
                        {u.first_name} {u.last_name} ({u.role})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-slate-500 shrink-0" />
                    <input
                      type="date"
                      value={assignDueDate}
                      onChange={(e) => setAssignDueDate(e.target.value)}
                      className="flex-1 rounded border border-white/10 bg-slate-800 px-2 py-1.5 text-[10px] text-white"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="flex gap-1 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 px-2 text-[9px] text-slate-400"
                      onClick={() => { setShowAssign(null); setSelectedUser(''); setAssignDueDate(''); }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-5 px-2 text-[9px] bg-cyan-500 hover:bg-cyan-600"
                      onClick={() => handleAssign(stage.id)}
                      disabled={assigning || !selectedUser}
                    >
                      {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : <User className="h-3 w-3 mr-0.5" />}
                      Assign & Start
                    </Button>
                  </div>
                </div>
              )}

              {showReject === stage.id && (
                <div className="mt-1 ml-8 space-y-1 p-2 bg-slate-800/50 rounded-lg border border-white/5">
                  <Input
                    placeholder="Rejection reason..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="h-6 text-[10px] bg-slate-800 border-white/10 text-white"
                  />
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-5 px-2 text-[9px] text-slate-400" onClick={() => { setShowReject(null); setRejectReason(''); }}>Cancel</Button>
                    <Button size="sm" className="h-5 px-2 text-[9px] bg-orange-500 hover:bg-orange-600" onClick={() => handleReject(stage.id)}>Reject</Button>
                  </div>
                </div>
              )}

              {showComplete === stage.id && (
                <div className="mt-1 ml-8 space-y-1 p-2 bg-slate-800/50 rounded-lg border border-white/5">
                  <Input
                    placeholder="Google Drive Link (required)..."
                    value={completeDriveLink}
                    onChange={(e) => setCompleteDriveLink(e.target.value)}
                    className="h-6 text-[10px] bg-slate-800 border-white/10 text-white"
                  />
                  <Input
                    placeholder="Completion notes (optional)..."
                    value={completeNotes}
                    onChange={(e) => setCompleteNotes(e.target.value)}
                    className="h-6 text-[10px] bg-slate-800 border-white/10 text-white"
                  />
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-5 px-2 text-[9px] text-slate-400" onClick={() => { setShowComplete(null); setCompleteNotes(''); setCompleteDriveLink(''); }}>Cancel</Button>
                    <Button size="sm" className="h-5 px-2 text-[9px] bg-green-500 hover:bg-green-600" onClick={() => handleComplete(stage.id)} disabled={!completeDriveLink.trim()}>
                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Confirm Done
                    </Button>
                  </div>
                </div>
              )}

              {showStageDetails === stage.id && stage.status === 'completed' && (
                <div className="mt-2 ml-2 mr-0 p-4 bg-green-500/5 rounded-xl border border-green-500/20 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <p className="text-sm font-semibold text-white">Submission Details</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/15 text-green-400 border border-green-500/25">
                      Stage Completed
                    </span>
                  </div>

                  {/* Submitted by + date */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-start gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-500">Submitted by</p>
                        <p className="text-xs text-white font-medium">
                          {stage.submitted_by_name ||
                            (stage.assigned_to_detail
                              ? `${stage.assigned_to_detail.first_name} ${stage.assigned_to_detail.last_name}`.trim()
                              : '—')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-slate-500">Submitted on</p>
                        <p className="text-xs text-white font-medium">
                          {stage.completed_at
                            ? new Date(stage.completed_at).toLocaleString('en-IN', {
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
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Link2 className="h-3 w-3 text-slate-400" />
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Drive Link</p>
                    </div>
                    {stage.drive_link ? (
                      <a
                        href={stage.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 hover:bg-green-500/15 hover:text-green-300 transition-all text-xs font-medium group"
                      >
                        <Link2 className="h-3 w-3 shrink-0" />
                        <span>Open Google Drive</span>
                        <span className="opacity-70 group-hover:opacity-100 transition-opacity">↗</span>
                      </a>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No Drive Link</p>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-slate-400" />
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Comments</p>
                    </div>
                    {(stage.completion_notes || stage.notes) ? (
                      <div className="px-2.5 py-2 rounded-lg bg-slate-800/60 border border-white/5">
                        <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                          &ldquo;{stage.completion_notes || stage.notes}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No Comments</p>
                    )}
                  </div>

                  <button
                    className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                    onClick={() => setShowStageDetails(null)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProtocolDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = useIsOwner();
  const isManager = useIsManager();
  const canManage = isOwner || isManager;

  const protocolId = Number(params.id);
  const [data, setData] = useState<VideoProtocolDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const [dashRes, usersRes] = await Promise.all([
      api.get<VideoProtocolDashboard>(apiEndpoints.protocolDashboard(protocolId)),
      api.get<any[]>(apiEndpoints.users),
    ]);
    if (dashRes.error) {
      toast.error(extractApiErrorMessage(dashRes));
    } else {
      setData(dashRes.data!);
    }
    if (usersRes.data) setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
    setLoading(false);
  }, [protocolId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleStageAction = useCallback(async (action: string, stageId: number, payload?: any) => {
    setActionLoading(true);
    let res;
    if (action === 'start') {
      res = await api.post(apiEndpoints.stageStart(stageId), payload || {});
    } else if (action === 'complete') {
      res = await api.post(apiEndpoints.stageComplete(stageId), payload || {});
    } else if (action === 'reject') {
      res = await api.post(apiEndpoints.stageReject(stageId), payload || {});
    } else if (action === 'assign') {
      res = await api.post(apiEndpoints.stageAssign(stageId), payload || {});
    }
    setActionLoading(false);

    if (res?.error) {
      toast.error(extractApiErrorMessage(res));
      return;
    }

    toast.success(`${action} successful`);
    await fetchDashboard(true);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-slate-400">Protocol not found</p>
        <Button onClick={() => router.push('/adminzenfix/video-protocol')} className="bg-cyan-500 hover:bg-cyan-600">
          Back to Protocols
        </Button>
      </div>
    );
  }

  const { protocol, video_summaries, stage_stats, employee_workload, counts } = data;
  const totalStages = counts.target * 5;
  const completedStages = Object.values(stage_stats).reduce((sum, s) => sum + s.completed, 0);
  const workflowPct = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
  const videoCompletionPct = counts.target > 0 ? Math.round((counts.posted / counts.target) * 100) : 0;

  const STAGE_KEYS = ['shoot', 'edit', 'review', 'client_approval', 'instagram_post'];
  const STAGE_LABELS: Record<string, string> = {
    shoot: 'Shoot', edit: 'Edit', review: 'Review',
    client_approval: 'Client Approval', instagram_post: 'Instagram Post',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/adminzenfix/video-protocol">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Video className="h-7 w-7 text-cyan-400" />
            {protocol.client_name}
          </h1>
          <p className="text-slate-400 text-sm">
            Monthly Video Protocol &middot; {['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][protocol.month]} {protocol.year}
          </p>
        </div>
        <Button onClick={() => fetchDashboard()} variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{counts.target}</p>
          <p className="text-xs text-slate-400 mt-1">Monthly Target</p>
        </div>
        <div className="bg-slate-900/50 border border-green-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{counts.posted}</p>
          <p className="text-xs text-slate-400 mt-1">Posted</p>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-cyan-400">{counts.in_progress}</p>
          <p className="text-xs text-slate-400 mt-1">In Progress</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-slate-400">{counts.not_started}</p>
          <p className="text-xs text-slate-400 mt-1">Not Started</p>
        </div>
        <div className="bg-slate-900/50 border border-purple-500/20 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-400">{counts.remaining}</p>
          <p className="text-xs text-slate-400 mt-1">Remaining</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            Overall Workflow Progress
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>Workflow: <span className="text-cyan-400 font-semibold">{workflowPct}%</span></span>
            <span>Videos: <span className="text-green-400 font-semibold">{videoCompletionPct}%</span></span>
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 mb-1">
          <div
            className="h-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
            style={{ width: `${workflowPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">
          {completedStages} of {totalStages} stages completed &middot; {counts.posted} of {counts.target} videos fully posted
        </p>
      </div>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-cyan-400" />
          Stage Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {STAGE_KEYS.map((key) => {
            const stats = stage_stats[key] || { completed: 0, total: 0, in_progress: 0 };
            const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            const Icon = STAGE_ICONS[key] || Camera;
            return (
              <div key={key} className="bg-slate-800/50 border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-cyan-400" />
                  <p className="text-xs font-medium text-white">{STAGE_LABELS[key]}</p>
                </div>
                <p className="text-lg font-bold text-white">{stats.completed} / {stats.total}</p>
                <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full bg-cyan-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{pct}% &middot; {stats.in_progress} active</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Video className="h-5 w-5 text-cyan-400" />
          Video Production
        </h2>
        <div className="grid gap-4">
          {video_summaries.map((v) => (
            <VideoCard
              key={v.id}
              video={v}
              users={users}
              onAction={handleStageAction}
              canManage={canManage}
            />
          ))}
        </div>
      </div>

      {employee_workload.length > 0 && (
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Employee Workload
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-white/10">
                  <th className="text-left py-2 px-3">Employee</th>
                  <th className="text-center py-2 px-3">Assigned</th>
                  <th className="text-center py-2 px-3">Completed</th>
                  <th className="text-center py-2 px-3">In Progress</th>
                  <th className="text-center py-2 px-3">Progress</th>
                </tr>
              </thead>
              <tbody>
                {employee_workload.map((emp) => {
                  const empPct = emp.assigned_count > 0 ? Math.round((emp.completed_count / emp.assigned_count) * 100) : 0;
                  return (
                    <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-white text-xs font-medium">{emp.first_name} {emp.last_name}</p>
                            <p className="text-slate-500 text-[10px]">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3 text-white">{emp.assigned_count}</td>
                      <td className="text-center py-3 px-3 text-green-400">{emp.completed_count}</td>
                      <td className="text-center py-3 px-3 text-cyan-400">{emp.in_progress_count}</td>
                      <td className="text-center py-3 px-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 bg-slate-700 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${empPct}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-400">{empPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Calendar,
  Play,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  startTask, 
  completeTask, 
  markNotCompleted, 
  approveTask, 
  rejectTask,
  addComment 
} from '@/lib/actions/task';

export default function TaskDetailPage() {
  const params = useParams();
  const { data: session, status } = useSession();
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showNotCompletedModal, setShowNotCompletedModal] = useState(false);
  const [notCompletedReason, setNotCompletedReason] = useState('');
  const [notCompletedReasonType, setNotCompletedReasonType] = useState('');

  const userRole = (session?.user as any)?.role || 'worker';
  const userId = (session?.user as any)?.id;
  const canManageTask = ['manager', 'admin'].includes(userRole);
  const isAssignedToMe = task?.assignedTo?._id === userId;

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }

    if (status === 'authenticated' && params.id) {
      fetchTask();
    }
  }, [status, params.id]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`);
      const data = await response.json();
      setTask(data.task);
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async () => {
    setActionLoading(true);
    try {
      const result = await startTask(params.id as string);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Task started');
        fetchTask();
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    const formData = new FormData();
    formData.append('completionNotes', 'Task completed successfully');
    setActionLoading(true);
    try {
      const result = await completeTask(params.id as string, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Task marked as completed');
        fetchTask();
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNotCompleted = async () => {
    const formData = new FormData();
    formData.append('reason', notCompletedReason);
    formData.append('reasonType', notCompletedReasonType);
    setActionLoading(true);
    try {
      const result = await markNotCompleted(params.id as string, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Task marked as not completed');
        setShowNotCompletedModal(false);
        fetchTask();
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveTask = async () => {
    setActionLoading(true);
    try {
      const result = await approveTask(params.id as string);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Task approved');
        fetchTask();
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTask = async () => {
    setActionLoading(true);
    try {
      const result = await rejectTask(params.id as string);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Task rejected');
        fetchTask();
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const formData = new FormData();
    formData.append('message', commentText);
    setActionLoading(true);
    try {
      const result = await addComment(params.id as string, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Comment added');
        setCommentText('');
        fetchTask();
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'overdue':
        return 'bg-red-500/20 text-red-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      case 'not_completed':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/20 text-red-400';
      case 'high':
        return 'bg-orange-500/20 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'low':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-cyan" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-gray-400">Task not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/adminzenfix/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{task.title}</h1>
          <p className="text-gray-400 mt-1">Task Details</p>
        </div>
      </div>

      {/* Task Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Task Card */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium capitalize', getPriorityColor(task.priority))}>
                {task.priority}
              </span>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium capitalize', getStatusColor(task.status))}>
                {task.status.replace('_', ' ')}
              </span>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">{task.description}</p>
            </div>

            {task.completionNotes && (
              <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <h4 className="text-green-400 font-semibold mb-2">Completion Notes</h4>
                <p className="text-gray-300">{task.completionNotes}</p>
              </div>
            )}

            {task.notCompletedReason && (
              <div className="mt-6 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <h4 className="text-red-400 font-semibold mb-2">Reason for Not Completing</h4>
                <p className="text-gray-300">{task.notCompletedReason}</p>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({comments.length})
            </h3>

            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-4">
                <Input
                  value={commentText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-surface/50 border-white/10 text-white"
                />
                <Button type="submit" disabled={actionLoading || !commentText.trim()}>
                  Send
                </Button>
              </div>
            </form>

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-electric-cyan to-purple flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {comment.userId?.name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium">{comment.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-gray-300">{comment.message}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-8">No comments yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Actions</h3>
            <div className="space-y-3">
              {task.status === 'pending' && isAssignedToMe && (
                <Button
                  onClick={handleStartTask}
                  className="w-full bg-gradient-to-r from-electric-cyan to-purple"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Task
                    </>
                  )}
                </Button>
              )}

              {task.status === 'in_progress' && isAssignedToMe && (
                <>
                  <Button
                    onClick={handleCompleteTask}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Complete Task
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowNotCompletedModal(true)}
                    variant="outline"
                    className="w-full border-white/10 text-white hover:bg-white/5"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cannot Complete
                  </Button>
                </>
              )}

              {task.status === 'completed' && canManageTask && (
                <>
                  <Button
                    onClick={handleApproveTask}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Approve'
                    )}
                  </Button>
                  <Button
                    onClick={handleRejectTask}
                    variant="outline"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Reject'
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Details Card */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Assigned To</p>
                  <p className="text-white">{task.assignedTo?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Assigned By</p>
                  <p className="text-white">{task.assignedBy?.name || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Deadline</p>
                  <p className="text-white">{new Date(task.deadline).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Estimated Hours</p>
                  <p className="text-white">{task.estimatedHours || 'N/A'}</p>
                </div>
              </div>
              {task.department && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Department</p>
                  <p className="text-white">{task.department}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Not Completed Modal */}
      {showNotCompletedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Why can't this task be completed?</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Reason Type</Label>
                <select
                  value={notCompletedReasonType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNotCompletedReasonType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-surface/50 border-white/10 text-white"
                >
                  <option value="">Select a reason</option>
                  <option value="client_delayed">Client Delayed</option>
                  <option value="waiting_approval">Waiting Approval</option>
                  <option value="technical_issue">Technical Issue</option>
                  <option value="need_resources">Need Resources</option>
                  <option value="blocked">Blocked</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Reason (min 30 characters)</Label>
                <textarea
                  value={notCompletedReason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotCompletedReason(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-surface/50 border-white/10 text-white"
                  placeholder="Explain why this task cannot be completed..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleMarkNotCompleted}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={actionLoading || notCompletedReason.length < 30}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Submit'
                  )}
                </Button>
                <Button
                  onClick={() => setShowNotCompletedModal(false)}
                  variant="outline"
                  className="flex-1 border-white/10 text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

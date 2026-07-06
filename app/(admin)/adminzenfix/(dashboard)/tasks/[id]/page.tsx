'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import {
  ArrowLeft, Clock, User, Calendar,
  Play, CheckCircle2, XCircle, MessageSquare,
  Loader2, AlertTriangle, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  startTask, completeTask, markNotCompleted,
  approveTask, rejectTask, addComment,
} from '@/lib/actions/task';

export default function TaskDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userRole = (session?.user as any)?.role || 'worker';

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/adminzenfix');
    }
    if (status === 'authenticated') {
      fetchTask();
    }
  }, [status, taskId]);

  const fetchTask = async () => {
    try {
      const [taskRes, commentsRes] = await Promise.all([
        fetch(`/api/tasks/${taskId}`),
        fetch(`/api/tasks/${taskId}/comments`),
      ]);
      
      if (taskRes.ok) {
        const data = await taskRes.json();
        setTask(data.task);
      } else {
        toast.error('Failed to load task');
      }

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setTask((prev: any) => prev ? { ...prev, comments: commentsData.comments } : null);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Error loading task');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const result = await startTask(taskId);
      if (result.success) {
        toast.success('Task started');
        fetchTask();
      } else {
        toast.error(result.error || 'Failed to start task');
      }
    } catch (error) {
      toast.error('Error starting task');
    }
  };

  const handleComplete = async () => {
    try {
      const formData = new FormData();
      formData.append('completionNotes', '');
      const result = await completeTask(taskId, formData);
      if (result.success) {
        toast.success('Task completed');
        fetchTask();
      } else {
        toast.error(result.error || 'Failed to complete task');
      }
    } catch (error) {
      toast.error('Error completing task');
    }
  };

  const handleNotComplete = async () => {
    try {
      const formData = new FormData();
      formData.append('reason', 'Marked as not completed by worker');
      formData.append('reasonType', 'other');
      const result = await markNotCompleted(taskId, formData);
      if (result.success) {
        toast.success('Task marked as not completed');
        fetchTask();
      } else {
        toast.error(result.error || 'Failed to update task');
      }
    } catch (error) {
      toast.error('Error updating task');
    }
  };

  const handleApprove = async () => {
    try {
      const result = await approveTask(taskId);
      if (result.success) {
        toast.success('Task approved');
        fetchTask();
      } else {
        toast.error(result.error || 'Failed to approve task');
      }
    } catch (error) {
      toast.error('Error approving task');
    }
  };

  const handleReject = async () => {
    try {
      const result = await rejectTask(taskId);
      if (result.success) {
        toast.success('Task rejected');
        fetchTask();
      } else {
        toast.error(result.error || 'Failed to reject task');
      }
    } catch (error) {
      toast.error('Error rejecting task');
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: comment }),
      });
      
      if (response.ok) {
        toast.success('Comment added');
        setComment('');
        fetchTask();
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      toast.error('Error adding comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
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
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{task.title}</h1>
            <p className="text-slate-400">{task.description}</p>
          </div>
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium capitalize',
            task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
            task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-400' :
            task.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
            task.status === 'not_completed' ? 'bg-orange-500/10 text-orange-400' :
            'bg-red-500/10 text-red-400'
          )}>
            {task.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Assigned To</p>
              <p className="text-white text-sm">{task.assignedTo?.name || 'Unassigned'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Deadline</p>
              <p className="text-white text-sm">
                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Priority</p>
              <p className="text-white text-sm capitalize">{task.priority}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {task.status === 'pending' && userRole === 'worker' && (
            <Button onClick={handleStart} className="bg-cyan-500 hover:bg-cyan-600">
              <Play className="h-4 w-4 mr-2" />
              Start Task
            </Button>
          )}
          {task.status === 'in_progress' && userRole === 'worker' && (
            <Button onClick={handleComplete} className="bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Task
            </Button>
          )}
          {task.status === 'completed' && userRole === 'worker' && (
            <Button onClick={handleNotComplete} variant="outline" className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
              <XCircle className="h-4 w-4 mr-2" />
              Mark Not Complete
            </Button>
          )}
          {(userRole === 'admin' || userRole === 'manager') && task.status === 'completed' && (
            <>
              <Button onClick={handleApprove} className="bg-green-500 hover:bg-green-600">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button onClick={handleReject} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                <ThumbsDown className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Comments</h3>
        <div className="space-y-4 mb-6">
          {!task.comments || task.comments.length === 0 ? (
            <p className="text-slate-500 text-sm">No comments yet</p>
          ) : (
            task.comments.map((comment: any, index: number) => (
              <div key={index} className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{comment.user?.name || 'Unknown'}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">{comment.text}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-3">
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
          <Button onClick={handleAddComment} disabled={submitting || !comment.trim()}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

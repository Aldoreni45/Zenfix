'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, CalendarClock, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { usePendingPreviousTasks, useIsOwner, useIsManager } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';

export default function CarryForwardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const canManage = useIsOwner() || useIsManager();
  const { data: pendingTasks, loading: pendingLoading, refetch } = usePendingPreviousTasks();

  const [newDueDate, setNewDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ carried_count: number } | null>(null);

  // Redirect in an effect so we never call the router during render.
  useEffect(() => {
    if (!loading && (!user || !canManage)) {
      router.replace('/adminzenfix/dashboard');
    }
  }, [loading, user, canManage, router]);

  if (loading || !user || !canManage) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    if (!newDueDate) {
      toast.error('Please select a new due date');
      setSubmitting(false);
      return;
    }

    const res = await api.post<{ carried_count: number }>(apiEndpoints.carryForwardAllPending, {
      new_due_date: newDueDate,
    });

    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else if (res.data) {
      setResult(res.data);
      toast.success(`${res.data.carried_count} pending task${res.data.carried_count !== 1 ? 's' : ''} carried forward`);
      refetch();
    }
    setSubmitting(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">Carry Forward Pending Tasks</h1>
        <p className="text-slate-400 mt-1">Move all pending tasks from previous days to a new due date</p>
      </div>

      {/* Pending Preview */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-cyan-400" />
            Tasks To Carry Forward
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/5"
            onClick={refetch}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {pendingLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {(pendingTasks || []).length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No pending tasks from previous days. Nothing to carry forward.
              </p>
            ) : (
              (pendingTasks as any[]).map((t: any) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">
                      {t.task_id} — {t.title}
                    </p>
                    <p className="text-xs text-slate-500">Due {t.due_date}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0 ml-3">
                    {new Date(`${t.due_date}T00:00:00`).getTime() < Date.now() ? 'Overdue' : 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="new_due_date" className="text-slate-300">New Due Date <span className="text-red-400">*</span></Label>
            <Input
              id="new_due_date"
              type="date"
              min={minDate}
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="bg-slate-800/50 border-white/10 text-white [color-scheme:dark]"
            />
            <p className="text-xs text-slate-500">Tasks will be moved to this date and marked as pending.</p>
          </div>
          <Button
            type="submit"
            disabled={submitting || (pendingTasks || []).length === 0}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 md:mb-1"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carrying Forward…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Carry Forward Task{(pendingTasks || []).length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>

        {newDueDate && newDueDate < today && (
          <div className="flex items-start gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-400">
              The selected date is in the past. Consider choosing a future date.
            </p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="text-green-400 text-sm">
              {result.carried_count} pending task{result.carried_count !== 1 ? 's' : ''} carried forward to{' '}
              {new Date(`${newDueDate}T00:00:00`).toLocaleDateString()}.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useClients, useUsers, useManagers, useCanManage } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { todayLocalISO } from '@/lib/date-utils';
import { getUserDisplayName } from '@/lib/utils';

const TASK_TYPES = [
  { value: 'shoot_video', label: 'Shoot Video' },
  { value: 'edit_video', label: 'Edit Video' },
  { value: 'review_video', label: 'Review Video' },
  { value: 'client_approval', label: 'Client Approval' },
  { value: 'instagram_post', label: 'Instagram Post' },
  { value: 'general', label: 'General Task' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function CreateTaskPage() {
  const router = useRouter();
  const { user, initialized, isAuthenticated } = useAuth();
  const canManage = useCanManage();

  const { data: clients, loading: clientsLoading } = useClients();
  const { data: allUsers, loading: usersLoading } = useUsers();
  const { data: managers, loading: managersLoading } = useManagers();

  const [form, setForm] = useState({
    title: '',
    task_type: 'general',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Redirect in an effect so we never call the router during render.
  useEffect(() => {
    if (initialized && (!isAuthenticated || !canManage)) {
      router.replace('/adminzenfix/dashboard');
    }
  }, [initialized, isAuthenticated, canManage, router]);

  if (!initialized || !isAuthenticated || !canManage) {
    return null;
  }

  const loading = clientsLoading || usersLoading || managersLoading;

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    if (!form.title.trim()) {
      setFieldErrors({ title: 'Title is required' });
      setSubmitting(false);
      return;
    }
    if (!form.assigned_to) {
      setFieldErrors({ assigned_to: 'Assigned To is required' });
      setSubmitting(false);
      return;
    }
    if (!form.due_date) {
      setFieldErrors({ due_date: 'Due date is required' });
      setSubmitting(false);
      return;
    }
    if (form.due_date < todayLocalISO()) {
      setFieldErrors({ due_date: 'Due date cannot be in the past.' });
      setSubmitting(false);
      return;
    }

    const payload: Record<string, any> = {
      title: form.title.trim(),
      task_type: form.task_type,
      priority: form.priority,
      due_date: form.due_date,
    };

    if (form.assigned_to) payload.assigned_to = Number(form.assigned_to);

    const res = await api.post(apiEndpoints.tasks, payload);

    if (res.error) {
      const status = res.status;
      if (status && status >= 400 && status < 500 && res.error.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(res.error);
          const errs: Record<string, string> = {};
          for (const [key, value] of Object.entries(parsed)) {
            const msgs = Array.isArray(value) ? value : [value];
            errs[key] = String(msgs[0] ?? 'Invalid value');
          }
          setFieldErrors(errs);
        } catch {
          toast.error(extractApiErrorMessage(res));
        }
      } else {
        toast.error(extractApiErrorMessage(res));
      }
    } else {
      toast.success('Task created successfully');
      router.push('/adminzenfix/tasks');
      router.refresh();
    }

    setSubmitting(false);
  };

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
        <h1 className="text-2xl font-bold text-white">Create Task</h1>
        <p className="text-slate-400 mt-1">Schedule a new task for your team</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6"
      >
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading team data…
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-slate-300">
            Task Title <span className="text-red-400">*</span>
          </Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g. Shoot promotional video for Acme Corp"
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
          />
          {fieldErrors.title && <p className="text-red-400 text-xs">{fieldErrors.title}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-slate-300">Priority</Label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => setField('priority', e.target.value)}
              className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value} className="bg-slate-900">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to" className="text-slate-300">
              <User className="inline h-3.5 w-3.5 mr-1" />
              Assigned To <span className="text-red-400">*</span>
            </Label>
            <select
              id="assigned_to"
              value={form.assigned_to}
              onChange={(e) => setField('assigned_to', e.target.value)}
              className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="" className="bg-slate-900">Unassigned</option>
              {(allUsers || [])
                .filter((u: any) => u.status === 'active')
                .map((u: any) => (
                <option key={u.id} value={u.id} className="bg-slate-900">
                  {getUserDisplayName(u)} — {u.role_name || u.role}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-slate-300">
              <Calendar className="inline h-3.5 w-3.5 mr-1" />
              Due Date <span className="text-red-400">*</span>
            </Label>
            <Input
              id="due_date"
              type="date"
              min={todayLocalISO()}
              value={form.due_date}
              onChange={(e) => setField('due_date', e.target.value)}
              className="bg-slate-800/50 border-white/10 text-white [color-scheme:dark]"
            />
            {fieldErrors.due_date && <p className="text-red-400 text-xs">{fieldErrors.due_date}</p>}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-white/10">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Task
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
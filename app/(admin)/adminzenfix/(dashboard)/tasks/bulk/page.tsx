'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Plus, X, ListChecks, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, apiEndpoints, extractApiErrorMessage } from '@/lib/api';
import { useClients, useUsers, useCanManage } from '@/lib/hooks';
import { useAuth } from '@/lib/auth-context';
import { todayLocalISO } from '@/lib/date-utils';

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

export default function BulkCreateTasksPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const canManage = useCanManage();

  const { data: clients } = useClients();
  const { data: allUsers } = useUsers();

  const [titles, setTitles] = useState<string[]>(['']);
  const [form, setForm] = useState({
    task_type: 'general',
    priority: 'medium',
    due_date: '',
    due_time: '',
    client: '',
    assigned_to: '',
    assigned_manager: '',
    estimated_hours: '',
    description: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Redirect in an effect so we never call the router during render.
  useEffect(() => {
    if (!loading && (!user || !canManage)) {
      router.replace('/adminzenfix/dashboard');
    }
  }, [loading, user, canManage, router]);

  if (loading || !user || !canManage) {
    return null;
  }

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateTitle = (index: number, value: string) => {
    setTitles((prev) => prev.map((t, i) => (i === index ? value : t)));
  };

  const addTitle = () => setTitles((prev) => [...prev, '']);
  const removeTitle = (index: number) => {
    setTitles((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const validTitles = titles.map((t) => t.trim()).filter(Boolean);
    if (validTitles.length === 0) {
      toast.error('Add at least one task title');
      setSubmitting(false);
      return;
    }
    if (!form.due_date) {
      toast.error('Due date is required');
      setSubmitting(false);
      return;
    }
    if (form.due_date < todayLocalISO()) {
      toast.error('Due date cannot be in the past.');
      setSubmitting(false);
      return;
    }

    const base: Record<string, any> = {
      task_type: form.task_type,
      priority: form.priority,
      due_date: form.due_date,
      due_time: form.due_time || undefined,
      description: form.description.trim(),
      notes: form.notes.trim(),
      assigned_manager: form.assigned_manager
        ? Number(form.assigned_manager)
        : user.role === 'manager'
        ? user.id
        : undefined,
    };
    if (form.client) base.client = Number(form.client);
    if (form.assigned_to) base.assigned_to = Number(form.assigned_to);
    if (form.estimated_hours) {
      const hours = Number(form.estimated_hours);
      if (Number.isFinite(hours) && hours >= 0) base.estimated_hours = hours;
    }

    const res = await api.post(apiEndpoints.bulkCreateTasks, {
      tasks: validTitles.map((title) => ({ ...base, title })),
    });

    if (res.error) {
      toast.error(extractApiErrorMessage(res));
    } else {
      toast.success(`${validTitles.length} task${validTitles.length > 1 ? 's' : ''} created successfully`);
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
        <h1 className="text-2xl font-bold text-white">Bulk Create Tasks</h1>
        <p className="text-slate-400 mt-1">Create multiple tasks at once with shared settings</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6"
      >
        {/* Task Titles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-slate-300 flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Task Titles <span className="text-red-400">*</span>
            </Label>
            <Button type="button" variant="outline" size="sm" onClick={addTitle} className="border-white/10 text-slate-300 hover:text-white">
              <Plus className="h-4 w-4 mr-1" />
              Add Another
            </Button>
          </div>
          {titles.map((title, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm text-slate-500 w-6 shrink-0">{index + 1}.</span>
              <Input
                value={title}
                onChange={(e) => updateTitle(index, e.target.value)}
                placeholder={`e.g. Shoot promotional video #${index + 1}`}
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeTitle(index)}
                className="text-slate-500 hover:text-red-400 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Type */}
          <div className="space-y-2">
            <Label htmlFor="task_type" className="text-slate-300">Task Type</Label>
            <select
              id="task_type"
              value={form.task_type}
              onChange={(e) => setField('task_type', e.target.value)}
              className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {TASK_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-slate-900">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

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

          {/* Client */}
          <div className="space-y-2">
            <Label htmlFor="client" className="text-slate-300">Client</Label>
            <select
              id="client"
              value={form.client}
              onChange={(e) => setField('client', e.target.value)}
              className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="" className="bg-slate-900">No client</option>
              {(clients || []).map((c: any) => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assigned_to" className="text-slate-300">
              <User className="inline h-3.5 w-3.5 mr-1" />
              Assigned To
            </Label>
            <select
              id="assigned_to"
              value={form.assigned_to}
              onChange={(e) => setField('assigned_to', e.target.value)}
              className="w-full h-10 rounded-xl bg-slate-800/50 border border-white/10 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="" className="bg-slate-900">Unassigned</option>
              {(allUsers || []).map((u: any) => (
                <option key={u.id} value={u.id} className="bg-slate-900">
                  {u.full_name || u.username} — {u.role_name || u.role}
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
          </div>

          {/* Due Time */}
          <div className="space-y-2">
            <Label htmlFor="due_time" className="text-slate-300">Due Time</Label>
            <Input
              id="due_time"
              type="time"
              value={form.due_time}
              onChange={(e) => setField('due_time', e.target.value)}
              className="bg-slate-800/50 border-white/10 text-white [color-scheme:dark]"
            />
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="estimated_hours" className="text-slate-300">Estimated Hours</Label>
            <Input
              id="estimated_hours"
              type="number"
              min="0"
              step="0.5"
              value={form.estimated_hours}
              onChange={(e) => setField('estimated_hours', e.target.value)}
              placeholder="e.g. 2.5"
              className="bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-slate-300">Description</Label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            rows={2}
            placeholder="Shared description applied to all tasks"
            className="w-full rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
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
                Create {titles.filter((t) => t.trim()).length} Task{titles.filter((t) => t.trim()).length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
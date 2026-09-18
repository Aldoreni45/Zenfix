import { api, apiEndpoints } from '@/lib/api';

export async function createTask(formData: FormData): Promise<{ error?: string; success?: boolean; data?: any }> {
  try {
    const payload: Record<string, any> = {
      title: formData.get('title'),
      description: formData.get('description'),
      priority: formData.get('priority') || 'medium',
      due_date: formData.get('deadline'),
    };

    const assignedTo = formData.get('assignedTo');
    if (assignedTo) {
      payload.assigned_to = isNaN(Number(assignedTo)) ? assignedTo : Number(assignedTo);
    }

    const estimatedHours = formData.get('estimatedHours');
    if (estimatedHours) {
      payload.estimated_hours = Number(estimatedHours);
    }

    const res = await api.post(apiEndpoints.tasks, payload);
    if (res.error) {
      return { error: res.error };
    }
    return { success: true, data: res.data };
  } catch (err: any) {
    return { error: err?.message || 'Failed to create task' };
  }
}

export async function startTask(taskId: string | number): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = Number(taskId);
    const res = await api.post(apiEndpoints.startTask(id), {});
    if (res.error) return { error: res.error };
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to start task' };
  }
}

export async function completeTask(taskId: string | number, formData?: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = Number(taskId);
    const notes = formData?.get('completionNotes') as string || 'Task completed';
    const res = await api.post(apiEndpoints.completeTask(id), { notes });
    if (res.error) return { error: res.error };
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to complete task' };
  }
}

export async function markNotCompleted(taskId: string | number, formData?: FormData): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = Number(taskId);
    const reason = formData?.get('reason') as string || 'Marked as not completed';
    const res = await api.post(apiEndpoints.rejectTask(id), { reason });
    if (res.error) return { error: res.error };
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to update task' };
  }
}

export async function approveTask(taskId: string | number): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = Number(taskId);
    const res = await api.post(apiEndpoints.completeTask(id), {});
    if (res.error) return { error: res.error };
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to approve task' };
  }
}

export async function rejectTask(taskId: string | number): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = Number(taskId);
    const res = await api.post(apiEndpoints.rejectTask(id), { reason: 'Rejected by reviewer' });
    if (res.error) return { error: res.error };
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to reject task' };
  }
}

export async function addComment(taskId: string | number, message: string): Promise<{ error?: string; success?: boolean }> {
  try {
    const id = Number(taskId);
    const res = await api.post(`${apiEndpoints.task(id)}/comments/`, { message });
    if (res.error) return { error: res.error };
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Failed to add comment' };
  }
}

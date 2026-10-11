import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { TaskStatus } from '@/lib/types/models';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const user_filter = searchParams.get('user');

    const filters: any = {};
    if (year) {
      filters.$expr = { $eq: [{ $year: '$created_at' }, parseInt(year)] };
    }
    if (user_filter) {
      filters.assigned_to_id = parseInt(user_filter);
    }

    const allTasks = await TaskModel.findAll(filters);

    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const pending = allTasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.ASSIGNED).length;
    const inProgress = allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const rejected = allTasks.filter(t => t.status === TaskStatus.REJECTED).length;
    const cancelled = allTasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    const overdue = allTasks.filter(t => t.status === TaskStatus.OVERDUE).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const dueSoon = allTasks.filter(t => {
      if (!t.due_date || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
      const daysUntilDue = Math.ceil((t.due_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 3;
    }).length;

    const summary = {
      total,
      total_all_time: total,
      completed,
      pending,
      inProgress,
      rejected,
      cancelled,
      completionRate,
      dueSoon,
    };

    return NextResponse.json(summary);
  } catch (error) {
    return handleError(error, 'Task history summary');
  }
}

export const GET = requireOwner(handler);
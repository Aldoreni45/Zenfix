import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { TaskStatus } from '@/lib/types/models';

function parseDateRange(searchParams: URLSearchParams): { start: Date; end: Date } | null {
  if (searchParams.get('all') === '1') return null;

  const startRaw = searchParams.get('start');
  const endRaw = searchParams.get('end');

  if (!startRaw && !endRaw) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return { start, end };
  }

  if (!startRaw || !endRaw) {
    throw new Error('Both start and end dates are required.');
  }

  const start = new Date(`${startRaw}T00:00:00`);
  const end = new Date(`${endRaw}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('Invalid date range.');
  }

  return { start, end };
}

function summarizeTasks(tasks: any[]) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
  const pending = tasks.filter(
    (task) => task.status === TaskStatus.PENDING || task.status === TaskStatus.ASSIGNED
  ).length;
  const in_progress = tasks.filter(
    (task) =>
      task.status === TaskStatus.IN_PROGRESS ||
      task.status === TaskStatus.BLOCKED ||
      task.status === TaskStatus.SUBMITTED
  ).length;
  const overdue = tasks.filter(
    (task) =>
      task.status === TaskStatus.OVERDUE ||
      (!!task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== TaskStatus.COMPLETED &&
        task.status !== TaskStatus.CANCELLED)
  ).length;
  const rejected = tasks.filter((task) => task.status === TaskStatus.REJECTED).length;
  const cancelled = tasks.filter((task) => task.status === TaskStatus.CANCELLED).length;
  const carried_forward = tasks.filter((task) => (task.carry_forward_count || 0) > 0).length;
  const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const due_soon = tasks.filter((task) => {
    if (!task.due_date || task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return false;
    }
    const diff = new Date(task.due_date).getTime() - Date.now();
    const daysUntilDue = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return daysUntilDue >= 0 && daysUntilDue <= 3;
  }).length;

  return {
    total,
    completed,
    pending,
    in_progress,
    overdue,
    rejected,
    cancelled,
    carried_forward,
    completion_rate,
    due_soon,
  };
}

async function handler(request: NextRequest, _user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const userParam = searchParams.get('user');
    const userId = userParam ? Number(userParam) : null;
    const range = parseDateRange(searchParams);

    const filters: Record<string, any> = {};
    if (range) {
      filters.due_date = {
        $gte: range.start,
        $lte: range.end,
      };
    }
    if (userId) {
      filters.assigned_to_id = userId;
    }
    console.info('[API][task-history/summary] start', {
      userId: _user.userId,
      role: _user.role,
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      all: searchParams.get('all'),
      filterUser: userId,
    });

    const tasks = await TaskModel.findAll(filters);
    const allTimeTasks = await TaskModel.findAll(userId ? { assigned_to_id: userId } : {});
    const counts = summarizeTasks(tasks);

    const payload = {
      ...counts,
      total_all_time: allTimeTasks.length,
    };
    console.info('[API][task-history/summary] success', {
      userId: _user.userId,
      role: _user.role,
      total: payload.total,
      total_all_time: payload.total_all_time,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task history summary error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const GET = requireOwner(handler);

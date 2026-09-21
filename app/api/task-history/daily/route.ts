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

async function handler(request: NextRequest, _user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user');
    const range = parseDateRange(searchParams);
    console.info('[API][task-history/daily] start', {
      userId: _user.userId,
      role: _user.role,
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      all: searchParams.get('all'),
      filterUser: userId,
    });

    const filters: Record<string, any> = {};
    if (range) {
      filters.due_date = {
        $gte: range.start,
        $lte: range.end,
      };
    }
    if (userId) {
      filters.assigned_to_id = Number(userId);
    }

    const tasks = await TaskModel.findAll(filters);
    const dayMap = new Map<string, any>();

    tasks.forEach((task) => {
      const dayKey = task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : null;
      if (!dayKey) return;

      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, {
          date: dayKey,
          total: 0,
          completed: 0,
          pending: 0,
          in_progress: 0,
          rejected: 0,
          overdue: 0,
        });
      }

      const bucket = dayMap.get(dayKey);
      bucket.total += 1;

      if (task.status === TaskStatus.COMPLETED) {
        bucket.completed += 1;
      } else if (task.status === TaskStatus.PENDING || task.status === TaskStatus.ASSIGNED) {
        bucket.pending += 1;
      } else if (
        task.status === TaskStatus.IN_PROGRESS ||
        task.status === TaskStatus.BLOCKED ||
        task.status === TaskStatus.SUBMITTED
      ) {
        bucket.in_progress += 1;
      } else if (task.status === TaskStatus.REJECTED) {
        bucket.rejected += 1;
      } else if (task.status === TaskStatus.OVERDUE) {
        bucket.overdue += 1;
      }
    });

    const payload = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    console.info('[API][task-history/daily] success', {
      userId: _user.userId,
      role: _user.role,
      count: payload.length,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task history daily error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const GET = requireOwner(handler);

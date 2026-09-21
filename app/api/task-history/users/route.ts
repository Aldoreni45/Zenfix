import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { UserModel } from '@/lib/mongodb/models/user';
import { TaskModel } from '@/lib/mongodb/models/task';
import { TaskStatus } from '@/lib/types/models';
import { formatUserName } from '@/lib/api-helpers/data-enrichment';
import { isOverdueByDate } from '@/lib/date-utils';

function isReportingOverdue(task: any): boolean {
  return (
    !!task.due_date &&
    isOverdueByDate(task.due_date) &&
    task.status !== TaskStatus.COMPLETED &&
    task.status !== TaskStatus.CANCELLED
  );
}

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
    const roleFilter = searchParams.get('role');
    const range = parseDateRange(searchParams);
    console.info('[API][task-history/users] start', {
      userId: _user.userId,
      role: _user.role,
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      all: searchParams.get('all'),
      roleFilter,
    });

    const baseFilters: Record<string, any> = {};
    if (roleFilter) baseFilters.role = roleFilter;
    const allUsers = await UserModel.findAll(baseFilters);
    const teamUsers = allUsers.filter((u) => u.role !== 'owner');

    const payload = await Promise.all(
      teamUsers.map(async (u) => {
        const taskFilters: Record<string, any> = { assigned_to_id: u.numeric_id };
        if (range) {
          taskFilters.due_date = { $gte: range.start, $lte: range.end };
        }

        const tasks = await TaskModel.findAll(taskFilters);
        const assigned = tasks.length;
        const completed = tasks.filter((task) => task.status === TaskStatus.COMPLETED).length;
        const pending = tasks.filter(
          (task) =>
            !isReportingOverdue(task) &&
            (task.status === TaskStatus.PENDING || task.status === TaskStatus.ASSIGNED)
        ).length;
        const in_progress = tasks.filter(
          (task) =>
            task.status === TaskStatus.IN_PROGRESS ||
            task.status === TaskStatus.BLOCKED ||
            task.status === TaskStatus.SUBMITTED
        ).length;
        const rejected = tasks.filter((task) => task.status === TaskStatus.REJECTED).length;
        const overdue = tasks.filter((task) => isReportingOverdue(task)).length;

        return {
          id: u.numeric_id,
          username: u.username,
          name: formatUserName(u),
          email: u.email,
          role: u.role,
          role_name: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          department_id: u.department_id ?? null,
          department_name: null,
          status: u.status,
          assigned,
          completed,
          pending,
          in_progress,
          rejected,
          overdue,
          completion_rate: assigned > 0 ? Math.round((completed / assigned) * 100) : 0,
        };
      })
    );

    const sorted = payload.sort((a, b) => b.assigned - a.assigned);
    console.info('[API][task-history/users] success', {
      userId: _user.userId,
      role: _user.role,
      count: sorted.length,
    });
    return NextResponse.json(sorted);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task history users error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const GET = requireOwner(handler);

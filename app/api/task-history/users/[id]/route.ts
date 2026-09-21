import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
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

function summarizeTasks(tasks: any[]) {
  const total = tasks.length;
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
  const overdue = tasks.filter((task) => isReportingOverdue(task)).length;
  const rejected = tasks.filter((task) => task.status === TaskStatus.REJECTED).length;
  return {
    total,
    completed,
    pending,
    in_progress,
    overdue,
    rejected,
    completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export const GET = requireOwner(async function handler(request: NextRequest, _user: any) {
  try {
    const userId = Number(request.nextUrl.pathname.split('/').at(-1) ?? '0');
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const user = await UserModel.findByNumericId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const range = parseDateRange(searchParams);

    const taskFilters: Record<string, any> = { assigned_to_id: user.numeric_id };
    if (range) {
      taskFilters.due_date = { $gte: range.start, $lte: range.end };
    }

    const tasks = await TaskModel.findAll(taskFilters);
    const counts = summarizeTasks(tasks);
    const allTimeTasks = await TaskModel.findAll({ assigned_to_id: user.numeric_id });

    const recent_tasks = [...tasks]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 20)
      .map((task) => ({
        id: task.numeric_id,
        task_id: task.task_id,
        title: task.title,
        description: task.description || '',
        client_name: task.client_id ? 'Client' : 'No client',
        status: task.status,
        is_overdue: isReportingOverdue(task),
        due_date: task.due_date ? task.due_date.toISOString().slice(0, 10) : null,
        completed_at: task.completed_at ? task.completed_at.toISOString() : null,
        created_at: task.created_at.toISOString(),
      }));

    const activity = await ActivityLogModel.findAll({ actor_id: user.numeric_id }, 40);

    return NextResponse.json({
      user: {
        id: user.numeric_id,
        username: user.username,
        name: formatUserName(user),
        email: user.email,
        role: user.role,
        role_name: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        department_id: user.department_id ?? null,
        department_name: null,
        status: user.status,
      },
      counts,
      recent_tasks,
      activity: activity
        .slice()
        .reverse()
        .map((log) => ({
          id: log.numeric_id,
          action: log.action,
          action_name: log.action.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          description: log.description || '',
          entity_name: log.entity_type,
          entity_id: log.entity_id,
          user_name: user.username,
          timestamp: log.created_at.toISOString(),
        })),
      all_time: {
        assigned: allTimeTasks.length,
        completed: allTimeTasks.filter((task) => task.status === TaskStatus.COMPLETED).length,
        pending: allTimeTasks.filter(
          (task) =>
            !isReportingOverdue(task) &&
            (task.status === TaskStatus.PENDING || task.status === TaskStatus.ASSIGNED)
        ).length,
        overdue: allTimeTasks.filter((task) => isReportingOverdue(task)).length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task history user detail error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

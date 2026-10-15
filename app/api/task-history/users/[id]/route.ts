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

function toDate(value: any): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Parse the requested window for the person's tasks.
 *
 * - `date=YYYY-MM-DD` -> a single day, matched against the day the task was
 *   *completed* (this is what "what did he complete that day" means).
 * - `start`/`end`     -> an explicit due-date range (kept for the links coming
 *   from the Task History team table).
 * - `all=1` / no args -> no date restriction.
 */
function parseFilters(searchParams: URLSearchParams): {
  range: { start: Date; end: Date } | null;
  completedRange: { start: Date; end: Date } | null;
  date: string | null;
} {
  const dateRaw = searchParams.get('date');
  if (dateRaw) {
    const start = new Date(`${dateRaw}T00:00:00`);
    const end = new Date(`${dateRaw}T23:59:59.999`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid date.');
    }
    return { range: null, completedRange: { start, end }, date: dateRaw };
  }

  if (searchParams.get('all') === '1') {
    return { range: null, completedRange: null, date: null };
  }

  const startRaw = searchParams.get('start');
  const endRaw = searchParams.get('end');

  if (!startRaw && !endRaw) {
    return { range: null, completedRange: null, date: null };
  }

  if (!startRaw || !endRaw) {
    throw new Error('Both start and end dates are required.');
  }

  const start = new Date(`${startRaw}T00:00:00`);
  const end = new Date(`${endRaw}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('Invalid date range.');
  }

  return { range: { start, end }, completedRange: null, date: null };
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

/**
 * Build the timing breakdown for a single task: wall-clock time taken
 * (`started_at` -> `completed_at`), hold time and the resulting actual work
 * time / efficiency. Persisted values win when present so this stays in sync
 * with the numbers shown on the task detail page.
 */
function mapTaskTiming(task: any) {
  const startedAt = toDate(task.started_at);
  const completedAt = toDate(task.completed_at);
  const createdAt = toDate(task.created_at);

  const totalSeconds =
    startedAt && completedAt
      ? Math.max(0, Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000))
      : null;

  const totalHoldSeconds =
    typeof task.total_hold_seconds === 'number' ? Math.max(0, Math.floor(task.total_hold_seconds)) : 0;

  let actualWorkSeconds: number | null = null;
  if (typeof task.actual_work_seconds === 'number') {
    actualWorkSeconds = Math.max(0, Math.floor(task.actual_work_seconds));
  } else if (totalSeconds != null) {
    actualWorkSeconds = Math.max(0, totalSeconds - totalHoldSeconds);
  }

  let workEfficiencyPercent: number | null = null;
  if (typeof task.work_efficiency_percent === 'number') {
    workEfficiencyPercent = task.work_efficiency_percent;
  } else if (totalSeconds && totalSeconds > 0 && actualWorkSeconds != null) {
    workEfficiencyPercent = Math.round(
      Math.max(0, Math.min(100, (actualWorkSeconds / totalSeconds) * 100))
    );
  }

  return {
    started_at: startedAt ? startedAt.toISOString() : null,
    completed_at: completedAt ? completedAt.toISOString() : null,
    created_at: createdAt ? createdAt.toISOString() : null,
    total_seconds: totalSeconds,
    total_hold_seconds: totalHoldSeconds,
    actual_work_seconds: actualWorkSeconds,
    work_efficiency_percent: workEfficiencyPercent,
  };
}

function mapTask(task: any) {
  return {
    id: task.numeric_id,
    task_id: task.task_id,
    title: task.title,
    description: task.description || '',
    client_name: task.client_id ? 'Client' : 'No client',
    status: task.status,
    status_name: task.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    is_overdue: isReportingOverdue(task),
    due_date: task.due_date ? toDate(task.due_date)!.toISOString().slice(0, 10) : null,
    ...mapTaskTiming(task),
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
    const { range, completedRange, date } = parseFilters(searchParams);

    // Tasks in the requested window. A completion-day filter targets the day the
    // task was finished; a start/end range keeps targeting the due date.
    const taskFilters: Record<string, any> = { assigned_to_id: user.numeric_id };
    if (completedRange) {
      taskFilters.completed_at = { $gte: completedRange.start, $lte: completedRange.end };
    } else if (range) {
      taskFilters.due_date = { $gte: range.start, $lte: range.end };
    }

    const tasks = await TaskModel.findAll(taskFilters);
    const counts = summarizeTasks(tasks);
    const allTimeTasks = await TaskModel.findAll({ assigned_to_id: user.numeric_id });

    const sortedTasks = [...tasks].sort((a, b) => {
      const aTime = toDate(a.completed_at)?.getTime() ?? toDate(a.updated_at)?.getTime() ?? 0;
      const bTime = toDate(b.completed_at)?.getTime() ?? toDate(b.updated_at)?.getTime() ?? 0;
      return bTime - aTime;
    });

    const recent_tasks = sortedTasks.slice(0, 20).map(mapTask);

    // Completed tasks with the exact time taken, for the selected period/day.
    const completed_tasks = sortedTasks
      .filter((task) => task.status === TaskStatus.COMPLETED)
      .map(mapTask);

    // Activity is scoped to the same window when a date/range is selected.
    const activityFilters: Record<string, any> = { actor_id: user.numeric_id };
    const activityRange = completedRange || range;
    if (activityRange) {
      activityFilters.created_at = { $gte: activityRange.start, $lte: activityRange.end };
    }
    const activity = await ActivityLogModel.findAll(activityFilters, 40);

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
      filter: {
        date,
        start: searchParams.get('start') || null,
        end: searchParams.get('end') || null,
        all_time: !date && !range,
      },
      counts,
      recent_tasks,
      completed_tasks,
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

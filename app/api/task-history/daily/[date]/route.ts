import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { TaskStatus } from '@/lib/types/models';
import { isOverdueByDate, toDateOnlyISO } from '@/lib/date-utils';
import { formatUserName } from '@/lib/api-helpers/data-enrichment';

function isReportingOverdue(task: any): boolean {
  return (
    !!task.due_date &&
    isOverdueByDate(task.due_date) &&
    task.status !== TaskStatus.COMPLETED &&
    task.status !== TaskStatus.CANCELLED
  );
}

// Same bucketing as /task-history/daily so the modal counts always match the
// Daily Activity table row the user clicked.
function bucketFor(task: any): 'completed' | 'pending' | 'in_progress' | 'overdue' | 'rejected' | 'cancelled' {
  if (task.status === TaskStatus.COMPLETED) return 'completed';
  if (task.status === TaskStatus.PENDING || task.status === TaskStatus.ASSIGNED) {
    return isReportingOverdue(task) ? 'overdue' : 'pending';
  }
  if (
    task.status === TaskStatus.IN_PROGRESS ||
    task.status === TaskStatus.BLOCKED ||
    task.status === TaskStatus.SUBMITTED
  ) {
    return 'in_progress';
  }
  if (task.status === TaskStatus.REJECTED) return 'rejected';
  if (task.status === TaskStatus.OVERDUE) return 'overdue';
  if (task.status === TaskStatus.CANCELLED) return 'cancelled';
  return 'pending';
}

export const GET = requireOwner(async function handler(request: NextRequest, _user: any) {
  try {
    const date = request.nextUrl.pathname.split('/').at(-1) ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date. Use YYYY-MM-DD.' }, { status: 400 });
    }

    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date.' }, { status: 400 });
    }

    const tasks = await TaskModel.findAll({ due_date: { $gte: start, $lte: end } } as any);

    const groups: Record<string, any[]> = {
      completed: [],
      pending: [],
      in_progress: [],
      overdue: [],
      rejected: [],
      cancelled: [],
    };
    await Promise.all(
      tasks.map(async (task) => {
        const assignee = task.assigned_to_id ? await UserModel.findByNumericId(task.assigned_to_id) : null;
        groups[bucketFor(task)].push({
          id: task.numeric_id,
          task_id: task.task_id,
          title: task.title,
          assigned_to_id: task.assigned_to_id ?? null,
          assigned_to_name: assignee ? formatUserName(assignee) : null,
          status: task.status,
          status_name: task.status ? task.status.replace(/_/g, ' ') : '',
          due_date: toDateOnlyISO(task.due_date),
          completed_at: task.completed_at ? task.completed_at.toISOString() : null,
        });
      })
    );

    return NextResponse.json({
      date,
      total: tasks.length,
      groups,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task history daily detail error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});
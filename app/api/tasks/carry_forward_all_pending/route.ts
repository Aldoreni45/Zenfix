import { NextRequest, NextResponse } from 'next/server';
import { TaskModel } from '@/lib/mongodb/models/task';
import { requireOwnerOrManager } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction, TaskStatus } from '@/lib/types/models';
import { getDaysUntilDue, parseDueDateUTC, toDateOnlyISO, todayLocalISO } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const body = await request.json();
      const { new_due_date, date } = body;

      // Overdue basis: same as the /tasks/overdue endpoint. Prefer the
      // client-provided local date (the frontend already passes its local
      // calendar date to overdue/pending_previous), falling back to the
      // server's UTC day.
      const now = new Date();
      const today = (date && parseDueDateUTC(date)) ||
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

      let parsedNewDate: Date | null = null;
      if (new_due_date) {
        const daysUntilDue = getDaysUntilDue(new_due_date);
        if (daysUntilDue === null) {
          return NextResponse.json(
            { error: 'Invalid date. Use YYYY-MM-DD format.' },
            { status: 400 }
          );
        }
        if (daysUntilDue < 0) {
          return NextResponse.json(
            { error: 'New due date cannot be in the past.' },
            { status: 400 }
          );
        }
        parsedNewDate = parseDueDateUTC(new_due_date);
      } else {
        const defaultDate = parseDueDateUTC(todayLocalISO());
        if (defaultDate) {
          defaultDate.setUTCDate(defaultDate.getUTCDate() + 7);
          parsedNewDate = defaultDate;
        }
      }

      // Mirrors the Overdue list query exactly: open tasks (any status except
      // completed/cancelled) that are due strictly before the target day.
      const filters: any = {
        status: { $nin: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
        $or: [
          { due_date: { $lt: today } },
          { status: TaskStatus.OVERDUE },
        ],
      };
      const tasks = await TaskModel.findAll(filters);

      // Carry forward each task
      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          const updated = await TaskModel.update(task.numeric_id, {
            due_date: parsedNewDate || task.due_date,
            carried_forward_from_id: task.numeric_id,
            carry_forward_count: (task.carry_forward_count || 0) + 1,
          });

          // Log activity
          await ActivityLogModel.create({
            actor_id: user.userId,
            action: ActivityAction.CARRY_FORWARD,
            entity_type: 'task',
            entity_id: String(task.numeric_id),
            description: `Task carried forward from ${toDateOnlyISO(task.due_date)} to ${toDateOnlyISO(parsedNewDate || task.due_date)}`,
            metadata: { task_id: task.numeric_id },
          });

          return updated;
        })
      );

      return NextResponse.json({
        success: true,
        carried_forward_count: updatedTasks.length,
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error('Error carrying forward all pending tasks:', error);
      return NextResponse.json(
        { error: 'Failed to carry forward pending tasks' },
        { status: 500 }
      );
    }
  })(request);
}

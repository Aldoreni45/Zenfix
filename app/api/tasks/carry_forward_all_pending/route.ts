import { NextRequest, NextResponse } from 'next/server';
import { TaskModel } from '@/lib/mongodb/models/task';
import { requireOwnerOrManager } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { isOverdueByDate, parseDueDateUTC, toDateOnlyISO } from '@/lib/date-utils';

export async function POST(request: NextRequest) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const body = await request.json();
      const { new_due_date } = body;

      let parsedNewDate: Date | null = null;
      if (new_due_date) {
        parsedNewDate = parseDueDateUTC(new_due_date);
        if (!parsedNewDate) {
          return NextResponse.json(
            { error: 'Invalid date. Use YYYY-MM-DD format.' },
            { status: 400 }
          );
        }
      }

      // Find all pending tasks from previous days
      const allTasks = await TaskModel.findAll({});
      const tasks = allTasks.filter(t =>
        (t.status === 'pending' || t.status === 'in_progress') &&
        t.due_date && isOverdueByDate(t.due_date)
      );

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

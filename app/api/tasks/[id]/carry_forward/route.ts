import { NextRequest, NextResponse } from 'next/server';
import { TaskModel } from '@/lib/mongodb/models/task';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { handleError, handleForbidden, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { parseDueDateUTC, todayLocalISO } from '@/lib/date-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const taskId = parseInt(id);
      const body = await request.json();
      const { new_due_date } = body;

      // Django: Employees cannot carry forward tasks
      if (user.role === 'employee') {
        return handleForbidden('Employees cannot carry forward tasks.');
      }

      const task = await TaskModel.findByNumericId(taskId);
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      // Django: Validate date (date-only, stored at UTC midnight)
      let parsedDate;
      if (new_due_date) {
        parsedDate = parseDueDateUTC(new_due_date);
        if (!parsedDate) {
          return handleValidationError('Invalid date. Use YYYY-MM-DD format.');
        }
      } else {
        // Django: Use default next due date if not provided
        // Default to 7 days from the current calendar day, stored as a clean
        // UTC-midnight date (never a local-midnight instant).
        parsedDate = parseDueDateUTC(todayLocalISO());
        if (parsedDate) {
          parsedDate.setUTCDate(parsedDate.getUTCDate() + 7);
        } else {
          const fallback = new Date();
          parsedDate = new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate() + 7));
        }
      }

      // Update task with carry forward
      await TaskModel.update(taskId, {
        due_date: parsedDate,
        carried_forward_from_id: task.numeric_id,
        carry_forward_count: (task.carry_forward_count || 0) + 1,
      });

      // Log activity
      await logActivity({
        actorId: user.userId,
        action: 'CARRY_FORWARD',
        entityType: 'task',
        entityId: task.numeric_id.toString(),
        description: `Task carried forward from ${task.due_date?.toISOString().split('T')[0]} to ${parsedDate.toISOString().split('T')[0]}`,
        metadata: { task_id: taskId },
        request,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Carry forward task');
    }
  })(request);
}

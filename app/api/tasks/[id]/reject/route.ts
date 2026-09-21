import { NextRequest, NextResponse } from 'next/server';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { ActivityAction } from '@/lib/types/models';
import { handleError, handleForbidden, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const taskId = parseInt(id);
      const body = await request.json();
      const { rejection_reason } = body;

      if (!rejection_reason) {
        return handleValidationError('Rejection reason is required');
      }

      // Django: Employees cannot reject tasks
      if (user.role === 'employee') {
        return handleForbidden('Employees cannot reject tasks.');
      }

      const task = await TaskModel.findByNumericId(taskId);
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      // Update task with rejection
      await TaskModel.update(taskId, {
        status: 'rejected',
        rejection_reason,
        rejection_count: (task.rejection_count || 0) + 1,
      });

      // Log activity
      await logActivity({
        actorId: user.userId,
        action: 'REJECT',
        entityType: 'task',
        entityId: task.numeric_id.toString(),
        description: `Task '${task.title}' rejected`,
        metadata: { reason: rejection_reason.substring(0, 500) },
        request,
      });

      // Django: Notify assigned_to about rejection
      if (task.assigned_to_id) {
        await NotificationModel.create({
          recipient_id: task.assigned_to_id,
          notification_type: 'task_rejected',
          title: 'Task rejected',
          message: rejection_reason,
          is_read: false,
          related_object_type: 'task',
          related_object_id: task.numeric_id.toString(),
          priority: 'high',
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Reject task');
    }
  })(request);
}

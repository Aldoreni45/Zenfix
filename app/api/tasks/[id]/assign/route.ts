import { NextRequest, NextResponse } from 'next/server';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { requireOwnerOrManager } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { ActivityAction } from '@/lib/types/models';
import { handleError, handleForbidden, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const { id } = await params;
      const taskId = parseInt(id);
      const body = await request.json();
      const { assigned_to, assigned_manager } = body;

      if (!assigned_to && !assigned_manager) {
        return handleValidationError('assigned_to or assigned_manager is required');
      }

      const task = await TaskModel.findByNumericId(taskId);
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      const targetId = assigned_to || assigned_manager;
      let assignee = null;

      // Django: Validate user exists and is active
      if (targetId) {
        assignee = await UserModel.findByNumericId(targetId);
        if (!assignee || !assignee.is_active) {
          return handleValidationError('User not found or inactive.');
        }
      }

      // Update task assignment
      const updateData: any = {
        status: 'assigned',
      };
      if (assigned_to) updateData.assigned_to_id = assigned_to;
      if (assigned_manager) updateData.assigned_manager_id = assigned_manager;

      await TaskModel.update(taskId, updateData);

      // Log activity
      await logActivity({
        actorId: user.userId,
        action: 'ASSIGN',
        entityType: 'task',
        entityId: task.numeric_id.toString(),
        description: `Assigned task '${task.title}' to ${assignee ? `${assignee.first_name} ${assignee.last_name || assignee.username}` : targetId}`,
        metadata: { assignee: targetId, assignee_name: assignee ? `${assignee.first_name} ${assignee.last_name || assignee.username}` : targetId },
        request,
      });

      // Django: Notify the assigned user
      if (assigned_to && assignee) {
        await NotificationModel.create({
          recipient_id: assigned_to,
          notification_type: 'task_assigned',
          title: 'Task assigned',
          message: `You were assigned "${task.title}".`,
          is_read: false,
          related_object_type: 'task',
          related_object_id: task.numeric_id.toString(),
          priority: 'medium',
        });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Assign task');
    }
  })(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerOrManager } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { TaskStatus } from '@/lib/types/models';
import { formatUserName } from '@/lib/api-helpers/data-enrichment';
import { handleError, handleValidationError } from '@/lib/api-helpers/error-handler';
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
      const { assigned_to } = body;

      if (!assigned_to) {
        return handleValidationError('assigned_to is required');
      }

      const task = await TaskModel.findByNumericId(taskId);
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      // Video Protocol safety: tasks auto-created from a video stage are owned by
      // their Video Protocol lifecycle (stage sync/aggregates). Never reassign
      // them through the general-task system.
      if (task.video_stage_id) {
        return handleValidationError('Video Protocol tasks cannot be reassigned.');
      }

      if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
        return handleValidationError('Completed or cancelled tasks cannot be reassigned.');
      }

      if (task.assigned_to_id === assigned_to) {
        return handleValidationError('Task is already assigned to that user.');
      }

      const assignee = await UserModel.findByNumericId(assigned_to);
      if (!assignee || !assignee.is_active) {
        return handleValidationError('User not found or inactive.');
      }

      const oldAssignee = task.assigned_to_id
        ? await UserModel.findByNumericId(task.assigned_to_id)
        : null;
      const oldName = oldAssignee ? formatUserName(oldAssignee) : 'Unassigned';
      const newName = formatUserName(assignee);

      // Reassign: update ONLY the assignee relationship. No status, due date or
      // any other field is touched.
      await TaskModel.update(taskId, { assigned_to_id: assigned_to });

      // Reuse the existing activity log system.
      await logActivity({
        actorId: user.userId,
        action: 'ASSIGN',
        entityType: 'task',
        entityId: task.numeric_id.toString(),
        description: `Task '${task.title}' reassigned from ${oldName} to ${newName}`,
        metadata: { from: task.assigned_to_id ?? null, to: assigned_to, from_name: oldName, to_name: newName },
        request,
      });

      // Notify the new assignee (same pattern as ./assign).
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

      return NextResponse.json({ success: true, task_id: task.numeric_id, assigned_to_id: assigned_to });
    } catch (error) {
      return handleError(error, 'Reassign task');
    }
  })(request);
}
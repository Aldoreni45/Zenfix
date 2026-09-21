import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { TaskPriority, TaskStatus } from '@/lib/types/models';
import { handleForbidden, handleValidationError, handleError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { sendTaskAssignmentNotification } from '@/lib/api-helpers/notification-helper';
import { getDaysUntilDue, parseDueDateUTC } from '@/lib/date-utils';

async function handler(request: NextRequest, user: any) {
  try {
    if (user.role === 'employee') {
      return handleForbidden('Employees cannot bulk create tasks');
    }

    const body = await request.json();
    const { tasks, global } = body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return handleValidationError('tasks array is required');
    }

    const createdTasks = [];

    for (const taskData of tasks) {
      const {
        title,
        description,
        client,
        video,
        assigned_to,
        assigned_manager,
        department,
        priority = global?.priority || TaskPriority.MEDIUM,
        status = global?.status || TaskStatus.PENDING,
        due_date,
        due_time,
        parent_task,
        notes,
        attachments,
        estimated_hours,
        task_type,
        video_stage,
      } = { ...global, ...taskData };

      if (!title) {
        continue; // Skip tasks without title
      }

      if (due_date) {
        const daysUntilDue = getDaysUntilDue(due_date);
        if (daysUntilDue !== null && daysUntilDue < 0) {
          continue;
        }
      }

      // Validate client
      let client_id = null;
      if (client) {
        const clientDoc = await ClientModel.findByNumericId(client);
        if (!clientDoc) {
          continue;
        }
        client_id = client;
      }

      // Validate assigned_to
      let assigned_to_id = null;
      if (assigned_to) {
        const assignee = await UserModel.findByNumericId(assigned_to);
        if (!assignee) {
          continue;
        }
        assigned_to_id = assigned_to;
      }

      // Validate assigned_manager
      let assigned_manager_id = null;
      if (assigned_manager) {
        const manager = await UserModel.findByNumericId(assigned_manager);
        if (!manager) {
          continue;
        }
        assigned_manager_id = assigned_manager;
      }

      const newTask = await TaskModel.create({
        title,
        description,
        client_id,
        video_id: video || null,
        assigned_to_id,
        assigned_by_id: user.userId,
        assigned_manager_id,
        created_by_id: user.userId,
        department_id: department || null,
        priority,
        status,
        due_date: due_date ? parseDueDateUTC(due_date) || undefined : undefined,
        due_time,
        parent_task_id: parent_task || null,
        notes,
        attachments: attachments || [],
        estimated_hours: estimated_hours || 0,
        actual_hours: undefined,
        rejection_reason: undefined,
        rejection_count: 0,
        carry_forward_count: 0,
        task_type: task_type || 'general',
        video_stage_id: video_stage || null,
        original_due_date: due_date ? parseDueDateUTC(due_date) || undefined : undefined,
      });

      // Send notification
      if (newTask.assigned_to_id) {
        await sendTaskAssignmentNotification(newTask.assigned_to_id, newTask.title, newTask.numeric_id.toString());
      }

      createdTasks.push({
        id: newTask.numeric_id,
        task_id: newTask.task_id,
        title: newTask.title,
        status: newTask.status,
      });
    }

    // Log activity
    await logActivity({
      actorId: user.userId,
      action: 'CREATE',
      entityType: 'task',
      entityId: 'bulk',
      description: `Bulk created ${createdTasks.length} tasks`,
      metadata: { task_count: createdTasks.length },
      request,
    });

    return NextResponse.json({ created: createdTasks }, { status: 201 });
  } catch (error) {
    return handleError(error, 'Bulk create tasks');
  }
}

export const POST = requireAuth(handler);

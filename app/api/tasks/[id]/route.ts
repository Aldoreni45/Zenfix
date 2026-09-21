import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { VideoStageModel, VideoRecordModel, VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { loadProtocolContent } from '@/lib/api-helpers/video-protocol';
import { TaskPriority, TaskStatus } from '@/lib/types/models';
import { formatUserName, getClientNameById, getDepartmentNameById, formatStatusName, formatPriorityName } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError, handleForbidden, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { isOverdueByDate, parseDueDateUTC, toDateOnlyISO } from '@/lib/date-utils';

async function getHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const taskDoc = await TaskModel.findByNumericId(numericId);
    
    if (!taskDoc) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Role-based access check
    if (user.role === 'employee' && taskDoc.assigned_to_id !== user.userId) {
      return NextResponse.json(
        { error: 'You can only view your assigned tasks.' },
        { status: 403 }
      );
    }

    let client_name = null;
    if (taskDoc.client_id) {
      const client = await ClientModel.findByNumericId(taskDoc.client_id);
      client_name = client?.name || null;
    }

    let assigned_to_name = null;
    if (taskDoc.assigned_to_id) {
      const assignee = await UserModel.findByNumericId(taskDoc.assigned_to_id);
      assigned_to_name = assignee ? `${assignee.first_name} ${assignee.last_name}`.trim() || assignee.username : null;
    }

    let assigned_manager_name = null;
    if (taskDoc.assigned_manager_id) {
      const manager = await UserModel.findByNumericId(taskDoc.assigned_manager_id);
      assigned_manager_name = manager ? `${manager.first_name} ${manager.last_name}`.trim() || manager.username : null;
    }

    let created_by_name = null;
    if (taskDoc.created_by_id) {
      const creator = await UserModel.findByNumericId(taskDoc.created_by_id);
      created_by_name = creator ? `${creator.first_name} ${creator.last_name}`.trim() || creator.username : null;
    }

    const is_overdue = taskDoc.due_date && isOverdueByDate(taskDoc.due_date) && taskDoc.status !== TaskStatus.COMPLETED && taskDoc.status !== TaskStatus.CANCELLED;

    const taskResponse = {
      id: taskDoc.numeric_id,
      task_id: taskDoc.task_id,
      title: taskDoc.title,
      description: taskDoc.description,
      client_id: taskDoc.client_id,
      client_name,
      video_id: taskDoc.video_id,
      assigned_to_id: taskDoc.assigned_to_id,
      assigned_to_name,
      assigned_by_id: taskDoc.assigned_by_id,
      assigned_manager_id: taskDoc.assigned_manager_id,
      assigned_manager_name,
      created_by_id: taskDoc.created_by_id,
      created_by_name,
      department_id: taskDoc.department_id,
      priority: taskDoc.priority,
      priority_name: formatPriorityName(taskDoc.priority),
      status: taskDoc.status,
      status_name: formatStatusName(taskDoc.status),
      due_date: toDateOnlyISO(taskDoc.due_date),
      original_due_date: toDateOnlyISO(taskDoc.original_due_date),
      due_time: taskDoc.due_time,
      started_at: taskDoc.started_at?.toISOString(),
      completed_at: taskDoc.completed_at?.toISOString(),
      submitted_at: taskDoc.completed_at?.toISOString(),
      submitted_by_name: assigned_to_name,
      parent_task_id: taskDoc.parent_task_id,
      carried_forward_from_id: taskDoc.carried_forward_from_id,
      carry_forward_count: taskDoc.carry_forward_count,
      notes: taskDoc.notes,
      attachments: taskDoc.attachments,
      estimated_hours: taskDoc.estimated_hours,
      actual_hours: taskDoc.actual_hours,
      rejection_reason: taskDoc.rejection_reason,
      rejection_count: taskDoc.rejection_count,
      task_type: taskDoc.task_type,
      task_type_name: (taskDoc.task_type || 'general').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      video_stage_id: taskDoc.video_stage_id,
      drive_link: taskDoc.drive_link,
      completion_notes: taskDoc.completion_notes,
      is_overdue,
      comments: [],
      created_at: formatDate(taskDoc.created_at),
      updated_at: formatDate(taskDoc.updated_at),
    };

    return NextResponse.json(taskResponse);
  } catch (error) {
    return handleError(error, 'Get task');
  }
}

async function patchHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const taskDoc = await TaskModel.findByNumericId(numericId);
    
    if (!taskDoc) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Django: Permission check - employee can only update their assigned tasks
    if (user.role === 'employee' && taskDoc.assigned_to_id !== user.userId) {
      return handleForbidden('You can only update your assigned tasks.');
    }

    const body = await request.json();
    const {
      title,
      description,
      client,
      video,
      assigned_to,
      assigned_manager,
      department,
      priority,
      status,
      due_date,
      due_time,
      notes,
      attachments,
      actual_hours,
      drive_link,
      completion_notes,
    } = body;

    // Django: Employee restrictions - only allowed fields
    if (user.role === 'employee') {
      const allowed = new Set(['status', 'notes', 'actual_hours', 'attachments']);
      const extra = Object.keys(body).filter(k => !allowed.has(k));
      if (extra.length > 0) {
        return handleForbidden('Employees cannot change those task fields.');
      }
    }

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (due_time !== undefined) updateData.due_time = due_time;
    if (notes !== undefined) updateData.notes = notes;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (actual_hours !== undefined) updateData.actual_hours = actual_hours;
    if (drive_link !== undefined) updateData.drive_link = drive_link;
    if (completion_notes !== undefined) updateData.completion_notes = completion_notes;

    // Handle client
    if (client !== undefined) {
      if (client === null || client === '') {
        updateData.client_id = undefined;
      } else {
        const clientDoc = await ClientModel.findByNumericId(client);
        if (!clientDoc) {
          return NextResponse.json(
            { error: 'Client not found.' },
            { status: 400 }
          );
        }
        updateData.client_id = client;
      }
    }

    // Handle assigned_to
    if (assigned_to !== undefined) {
      if (assigned_to === null || assigned_to === '') {
        updateData.assigned_to_id = undefined;
      } else {
        const assignee = await UserModel.findByNumericId(assigned_to);
        if (!assignee) {
          return NextResponse.json(
            { error: 'Assigned user not found.' },
            { status: 400 }
          );
        }
        updateData.assigned_to_id = assigned_to;
      }
    }

    // Handle assigned_manager
    if (assigned_manager !== undefined) {
      if (assigned_manager === null || assigned_manager === '') {
        updateData.assigned_manager_id = undefined;
      } else {
        const manager = await UserModel.findByNumericId(assigned_manager);
        if (!manager) {
          return NextResponse.json(
            { error: 'Assigned manager not found.' },
            { status: 400 }
          );
        }
        updateData.assigned_manager_id = assigned_manager;
      }
    }

    if (department !== undefined) updateData.department_id = department || undefined;

    // Normalize due date to a stable date-only value (UTC midnight)
    if (due_date !== undefined) {
      if (due_date === null || due_date === '') {
        updateData.due_date = undefined;
      } else {
        const parsed = parseDueDateUTC(due_date);
        if (!parsed) {
          return handleValidationError('Invalid due date. Use YYYY-MM-DD format.');
        }
        updateData.due_date = parsed;
      }
    }

    // Django: Status change validation - only assignee can start or complete
    if (status !== undefined) {
      if (status === TaskStatus.IN_PROGRESS || status === TaskStatus.COMPLETED) {
        if (taskDoc.assigned_to_id !== user.userId) {
          return handleForbidden('Only the assigned employee can start or complete this task.');
        }
      }
      updateData.status = status;
    }

    const oldStatus = taskDoc.status;
    const updatedTask = await TaskModel.update(numericId, updateData);
    
    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    // Django: Log status change
    if (status !== undefined && oldStatus !== updatedTask.status) {
      await logActivity({
        actorId: user.userId,
        action: 'STATUS_CHANGE',
        entityType: 'task',
        entityId: taskDoc.numeric_id.toString(),
        description: `Task '${updatedTask.title}' status changed from ${oldStatus} to ${updatedTask.status}`,
        metadata: { from: oldStatus, to: updatedTask.status },
        request,
      });
    }

    // Django: When a task that was auto-created from a Video Protocol stage is
    // completed, mirror the native video-stage completion so the related Video
    // Protocol stage, progress, and aggregates stay in sync. This reuses the
    // exact same helper the protocol page uses (loadProtocolContent ->
    // refreshProtocolAggregates); no second status system is introduced.
    if (updatedTask.status === TaskStatus.COMPLETED && updatedTask.video_stage_id) {
      const linkedStage = await VideoStageModel.findByNumericId(updatedTask.video_stage_id);
      if (linkedStage && linkedStage.status !== 'completed') {
        await VideoStageModel.update(linkedStage.numeric_id, {
          status: 'completed',
          completed_at: new Date(),
          completion_notes: updatedTask.completion_notes || undefined,
          drive_link: updatedTask.drive_link || undefined,
        });

        // Recompute + persist protocol aggregates via the existing single
        // source of truth (used by the dashboard/detail routes).
        const linkedRecord = await VideoRecordModel.findByNumericId(linkedStage.video_record_id);
        if (linkedRecord) {
          const linkedProtocol = await VideoProtocolModel.findByNumericId(linkedRecord.protocol_id);
          if (linkedProtocol) {
            await loadProtocolContent(linkedProtocol);
          }
        }
      }
    }

    let client_name = null;
    if (updatedTask.client_id) {
      client_name = getClientNameById(updatedTask.client_id);
    }

    let assigned_to_name = null;
    if (updatedTask.assigned_to_id) {
      assigned_to_name = formatUserName(updatedTask.assigned_to_id);
    }

    const is_overdue = updatedTask.due_date && isOverdueByDate(updatedTask.due_date) && updatedTask.status !== TaskStatus.COMPLETED;

    const taskResponse = {
      id: updatedTask.numeric_id,
      task_id: updatedTask.task_id,
      title: updatedTask.title,
      description: updatedTask.description,
      client_id: updatedTask.client_id,
      client_name,
      video_id: updatedTask.video_id,
      assigned_to_id: updatedTask.assigned_to_id,
      assigned_to_name,
      assigned_by_id: updatedTask.assigned_by_id,
      assigned_manager_id: updatedTask.assigned_manager_id,
      created_by_id: updatedTask.created_by_id,
      department_id: updatedTask.department_id,
      priority: updatedTask.priority,
      priority_name: formatPriorityName(updatedTask.priority),
      status: updatedTask.status,
      status_name: formatStatusName(updatedTask.status),
      due_date: toDateOnlyISO(updatedTask.due_date),
      original_due_date: toDateOnlyISO(updatedTask.original_due_date),
      due_time: updatedTask.due_time,
      started_at: updatedTask.started_at?.toISOString(),
      completed_at: updatedTask.completed_at?.toISOString(),
      submitted_at: updatedTask.completed_at?.toISOString(),
      submitted_by_name: assigned_to_name,
      parent_task_id: updatedTask.parent_task_id,
      carried_forward_from_id: updatedTask.carried_forward_from_id,
      carry_forward_count: updatedTask.carry_forward_count,
      notes: updatedTask.notes,
      attachments: updatedTask.attachments,
      estimated_hours: updatedTask.estimated_hours,
      actual_hours: updatedTask.actual_hours,
      rejection_reason: updatedTask.rejection_reason,
      rejection_count: updatedTask.rejection_count,
      task_type: updatedTask.task_type,
      task_type_name: (updatedTask.task_type || 'general').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      video_stage_id: updatedTask.video_stage_id,
      drive_link: updatedTask.drive_link,
      completion_notes: updatedTask.completion_notes,
      is_overdue,
      comments: [],
      created_at: formatDate(updatedTask.created_at),
      updated_at: formatDate(updatedTask.updated_at),
    };

    return NextResponse.json(taskResponse);
  } catch (error) {
    return handleError(error, 'Update task');
  }
}

async function deleteHandler(request: NextRequest, user: any, id: string) {
  try {
    if (user.role === 'employee') {
      return handleForbidden('Employees cannot delete tasks');
    }

    const numericId = parseInt(id);
    const taskDoc = await TaskModel.findByNumericId(numericId);
    
    if (!taskDoc) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    await TaskModel.delete(numericId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Delete task');
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => getHandler(req, user, id))(request);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => patchHandler(req, user, id))(request);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => deleteHandler(req, user, id))(request);
}

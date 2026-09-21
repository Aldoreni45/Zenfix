import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { TaskStatus } from '@/lib/types/models';
import { formatUserName, getClientNameById, getDepartmentNameById, formatStatusName, formatPriorityName } from '@/lib/api-helpers/data-enrichment';
import { formatDate, formatDateRequired } from '@/lib/api-helpers/response-formatter';
import { handleError, handleValidationError, handleForbidden } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { sendTaskAssignmentNotification } from '@/lib/api-helpers/notification-helper';
import { getDaysUntilDue, isOverdueByDate, parseDueDateUTC, toDateOnlyISO } from '@/lib/date-utils';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const department = searchParams.get('department');
    const client = searchParams.get('client');
    const assigned_to = searchParams.get('assigned_to');
    const search = searchParams.get('search');

    const filters: any = {};
    
    // Role-based filtering
    if (user.role === 'owner' || user.role === 'manager') {
      // No filtering - see all
    } else {
      filters.assigned_to_id = user.userId;
    }

    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (department) filters.department_id = parseInt(department);
    if (client) filters.client_id = parseInt(client);
    if (assigned_to) filters.assigned_to_id = parseInt(assigned_to);
    
    let tasks;
    if (search) {
      tasks = await TaskModel.findAll({
        ...filters,
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { task_id: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    } else {
      tasks = await TaskModel.findAll(filters);
    }

    const tasksWithDetails = await Promise.all(
      tasks.map(async (t) => {
        let client_name = null;
        if (t.client_id) {
          const client = await ClientModel.findByNumericId(t.client_id);
          client_name = client?.name || null;
        }

        let assigned_to_name = null;
        if (t.assigned_to_id) {
          const assignee = await UserModel.findByNumericId(t.assigned_to_id);
          assigned_to_name = assignee ? `${assignee.first_name} ${assignee.last_name}`.trim() || assignee.username : null;
        }

        let assigned_manager_name = null;
        if (t.assigned_manager_id) {
          const manager = await UserModel.findByNumericId(t.assigned_manager_id);
          assigned_manager_name = manager ? `${manager.first_name} ${manager.last_name}`.trim() || manager.username : null;
        }

        let created_by_name = null;
        if (t.created_by_id) {
          const creator = await UserModel.findByNumericId(t.created_by_id);
          created_by_name = creator ? `${creator.first_name} ${creator.last_name}`.trim() || creator.username : null;
        }

        let video_code = null;
        if (t.video_id) {
          const VideoModel = (await import('@/lib/mongodb/models/video')).VideoModel;
          const video = await VideoModel.findByNumericId(t.video_id);
          video_code = video?.video_code || null;
        }

        const is_overdue = t.due_date && isOverdueByDate(t.due_date) && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED;

        return {
          id: t.numeric_id,
          task_id: t.task_id,
          title: t.title,
          description: t.description,
          client_id: t.client_id,
          client_name,
          video_id: t.video_id,
          video_code,
          assigned_to_id: t.assigned_to_id,
          assigned_to_name,
          assigned_by_id: t.assigned_by_id,
          assigned_manager_id: t.assigned_manager_id,
          assigned_manager_name,
          created_by_id: t.created_by_id,
          created_by_name,
          department_id: t.department_id,
          priority: t.priority,
          priority_name: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
          status: t.status,
          status_name: t.status.charAt(0).toUpperCase() + t.status.slice(1).replace('_', ' '),
          due_date: toDateOnlyISO(t.due_date),
          original_due_date: toDateOnlyISO(t.original_due_date),
          due_time: t.due_time,
          started_at: t.started_at?.toISOString(),
          completed_at: t.completed_at?.toISOString(),
          submitted_at: t.completed_at?.toISOString(),
          submitted_by_name: assigned_to_name,
          parent_task_id: t.parent_task_id,
          carried_forward_from_id: t.carried_forward_from_id,
          carry_forward_count: t.carry_forward_count,
          notes: t.notes,
          attachments: t.attachments,
          estimated_hours: t.estimated_hours,
          actual_hours: t.actual_hours,
          rejection_reason: t.rejection_reason,
          rejection_count: t.rejection_count,
          task_type: t.task_type,
          task_type_name: (t.task_type || 'general').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          video_stage_id: t.video_stage_id,
          drive_link: t.drive_link,
          completion_notes: t.completion_notes,
          is_overdue,
          comments: [],
          created_at: t.created_at.toISOString(),
          updated_at: t.updated_at.toISOString(),
        };
      })
    );

    return NextResponse.json(tasksWithDetails);
  } catch (error) {
    return handleError(error, 'List tasks');
  }
}

async function createHandler(request: NextRequest, user: any) {
  try {
    // Django: Employees cannot create tasks
    if (user.role === 'employee') {
      return NextResponse.json(
        { error: 'Employees cannot create tasks.' },
        { status: 403 }
      );
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
      priority = 'MEDIUM',
      status = TaskStatus.PENDING,
      due_date,
      due_time,
      parent_task,
      notes,
      attachments,
      estimated_hours,
      task_type,
      video_stage,
    } = body;

    if (!title) {
      return handleValidationError('Title is required');
    }

    // Validate client
    let client_id = null;
    if (client) {
      const clientDoc = await ClientModel.findByNumericId(client);
      if (!clientDoc) {
        return handleValidationError('Client not found');
      }
      client_id = client;
    }

    // Validate assigned_to
    let assigned_to_id = null;
    if (assigned_to) {
      const userDoc = await UserModel.findByNumericId(assigned_to);
      if (!userDoc) {
        return handleValidationError('Assigned user not found');
      }
      assigned_to_id = assigned_to;
    }

    // Validate assigned_manager
    let assigned_manager_id = null;
    if (assigned_manager) {
      const managerDoc = await UserModel.findByNumericId(assigned_manager);
      if (!managerDoc) {
        return handleValidationError('Manager not found');
      }
      assigned_manager_id = assigned_manager;
    }

    // Normalize due date to a stable date-only value (UTC midnight)
    let dueDateParsed: Date | null = null;
    if (due_date) {
      dueDateParsed = parseDueDateUTC(due_date);
      if (!dueDateParsed) {
        return handleValidationError('Invalid due date. Use YYYY-MM-DD format.');
      }
      const daysUntilDue = getDaysUntilDue(due_date);
      if (daysUntilDue !== null && daysUntilDue < 0) {
        return handleValidationError('Due date cannot be in the past.');
      }
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
      due_date: dueDateParsed || undefined,
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
      original_due_date: dueDateParsed || undefined,
    });

    // Django: Set original_due_date if due_date provided and not already set
    if (newTask.due_date && !newTask.original_due_date) {
      await TaskModel.update(newTask.numeric_id, {
        original_due_date: newTask.due_date
      });
    }

    // Log activity
    await logActivity({
      actorId: user.userId,
      action: 'CREATE',
      entityType: 'task',
      entityId: newTask.numeric_id.toString(),
      description: `Created task ${newTask.title}`,
      request,
    });

    // Django: Send notification to assigned user
    if (assigned_to_id) {
      await sendTaskAssignmentNotification(assigned_to_id, newTask.title, newTask.numeric_id.toString());
    }

    let client_name = null;
    if (newTask.client_id) {
      const client = await ClientModel.findByNumericId(newTask.client_id);
      client_name = client?.name || null;
    }

    let assigned_to_name = null;
    if (newTask.assigned_to_id) {
      const assignee = await UserModel.findByNumericId(newTask.assigned_to_id);
      assigned_to_name = assignee ? `${assignee.first_name} ${assignee.last_name}`.trim() || assignee.username : null;
    }

    const is_overdue = newTask.due_date && isOverdueByDate(newTask.due_date) && newTask.status !== TaskStatus.COMPLETED;

    const taskResponse = {
      id: newTask.numeric_id,
      task_id: newTask.task_id,
      title: newTask.title,
      description: newTask.description,
      client_id: newTask.client_id,
      client_name,
      video_id: newTask.video_id,
      assigned_to_id: newTask.assigned_to_id,
      assigned_to_name,
      assigned_by_id: newTask.assigned_by_id,
      assigned_manager_id: newTask.assigned_manager_id,
      created_by_id: newTask.created_by_id,
      department_id: newTask.department_id,
      priority: newTask.priority,
      priority_name: newTask.priority.charAt(0).toUpperCase() + newTask.priority.slice(1),
      status: newTask.status,
      status_name: newTask.status.charAt(0).toUpperCase() + newTask.status.slice(1).replace('_', ' '),
      due_date: toDateOnlyISO(newTask.due_date),
      original_due_date: toDateOnlyISO(newTask.original_due_date),
      due_time: newTask.due_time,
      started_at: newTask.started_at?.toISOString(),
      completed_at: newTask.completed_at?.toISOString(),
      submitted_at: newTask.completed_at?.toISOString(),
      submitted_by_name: assigned_to_name,
      parent_task_id: newTask.parent_task_id,
      carried_forward_from_id: newTask.carried_forward_from_id,
      carry_forward_count: newTask.carry_forward_count,
      notes: newTask.notes,
      attachments: newTask.attachments,
      estimated_hours: newTask.estimated_hours,
      actual_hours: newTask.actual_hours,
      rejection_reason: newTask.rejection_reason,
      rejection_count: newTask.rejection_count,
      task_type: newTask.task_type,
      task_type_name: (newTask.task_type || 'general').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      video_stage_id: newTask.video_stage_id,
      drive_link: newTask.drive_link,
      completion_notes: newTask.completion_notes,
      is_overdue,
      comments: [],
      created_at: newTask.created_at.toISOString(),
      updated_at: newTask.updated_at.toISOString(),
    };

    return NextResponse.json(taskResponse, { status: 201 });
  } catch (error) {
    return handleError(error, 'Create task');
  }
}

export const GET = requireAuth(handler);
export const POST = requireAuth(createHandler);

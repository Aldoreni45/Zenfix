import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { DepartmentModel } from '@/lib/mongodb/models/department';
import { TaskStatus } from '@/lib/types/models';
import { formatUserName, getClientNameById, getDepartmentNameById, formatStatusName, formatPriorityName } from '@/lib/api-helpers/data-enrichment';
import { handleError } from '@/lib/api-helpers/error-handler';
import { isOverdueByDate, parseDueDateUTC, toDateOnlyISO } from '@/lib/date-utils';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const now = new Date();
    const fallbackDayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dayStart = (dateParam && parseDueDateUTC(dateParam)) || fallbackDayStart;
    const nextDayStart = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const filters: any = {
      due_date: { $gte: dayStart, $lt: nextDayStart },
      status: { $nin: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] }
    };

    // Role-based filtering
    if (user.role === 'owner' || user.role === 'manager') {
      // No filtering - see all
    } else {
      filters.assigned_to_id = user.userId;
    }

    const tasks = await TaskModel.findAll(filters);

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

        const is_overdue = t.due_date && isOverdueByDate(t.due_date) && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED;

        return {
          id: t.numeric_id,
          task_id: t.task_id,
          title: t.title,
          description: t.description,
          client_id: t.client_id,
          client_name,
          video_id: t.video_id,
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
    return handleError(error, 'Today tasks');
  }
}

export const GET = requireAuth(handler);

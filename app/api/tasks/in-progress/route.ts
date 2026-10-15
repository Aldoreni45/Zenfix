import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { TaskStatus } from '@/lib/types/models';
import { formatUserName, getClientNameById, getDepartmentNameById, formatStatusName, formatPriorityName } from '@/lib/api-helpers/data-enrichment';
import { isOverdueByDate, toDateOnlyISO } from '@/lib/date-utils';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const now = new Date();
    const today = (dateParam && new Date(dateParam)) || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const filters: any = {
      status: TaskStatus.IN_PROGRESS,
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
          assigned_to_name = assignee?.username || null;
        }

        const is_overdue = t.due_date && isOverdueByDate(t.due_date) && t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED;

        return {
          id: t.numeric_id,
          task_id: t.task_id,
          title: t.title,
          description: t.description,
          client_id: t.client_id,
          client_name,
          assigned_to_id: t.assigned_to_id,
          assigned_to_name,
          priority: t.priority,
          priority_name: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
          status: t.status,
          status_name: t.status.charAt(0).toUpperCase() + t.status.slice(1).replace('_', ' '),
          due_date: toDateOnlyISO(t.due_date),
          due_time: t.due_time,
          started_at: t.started_at?.toISOString(),
          task_type: t.task_type,
          task_type_name: (t.task_type || 'general').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          video_stage_id: t.video_stage_id,
          is_overdue,
          created_at: t.created_at.toISOString(),
          updated_at: t.updated_at.toISOString(),
        };
      })
    );

    return NextResponse.json(tasksWithDetails);
  } catch (error) {
    return handleError(error, 'Get in-progress tasks');
  }
}

export const GET = requireAuth(handler);

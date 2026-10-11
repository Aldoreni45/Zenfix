import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { TaskStatus } from '@/lib/types/models';
import { isOverdueByDate, toDateOnlyISO } from '@/lib/date-utils';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const now = new Date();
    const today = (dateParam && new Date(dateParam)) || new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const filters: any = {
      status: TaskStatus.COMPLETED,
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
          completed_at: t.completed_at?.toISOString(),
          task_type: t.task_type,
          task_type_name: (t.task_type || 'general').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          video_stage_id: t.video_stage_id,
          created_at: t.created_at.toISOString(),
          updated_at: t.updated_at.toISOString(),
        };
      })
    );

    return NextResponse.json(tasksWithDetails);
  } catch (error) {
    return handleError(error, 'Get completed tasks');
  }
}

export const GET = requireAuth(handler);

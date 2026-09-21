import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ClientModel } from '@/lib/mongodb/models/client';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { formatUserName } from '@/lib/api-helpers/data-enrichment';

export const GET = requireOwner(async function handler(request: NextRequest, _user: any) {
  try {
    const taskId = Number(request.nextUrl.pathname.split('/').at(-1) ?? '0');
    if (!Number.isFinite(taskId)) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const task = await TaskModel.findByNumericId(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const [client, assignee, creator, logs] = await Promise.all([
      task.client_id ? ClientModel.findByNumericId(task.client_id) : null,
      task.assigned_to_id ? UserModel.findByNumericId(task.assigned_to_id) : null,
      task.created_by_id ? UserModel.findByNumericId(task.created_by_id) : null,
      ActivityLogModel.findAll({ entity_type: 'task', entity_id: String(task.numeric_id) }, 50),
    ]);

    const payload = {
      task: {
        id: task.numeric_id,
        numeric_id: task.numeric_id,
        task_id: task.task_id,
        title: task.title,
        description: task.description || '',
        client_id: task.client_id ?? null,
        client_name: client?.name || '',
        assigned_to_id: task.assigned_to_id ?? null,
        assigned_to_name: assignee ? formatUserName(assignee) : null,
        created_by_id: task.created_by_id ?? null,
        created_by_name: creator ? formatUserName(creator) : null,
        video_code: task.task_id,
        priority: task.priority,
        priority_name: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : '',
        status: task.status,
        status_name: task.status ? task.status.replace(/_/g, ' ') : '',
        due_date: task.due_date ? task.due_date.toISOString().slice(0, 10) : null,
        due_time: task.due_time || null,
        started_at: task.started_at ? task.started_at.toISOString() : null,
        completed_at: task.completed_at ? task.completed_at.toISOString() : null,
        submitted_at: task.completed_at ? task.completed_at.toISOString() : null,
        carry_forward_count: task.carry_forward_count || 0,
        drive_link: task.drive_link || '',
        completion_notes: task.completion_notes || '',
        task_type: task.task_type || 'task',
        task_type_name: task.task_type ? task.task_type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : 'Task',
        created_at: task.created_at.toISOString(),
        updated_at: task.updated_at.toISOString(),
      },
      timeline: logs
        .slice()
        .reverse()
        .map((log) => ({
          id: log.numeric_id,
          action: log.action,
          action_name: log.action.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          description: log.description || `${log.entity_type} updated`,
          user_name: assignee ? formatUserName(assignee) : 'System',
          timestamp: log.created_at.toISOString(),
        })),
    };

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task history task detail error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
});

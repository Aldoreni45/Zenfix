import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { ClientModel } from '@/lib/mongodb/models/client';
import { formatUserName } from '@/lib/api-helpers/data-enrichment';
import { toDateOnlyISO } from '@/lib/date-utils';

function parseDateRange(searchParams: URLSearchParams): { start: Date; end: Date } | null {
  if (searchParams.get('all') === '1') return null;

  const startRaw = searchParams.get('start');
  const endRaw = searchParams.get('end');

  if (!startRaw && !endRaw) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return { start, end };
  }

  if (!startRaw || !endRaw) {
    throw new Error('Both start and end dates are required.');
  }

  const start = new Date(`${startRaw}T00:00:00`);
  const end = new Date(`${endRaw}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('Invalid date range.');
  }

  return { start, end };
}

async function handler(request: NextRequest, _user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const userParam = searchParams.get('user');
    const status = searchParams.get('status');
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(Math.max(1, Number.parseInt(searchParams.get('page_size') || '20', 10) || 20), 100);
    const range = parseDateRange(searchParams);
    console.info('[API][task-history/tasks] start', {
      userId: _user.userId,
      role: _user.role,
      start: searchParams.get('start'),
      end: searchParams.get('end'),
      all: searchParams.get('all'),
      filterUser: userParam,
      status,
      page,
      pageSize,
      search,
    });

    const filters: Record<string, any> = {};
    if (range) {
      filters.due_date = { $gte: range.start, $lte: range.end };
    }
    if (userParam) {
      filters.assigned_to_id = Number(userParam);
    }
    if (status) {
      filters.status = status;
    }

    const tasks = await TaskModel.findAll(filters);
    const filteredTasks = tasks.filter((task) => {
      if (!search) return true;
      const haystack = `${task.task_id} ${task.title} ${task.description || ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });

    const startIndex = (page - 1) * pageSize;
    const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize);

    const items = await Promise.all(
      paginatedTasks.map(async (task) => {
        const assignee = task.assigned_to_id ? await UserModel.findByNumericId(task.assigned_to_id) : null;
        const client = task.client_id ? await ClientModel.findByNumericId(task.client_id) : null;

        return {
          id: task.numeric_id,
          task_id: task.task_id,
          title: task.title,
          description: task.description || '',
          client_id: task.client_id ?? null,
          client_name: client?.name || '',
          assigned_to_id: task.assigned_to_id ?? null,
          assigned_to_name: assignee ? formatUserName(assignee) : null,
          status: task.status,
          status_name: task.status ? task.status.replace(/_/g, ' ') : '',
          priority: task.priority,
          priority_name: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : '',
          due_date: toDateOnlyISO(task.due_date),
          completed_at: task.completed_at ? task.completed_at.toISOString() : null,
          created_at: task.created_at.toISOString(),
        };
      })
    );

    const payload = {
      count: filteredTasks.length,
      page,
      page_size: pageSize,
      items,
    };
    console.info('[API][task-history/tasks] success', {
      userId: _user.userId,
      role: _user.role,
      count: payload.count,
      returned: payload.items.length,
      page: payload.page,
      page_size: payload.page_size,
    });
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task history tasks error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export const GET = requireOwner(handler);

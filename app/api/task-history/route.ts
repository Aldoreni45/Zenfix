import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { UserModel } from '@/lib/mongodb/models/user';
import { TaskStatus } from '@/lib/types/models';
import { formatUserName } from '@/lib/api-helpers/data-enrichment';
import { handleError } from '@/lib/api-helpers/error-handler';
import { toDateOnlyISO } from '@/lib/date-utils';

async function handler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const user_filter = searchParams.get('user');

    const filters: any = {};
    if (year) {
      filters.$expr = { $eq: [{ $year: '$created_at' }, parseInt(year)] };
    }
    if (user_filter) {
      filters.assigned_to_id = parseInt(user_filter);
    }

    const allTasks = await TaskModel.findAll(filters);

    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const pending = allTasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.ASSIGNED).length;
    const inProgress = allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const rejected = allTasks.filter(t => t.status === TaskStatus.REJECTED).length;
    const cancelled = allTasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    const overdue = allTasks.filter(t => t.status === TaskStatus.OVERDUE).length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const dueSoon = allTasks.filter(t => {
      if (!t.due_date || t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED) return false;
      const daysUntilDue = Math.ceil((t.due_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 3;
    }).length;

    const summary = {
      total,
      total_all_time: total,
      completed,
      pending,
      inProgress,
      rejected,
      cancelled,
      completionRate,
      dueSoon,
    };

    return NextResponse.json(summary);
  } catch (error) {
    return handleError(error, 'Task history summary');
  }
}

async function usersHandler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const allUsers = await UserModel.findAll();
    const nonOwnerUsers = allUsers.filter(u => u.role !== 'owner');

    const usersWithStats = await Promise.all(
      nonOwnerUsers.map(async (u) => {
        const filters: any = { assigned_to_id: u.numeric_id };
        if (year) {
          filters.$expr = { $eq: [{ $year: '$created_at' }, parseInt(year)] };
        }

        const userTasks = await TaskModel.findAll(filters);

        const assigned = userTasks.length;
        const completed = userTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const pending = userTasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.ASSIGNED).length;
        const inProgress = userTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
        const rejected = userTasks.filter(t => t.status === TaskStatus.REJECTED).length;
        const overdue = userTasks.filter(t => t.status === TaskStatus.OVERDUE).length;

        const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

        return {
          id: u.numeric_id,
          username: u.username,
          name: formatUserName(u),
          email: u.email,
          role: u.role,
          role_name: u.role.charAt(0).toUpperCase() + u.role.slice(1),
          department_id: u.department_id,
          department_name: null,
          status: u.status,
          assigned,
          completed,
          pending,
          inProgress,
          rejected,
          overdue,
          completionRate,
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error) {
    return handleError(error, 'Task history users');
  }
}

async function dailyHandler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const user_filter = searchParams.get('user');

    const filters: any = {};
    if (year) {
      filters.$expr = { $eq: [{ $year: '$created_at' }, parseInt(year)] };
    }
    if (user_filter) {
      filters.assigned_to_id = parseInt(user_filter);
    }

    const allTasks = await TaskModel.findAll(filters);

    // Group by date
    const dailyMap = new Map<string, any>();
    allTasks.forEach(t => {
      const dateKey = t.created_at.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          total: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          rejected: 0,
          overdue: 0,
        });
      }
      const day = dailyMap.get(dateKey);
      day.total++;
      if (t.status === TaskStatus.COMPLETED) day.completed++;
      else if (t.status === TaskStatus.PENDING || t.status === TaskStatus.ASSIGNED) day.pending++;
      else if (t.status === TaskStatus.IN_PROGRESS) day.inProgress++;
      else if (t.status === TaskStatus.REJECTED) day.rejected++;
      else if (t.status === TaskStatus.OVERDUE) day.overdue++;
    });

    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(dailyBreakdown);
  } catch (error) {
    return handleError(error, 'Task history daily');
  }
}

async function tasksHandler(request: NextRequest, user: any) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const user_filter = searchParams.get('user');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '50');

    const filters: any = {};
    if (year) {
      filters.$expr = { $eq: [{ $year: '$created_at' }, parseInt(year)] };
    }
    if (user_filter) {
      filters.assigned_to_id = parseInt(user_filter);
    }

    const allTasks = await TaskModel.findAll(filters);

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedTasks = allTasks.slice(start, end);

    const tasksWithDetails = await Promise.all(
      paginatedTasks.map(async (t) => {
        let assigned_to_name = null;
        if (t.assigned_to_id) {
          const assignee = await UserModel.findByNumericId(t.assigned_to_id);
          assigned_to_name = assignee ? formatUserName(assignee) : null;
        }

        return {
          id: t.numeric_id,
          task_id: t.task_id,
          title: t.title,
          description: t.description,
          assigned_to_id: t.assigned_to_id,
          assigned_to_name,
          status: t.status,
          status_name: t.status.charAt(0).toUpperCase() + t.status.slice(1).replace('_', ' '),
          priority: t.priority,
          priority_name: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
          due_date: toDateOnlyISO(t.due_date),
          completed_at: t.completed_at?.toISOString(),
          created_at: t.created_at.toISOString(),
        };
      })
    );

    return NextResponse.json({
      count: allTasks.length,
      page,
      page_size: pageSize,
      items: tasksWithDetails,
    });
  } catch (error) {
    return handleError(error, 'Task history tasks');
  }
}

export const GET = requireOwner(handler);

export async function GET_USERS(request: NextRequest) {
  return requireOwner(usersHandler)(request);
}

export async function GET_DAILY(request: NextRequest) {
  return requireOwner(dailyHandler)(request);
}

export async function GET_TASKS(request: NextRequest) {
  return requireOwner(tasksHandler)(request);
}

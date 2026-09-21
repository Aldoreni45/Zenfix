import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { TaskStatus } from '@/lib/types/models';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const filters: any = {};
    
    // Role-based filtering
    if (user.role === 'owner' || user.role === 'manager') {
      // No filtering - see all
    } else {
      filters.assigned_to_id = user.userId;
    }

    const allTasks = await TaskModel.findAll(filters);

    const total = allTasks.length;
    const completed = allTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const pending = allTasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.ASSIGNED).length;
    const in_progress = allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const rejected = allTasks.filter(t => t.status === TaskStatus.REJECTED).length;
    const cancelled = allTasks.filter(t => t.status === TaskStatus.CANCELLED).length;
    const overdue = allTasks.filter(t => t.status === TaskStatus.OVERDUE).length;

    const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      total,
      by_status: {
        pending,
        in_progress,
        completed,
        rejected,
        cancelled,
        overdue,
      },
      completion_rate,
    });
  } catch (error) {
    return handleError(error, 'Task summary');
  }
}

export const GET = requireAuth(handler);

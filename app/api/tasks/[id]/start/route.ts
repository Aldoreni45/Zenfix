import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { TaskStatus } from '@/lib/types/models';
import { handleError, handleForbidden } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';

async function handler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const taskDoc = await TaskModel.findByNumericId(numericId);
    
    if (!taskDoc) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Django: Task must be assigned to an employee before it can be started
    if (!taskDoc.assigned_to_id) {
      return NextResponse.json(
        { error: 'Task must be assigned to an employee before it can be started.' },
        { status: 400 }
      );
    }

    // Django: Only the assigned employee can start this task
    if (taskDoc.assigned_to_id !== user.userId) {
      return handleForbidden('Only the assigned employee can start this task.');
    }

    // Django: Task can only be started when pending or assigned or rejected
    if (
      taskDoc.status !== TaskStatus.PENDING &&
      taskDoc.status !== TaskStatus.ASSIGNED &&
      taskDoc.status !== TaskStatus.REJECTED
    ) {
      return NextResponse.json(
        { error: 'Task can only be started when pending or assigned.' },
        { status: 400 }
      );
    }

    const updatedTask = await TaskModel.update(numericId, {
      status: TaskStatus.IN_PROGRESS,
      started_at: new Date(),
    });

    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Failed to start task' },
        { status: 500 }
      );
    }

    // Log activity
    await logActivity({
      actorId: user.userId,
      action: 'UPDATE',
      entityType: 'task',
      entityId: taskDoc.numeric_id.toString(),
      description: `Task '${taskDoc.title}' started`,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Start task');
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => handler(req, user, id))(request);
}

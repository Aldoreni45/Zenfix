import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth(async (req, user) => {
    try {
      const taskId = Number(id);
      const task = await TaskModel.findByNumericId(taskId);
      
      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      // Verify the user is the assigned employee
      if (task.assigned_to !== user.userId) {
        return NextResponse.json(
          { error: 'Only the assigned employee can put a task on hold' },
          { status: 403 }
        );
      }

      // Only allow hold for in_progress tasks
      if (task.status !== 'in_progress') {
        return NextResponse.json(
          { error: 'Task must be in progress to put on hold' },
          { status: 400 }
        );
      }

      const updatedTask = await TaskModel.update(taskId, { status: 'on_hold' });
      
      // Log activity
      await ActivityLogModel.create({
        actor_id: user.userId,
        action: ActivityAction.STATUS_CHANGE,
        entity_type: 'task',
        entity_id: taskId.toString(),
        description: 'Task put on hold',
        metadata: { previous_status: task.status, new_status: 'on_hold' },
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent')?.substring(0, 300) || '',
      });

      return NextResponse.json(updatedTask);
    } catch (error) {
      console.error('Error putting task on hold:', error);
      return NextResponse.json(
        { error: 'Failed to put task on hold' },
        { status: 500 }
      );
    }
  })(request);
}

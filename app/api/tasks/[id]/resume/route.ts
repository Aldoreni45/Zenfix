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
          { error: 'Only the assigned employee can resume a task' },
          { status: 403 }
        );
      }

      // Only allow resume for on_hold tasks
      if (task.status !== 'on_hold') {
        return NextResponse.json(
          { error: 'Task must be on hold to resume' },
          { status: 400 }
        );
      }

      const updatedTask = await TaskModel.update(taskId, { status: 'in_progress' });
      
      // Log activity
      await ActivityLogModel.create({
        actor_id: user.userId,
        action: ActivityAction.STATUS_CHANGE,
        entity_type: 'task',
        entity_id: taskId.toString(),
        description: 'Task resumed',
        metadata: { previous_status: task.status, new_status: 'in_progress' },
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent')?.substring(0, 300) || '',
      });

      return NextResponse.json(updatedTask);
    } catch (error) {
      console.error('Error resuming task:', error);
      return NextResponse.json(
        { error: 'Failed to resume task' },
        { status: 500 }
      );
    }
  })(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { computeTaskWorkStats } from '@/lib/task-work-stats';

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
      if (task.assigned_to_id !== user.userId) {
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

      // Add new hold period
      const newHoldPeriod = {
        started_at: new Date(),
        ended_at: undefined,
        duration_seconds: undefined,
      };

      const updatedHoldPeriods = [...(task.hold_periods || []), newHoldPeriod];

      // Snapshot the stats at the moment work is paused (the open period keeps
      // growing in the API response while the task stays on hold).
      const workStats = computeTaskWorkStats({
        ...task,
        status: 'on_hold',
        hold_periods: updatedHoldPeriods,
      });

      const updatedTask = await TaskModel.update(taskId, {
        status: 'on_hold',
        hold_periods: updatedHoldPeriods,
        total_hold_seconds: workStats.total_hold_seconds,
        actual_work_seconds: workStats.actual_work_seconds,
        work_efficiency_percent: workStats.work_efficiency_percent,
      });
      
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

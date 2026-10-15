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
      if (task.assigned_to_id !== user.userId) {
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

      // Find the active hold period (the one without ended_at)
      const holdPeriods = task.hold_periods || [];
      const activeHoldIndex = holdPeriods.findIndex(hp => !hp.ended_at);
      
      if (activeHoldIndex === -1) {
        return NextResponse.json(
          { error: 'No active hold period found' },
          { status: 400 }
        );
      }

      // Calculate hold duration
      const holdEndedAt = new Date();
      const holdStartedAt = new Date(holdPeriods[activeHoldIndex].started_at);
      const holdDurationSeconds = Math.floor((holdEndedAt.getTime() - holdStartedAt.getTime()) / 1000);

      // Update the hold period
      holdPeriods[activeHoldIndex].ended_at = holdEndedAt;
      holdPeriods[activeHoldIndex].duration_seconds = holdDurationSeconds;

      // Calculate total hold time
      const newTotalHoldSeconds = (task.total_hold_seconds || 0) + holdDurationSeconds;

      // Calculate work efficiency
      // Total time from start to now (or completion if completed)
      const startTime = task.started_at ? new Date(task.started_at) : new Date(task.created_at);
      const endTime = task.completed_at ? new Date(task.completed_at) : new Date();
      const totalElapsedSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Work efficiency = (Total time - Hold time) / Total time * 100
      // If total time is 0, efficiency is 0
      let workEfficiency = 0;
      if (totalElapsedSeconds > 0) {
        const actualWorkSeconds = totalElapsedSeconds - newTotalHoldSeconds;
        workEfficiency = Math.max(0, Math.min(100, (actualWorkSeconds / totalElapsedSeconds) * 100));
      }

      const updatedTask = await TaskModel.update(taskId, {
        status: 'in_progress',
        hold_periods: holdPeriods,
        total_hold_seconds: newTotalHoldSeconds,
        actual_work_seconds: totalElapsedSeconds - newTotalHoldSeconds,
        work_efficiency_percent: Math.round(workEfficiency),
      });
      
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

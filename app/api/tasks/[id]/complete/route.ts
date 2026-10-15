import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { TaskModel } from '@/lib/mongodb/models/task';
import { UserModel } from '@/lib/mongodb/models/user';
import { VideoStageModel, VideoRecordModel, VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { TaskStatus } from '@/lib/types/models';
import { loadProtocolContent } from '@/lib/api-helpers/video-protocol';
import { handleError, handleForbidden, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { computeTaskWorkStats } from '@/lib/task-work-stats';

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

    // Django: Task must be assigned to an employee before it can be completed
    if (!taskDoc.assigned_to_id) {
      return NextResponse.json(
        { error: 'Task must be assigned to an employee before it can be completed.' },
        { status: 400 }
      );
    }

    // Django: Only the assigned employee can complete this task
    if (taskDoc.assigned_to_id !== user.userId) {
      return handleForbidden('Only the assigned employee can complete this task.');
    }

    // Django: Task cannot be completed in its current status
    const status = String(taskDoc.status || '').toLowerCase();
    if (
      status !== TaskStatus.IN_PROGRESS &&
      status !== TaskStatus.ASSIGNED &&
      status !== TaskStatus.PENDING &&
      status !== TaskStatus.SUBMITTED &&
      status !== TaskStatus.REJECTED
    ) {
      return NextResponse.json(
        { error: 'Task cannot be completed in its current status.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { drive_link, completion_notes, notes, actual_hours } = body;

    // Django: Drive link is required to complete a task
    if (!drive_link || drive_link.trim() === '') {
      return handleValidationError('Drive link is required to complete a task.');
    }

    const completedAt = new Date();

    // Calculate final work efficiency. Close any still-open hold period (the
    // UI prevents completing while on hold, but be defensive) and then let the
    // shared helper derive the exact same numbers the API returns on read.
    const holdPeriods = taskDoc.hold_periods || [];
    const activeHoldIndex = holdPeriods.findIndex(hp => !hp.ended_at);
    if (activeHoldIndex !== -1) {
      const holdStartedAt = new Date(holdPeriods[activeHoldIndex].started_at);
      holdPeriods[activeHoldIndex].ended_at = completedAt;
      holdPeriods[activeHoldIndex].duration_seconds = Math.floor(
        (completedAt.getTime() - holdStartedAt.getTime()) / 1000
      );
    }

    const workStats = computeTaskWorkStats(
      {
        ...taskDoc,
        hold_periods: holdPeriods,
        completed_at: completedAt,
      },
      completedAt
    );

    const updateData: any = {
      status: TaskStatus.COMPLETED,
      completed_at: completedAt,
      drive_link: drive_link.trim(),
      completion_notes: completion_notes || undefined,
      hold_periods: holdPeriods,
      total_hold_seconds: workStats.total_hold_seconds,
      actual_work_seconds: workStats.actual_work_seconds,
      work_efficiency_percent: workStats.work_efficiency_percent,
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (actual_hours !== undefined) {
      updateData.actual_hours = actual_hours;
    }

    const updatedTask = await TaskModel.update(numericId, updateData);

    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Failed to complete task' },
        { status: 500 }
      );
    }

    // Django: When a task that was auto-created from a Video Protocol stage is
    // completed, mirror the native video-stage completion so the related Video
    // Protocol stage, progress, and aggregates stay in sync. This reuses the
    // exact same helper as the protocol page (loadProtocolContent ->
    // refreshProtocolAggregates); no second status system is introduced.
    if (updatedTask.status === TaskStatus.COMPLETED && updatedTask.video_stage_id) {
      const linkedStage = await VideoStageModel.findByNumericId(updatedTask.video_stage_id);
      if (linkedStage && linkedStage.status !== 'completed') {
        await VideoStageModel.update(linkedStage.numeric_id, {
          status: 'completed',
          completed_at: new Date(),
          completion_notes: updatedTask.completion_notes || undefined,
          drive_link: updatedTask.drive_link || undefined,
        });

        // Recompute + persist protocol aggregates via the existing single
        // source of truth (used by the dashboard/detail routes).
        const linkedRecord = await VideoRecordModel.findByNumericId(linkedStage.video_record_id);
        if (linkedRecord) {
          const linkedProtocol = await VideoProtocolModel.findByNumericId(linkedRecord.protocol_id);
          if (linkedProtocol) {
            await loadProtocolContent(linkedProtocol);
          }
        }
      }
    }

    // Log activity
    await logActivity({
      actorId: user.userId,
      action: 'SUBMIT',
      entityType: 'task',
      entityId: taskDoc.numeric_id.toString(),
      description: `Task '${taskDoc.title}' completed`,
      request,
    });

    // Django: Notify created_by if different from requester
    if (taskDoc.created_by_id && taskDoc.created_by_id !== user.userId) {
      const creator = await UserModel.findByNumericId(taskDoc.created_by_id);
      if (creator) {
        await NotificationModel.create({
          recipient_id: taskDoc.created_by_id,
          notification_type: 'task_completed',
          title: 'Task Completed',
          message: `"${taskDoc.title}" was completed by ${user.username}.`,
          is_read: false,
          related_object_type: 'task',
          related_object_id: taskDoc.numeric_id.toString(),
          priority: 'medium',
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Complete task');
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => handler(req, user, id))(request);
}

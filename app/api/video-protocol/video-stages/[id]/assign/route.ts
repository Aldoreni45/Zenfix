import { NextRequest, NextResponse } from 'next/server';
import { VideoStageModel, VideoRecordModel, VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { UserModel } from '@/lib/mongodb/models/user';
import { TaskModel } from '@/lib/mongodb/models/task';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { handleError, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { loadProtocolContent } from '@/lib/api-helpers/video-protocol';
import { parseDueDateUTC } from '@/lib/date-utils';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const stageId = parseInt(id);
      const body = await request.json();
      const { assigned_to, due_date, notes } = body;

      if (!assigned_to) {
        return handleValidationError('assigned_to is required.');
      }

      const stage = await VideoStageModel.findByNumericId(stageId);
      if (!stage) {
        return NextResponse.json(
          { error: 'Video stage not found' },
          { status: 404 }
        );
      }

      // Django: Validate user exists and is active
      const assignee = await UserModel.findByNumericId(assigned_to);
      if (!assignee || !assignee.is_active) {
        return handleValidationError('User not found or inactive.');
      }

      // Django: Update stage assignment
      const updateData: any = {
        assigned_to_id: assigned_to,
        notes,
      };

      if (due_date) {
        const parsedDueDate = parseDueDateUTC(due_date);
        if (!parsedDueDate) {
          return handleValidationError('Invalid due date. Use YYYY-MM-DD format.');
        }
        updateData.due_date = parsedDueDate;
      }

      // Django: If status is not_started, change to in_progress and set started_at
      if (stage.status === 'not_started') {
        updateData.status = 'in_progress';
        updateData.started_at = new Date();
      }

      await VideoStageModel.update(stageId, updateData);

      // Django: Auto-create task for the assigned user
      const video = await VideoRecordModel.findByNumericId(stage.video_record_id);
      const protocol = await VideoProtocolModel.findByNumericId(video?.protocol_id || 0);
      const client = protocol ? await (await import('@/lib/mongodb/models/client')).ClientModel.findByNumericId(protocol.client_id) : null;

      if (video && protocol && client) {
        const stageTypeDisplay = stage.stage_type || stage.stage_display || 'Stage';
        const taskTitle = `${stageTypeDisplay} - Video ${String(video.video_number).padStart(2, '0')} (${client.name} - ${MONTHS[protocol.month - 1]} ${protocol.year})`;
        
        const task = await TaskModel.create({
          title: taskTitle,
          description: `Auto-created from video protocol stage: ${stageTypeDisplay} for Video ${String(video.video_number).padStart(2, '0')}`,
          client_id: protocol.client_id,
          assigned_to_id: assigned_to,
          assigned_by_id: user.userId,
          video_stage_id: stage.numeric_id,
          priority: (stage.stage_type === 'shoot' || stage.stage_type === 'instagram_post') ? 'high' : 'medium',
          status: 'assigned',
          due_date: updateData.due_date,
          original_due_date: updateData.due_date,
          task_type: `video_protocol_${stage.stage_type}`,
          notes: `Video Protocol: ${client.name} - ${MONTHS[protocol.month - 1]} ${protocol.year}`,
          carry_forward_count: 0,
          attachments: [],
          estimated_hours: 0,
          rejection_count: 0,
        });

        // Django: Notify the assigned user
        await NotificationModel.create({
          recipient_id: assigned_to,
          notification_type: 'task_assigned',
          title: 'Task assigned',
          message: `You were assigned "${taskTitle}".`,
          is_read: false,
          related_object_type: 'task',
          related_object_id: task.numeric_id.toString(),
          priority: 'medium',
        });
      }

      // Refresh persisted protocol aggregates so list/dashboard views update
      if (video && protocol) {
        await loadProtocolContent(protocol);
      }

      // Log activity
      await logActivity({
        actorId: user.userId,
        action: 'ASSIGN',
        entityType: 'video_stage',
        entityId: stage.numeric_id.toString(),
        description: `Assigned video stage to ${assignee.first_name} ${assignee.last_name || assignee.username}`,
        metadata: { stage_type: stage.stage_type, assigned_to, due_date },
        request,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Assign video stage');
    }
  })(request);
}

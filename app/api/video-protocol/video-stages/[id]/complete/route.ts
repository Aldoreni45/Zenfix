import { NextRequest, NextResponse } from 'next/server';
import { VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { VideoRecordModel } from '@/lib/mongodb/models/video-protocol';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { TaskModel } from '@/lib/mongodb/models/task';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction, TaskStatus } from '@/lib/types/models';
import { handleError, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { loadProtocolContent } from '@/lib/api-helpers/video-protocol';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const stageId = parseInt(id);
      const body = await request.json();
      const { completion_notes, drive_link, instagram_url, caption } = body;

      const stage = await VideoStageModel.findByNumericId(stageId);
      if (!stage) {
        return NextResponse.json(
          { error: 'Video stage not found' },
          { status: 404 }
        );
      }

      // Django: Handle instagram_url and caption for INSTAGRAM_POST stage
      const updateData: any = {
        status: 'completed',
        completed_at: new Date(),
        completion_notes: completion_notes || undefined,
        drive_link: drive_link || undefined,
      };

      if (stage.stage_type === 'instagram_post') {
        updateData.instagram_url = instagram_url || stage.instagram_url;
        updateData.caption = caption || stage.caption;
      }

      if (drive_link) {
        updateData.drive_link = drive_link;
      }

      await VideoStageModel.update(stageId, updateData);

      // Django: Refresh persisted aggregates (video_status_counts,
      // workflow_progress, etc.) so list/dashboard views show current progress,
      // and mark the protocol completed once every video has been fully posted.
      const video = await VideoRecordModel.findByNumericId(stage.video_record_id);
      if (video) {
        const protocol = await VideoProtocolModel.findByNumericId(video.protocol_id);
        if (protocol) {
          await loadProtocolContent(protocol);
          const freshProtocol = await VideoProtocolModel.findByNumericId(protocol.numeric_id);
          if (
            freshProtocol &&
            protocol.target_videos > 0 &&
            (freshProtocol.video_status_counts?.posted || 0) >= protocol.target_videos
          ) {
            await VideoProtocolModel.update(protocol.numeric_id, { status: 'completed' });
          }
        }
      }

      // Stage and task are ONE logical piece of work: when the stage is
      // completed directly (Owner/Manager confirm), mirror the same completion
      // onto the linked assigned task so both sides stay in sync. Only the
      // completion metadata changes - the assignee is preserved and no new
      // task is ever created here.
      const linkedTasks = await TaskModel.findAll({
        video_stage_id: stage.numeric_id,
      } as any);
      for (const task of linkedTasks) {
        if (
          task.status === TaskStatus.COMPLETED ||
          task.status === TaskStatus.CANCELLED
        ) {
          continue;
        }
        const taskUpdate: any = {
          status: TaskStatus.COMPLETED,
          completed_at: new Date(),
          drive_link: drive_link || task.drive_link,
          completion_notes: completion_notes || task.completion_notes,
        };
        await TaskModel.update(task.numeric_id, taskUpdate);
      }

      // Log activity
      await logActivity({
        actorId: user.userId,
        action: 'SUBMIT',
        entityType: 'video_stage',
        entityId: stage.numeric_id.toString(),
        description: `Video stage '${stage.stage_display}' completed`,
        metadata: { stage_type: stage.stage_type },
        request,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Complete video stage');
    }
  })(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { VideoRecordModel } from '@/lib/mongodb/models/video-protocol';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { TaskModel } from '@/lib/mongodb/models/task';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { handleError, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const stageId = parseInt(id);
      const body = await request.json();
      const { rejection_reason, reject_to_stage } = body;

      if (!rejection_reason) {
        return handleValidationError('Rejection reason is required');
      }

      const stage = await VideoStageModel.findByNumericId(stageId);
      if (!stage) {
        return NextResponse.json(
          { error: 'Video stage not found' },
          { status: 404 }
        );
      }

      // Update stage to rejected
      await VideoStageModel.update(stageId, {
        status: 'rejected',
        rejection_reason,
      });

      // Django: Handle reject_to_stage - reset target stage to not_started
      if (reject_to_stage) {
        const allStages = await VideoStageModel.findAll({
          video_record_id: stage.video_record_id,
          stage_type: reject_to_stage,
        } as any);
        for (const targetStage of allStages) {
          await VideoStageModel.update(targetStage.numeric_id, {
            status: 'not_started',
            completed_at: undefined,
            started_at: undefined,
          });
        }
      }

      // Django: If protocol was completed, set back to active
      const video = await VideoRecordModel.findByNumericId(stage.video_record_id);
      if (video) {
        const protocol = await VideoProtocolModel.findByNumericId(video.protocol_id);
        if (protocol && protocol.status === 'completed') {
          await VideoProtocolModel.update(protocol.numeric_id, { status: 'active' });
        }
      }

      // Django: Reject related tasks
      const relatedTasks = await TaskModel.findAll({
        video_stage_id: stage.numeric_id,
        status: { $in: ['assigned', 'in_progress'] }
      } as any);
      for (const task of relatedTasks) {
        await TaskModel.update(task.numeric_id, {
          status: 'rejected',
          rejection_reason,
        });
      }

      // Log activity
      await logActivity({
        actorId: user.userId,
        action: 'REJECT',
        entityType: 'video_stage',
        entityId: stage.numeric_id.toString(),
        description: `Video stage '${stage.stage_display}' rejected`,
        metadata: { stage_type: stage.stage_type, reject_to_stage },
        request,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Reject video stage');
    }
  })(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { VideoRecordModel } from '@/lib/mongodb/models/video-protocol';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { handleError, handleForbidden } from '@/lib/api-helpers/error-handler';
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

      const stage = await VideoStageModel.findByNumericId(stageId);
      if (!stage) {
        return NextResponse.json(
          { error: 'Video stage not found' },
          { status: 404 }
        );
      }

      // Django: Only assigned user can start their stage
      if (stage.assigned_to_id && stage.assigned_to_id !== user.userId) {
        return handleForbidden('Only the assigned user can start this stage.');
      }

      // Django: Can only start if not_started
      if (stage.status !== 'not_started') {
        return NextResponse.json(
          { error: 'Stage can only be started when not_started' },
          { status: 400 }
        );
      }

      // Update stage to in_progress
      await VideoStageModel.update(stageId, {
        status: 'in_progress',
        started_at: new Date(),
        ...body,
      });

      // Refresh persisted protocol aggregates so list/dashboard views update.
      const video = await VideoRecordModel.findByNumericId(stage.video_record_id);
      if (video) {
        const protocol = await VideoProtocolModel.findByNumericId(video.protocol_id);
        if (protocol) {
          await loadProtocolContent(protocol);
        }
      }

      // Log activity
      await logActivity({
        actorId: user.userId,
        action: 'UPDATE',
        entityType: 'video_stage',
        entityId: stage.numeric_id.toString(),
        description: `Video stage '${stage.stage_display}' started`,
        metadata: { stage_type: stage.stage_type },
        request,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Start video stage');
    }
  })(request);
}

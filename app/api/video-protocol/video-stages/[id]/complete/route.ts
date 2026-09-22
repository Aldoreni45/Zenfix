import { NextRequest, NextResponse } from 'next/server';
import { VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { VideoRecordModel } from '@/lib/mongodb/models/video-protocol';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
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

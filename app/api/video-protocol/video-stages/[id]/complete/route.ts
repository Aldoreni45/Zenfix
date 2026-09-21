import { NextRequest, NextResponse } from 'next/server';
import { VideoStageModel } from '@/lib/mongodb/models/video-protocol';
import { VideoRecordModel } from '@/lib/mongodb/models/video-protocol';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
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

      // Django: Check if all videos in protocol are posted and mark protocol as completed
      const video = await VideoRecordModel.findByNumericId(stage.video_record_id);
      if (video) {
        const protocol = await VideoProtocolModel.findByNumericId(video.protocol_id);
        if (protocol) {
          const allVideos = await VideoRecordModel.findAll({ protocol_id: protocol.numeric_id });
          const postedStages = await VideoStageModel.findAll({
            video_record_id: { $in: allVideos.map(v => v.numeric_id) },
            stage_type: 'instagram_post',
            status: 'completed',
          } as any);
          
          if (postedStages.length >= allVideos.length && allVideos.length > 0) {
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

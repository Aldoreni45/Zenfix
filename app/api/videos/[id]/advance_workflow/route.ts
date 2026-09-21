import { NextRequest, NextResponse } from 'next/server';
import { VideoModel } from '@/lib/mongodb/models/video';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';

const WORKFLOW_ORDER = ['idea', 'script', 'shooting', 'editing', 'review', 'client_review', 'approved', 'posted'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const videoId = parseInt(id);

      const video = await VideoModel.findByNumericId(videoId);
      if (!video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        );
      }

      const currentIndex = WORKFLOW_ORDER.indexOf(video.status);
      if (currentIndex === -1) {
        return NextResponse.json(
          { error: 'Invalid current status' },
          { status: 400 }
        );
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= WORKFLOW_ORDER.length) {
        return NextResponse.json(
          { error: 'Video is already at final stage' },
          { status: 400 }
        );
      }

      const nextStatus = WORKFLOW_ORDER[nextIndex];

      // Update video status
      await VideoModel.update(videoId, { status: nextStatus as any });

      // Log activity
      await ActivityLogModel.create({
        actor_id: user.userId,
        action: ActivityAction.STATUS_CHANGE,
        entity_type: 'video',
        entity_id: String(videoId),
        description: `Video workflow advanced to ${nextStatus}`,
        metadata: { old_status: video.status, new_status: nextStatus },
      });

      return NextResponse.json({ success: true, new_status: nextStatus });
    } catch (error) {
      console.error('Error advancing video workflow:', error);
      return NextResponse.json(
        { error: 'Failed to advance video workflow' },
        { status: 500 }
      );
    }
  })(request);
}

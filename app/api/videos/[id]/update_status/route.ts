import { NextRequest, NextResponse } from 'next/server';
import { VideoModel } from '@/lib/mongodb/models/video';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const videoId = parseInt(id);
      const body = await request.json();
      const { status } = body;

      const validStatuses = ['idea', 'script', 'shooting', 'editing', 'review', 'client_review', 'approved', 'posted'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }

      const video = await VideoModel.findByNumericId(videoId);
      if (!video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        );
      }

      // Update video status
      await VideoModel.update(videoId, { status });

      // Log activity
      await ActivityLogModel.create({
        actor_id: user.userId,
        action: ActivityAction.STATUS_CHANGE,
        entity_type: 'video',
        entity_id: String(videoId),
        description: `Video status updated to ${status}`,
        metadata: { old_status: video.status, new_status: status },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating video status:', error);
      return NextResponse.json(
        { error: 'Failed to update video status' },
        { status: 500 }
      );
    }
  })(request);
}

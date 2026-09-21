import { NextRequest, NextResponse } from 'next/server';
import { VideoModel } from '@/lib/mongodb/models/video';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { handleError, handleForbidden } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const videoId = parseInt(id);
      const body = await request.json();
      const { rejection_reason } = body;

      if (!rejection_reason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }

      // Django: Employees cannot reject videos
      if (user.role === 'employee') {
        return handleForbidden('Employees cannot reject videos.');
      }

      const video = await VideoModel.findByNumericId(videoId);
      if (!video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        );
      }

      // Update video with rejection
      await VideoModel.update(videoId, {
        status: 'rejected' as any,
        rejection_reason,
        rejection_count: (video.rejection_count || 0) + 1,
      });

      // Log activity
      await logActivity({
        actorId: user.userId,
        action: 'REJECT',
        entityType: 'video',
        entityId: video.numeric_id.toString(),
        description: `Video '${video.title}' rejected`,
        metadata: { reason: rejection_reason },
        request,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error, 'Reject video');
    }
  })(request);
}

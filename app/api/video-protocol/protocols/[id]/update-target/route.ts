import { NextRequest, NextResponse } from 'next/server';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { requireOwnerOrManager } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { handleError, handleValidationError } from '@/lib/api-helpers/error-handler';
import { logActivity } from '@/lib/api-helpers/activity-logger';
import { syncProtocolTarget } from '@/lib/api-helpers/video-protocol';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const { id } = await params;
      const protocolId = parseInt(id);
      const body = await request.json();
      const { target_videos, confirm_reduction } = body;

      if (target_videos === undefined || target_videos === null) {
        return handleValidationError('target_videos is required');
      }

      if (target_videos < 0) {
        return handleValidationError('target_videos cannot be negative');
      }

      const protocol = await VideoProtocolModel.findByNumericId(protocolId);
      if (!protocol) {
        return NextResponse.json(
          { error: 'Protocol not found' },
          { status: 404 }
        );
      }

      // Django: Check if reducing target without confirmation
      if (target_videos < protocol.target_videos && !confirm_reduction) {
        return handleValidationError('confirm_reduction required when reducing target');
      }

      // Django: Update target
      await VideoProtocolModel.update(protocolId, { target_videos });

      // Django parity: reconcile video records with the new target
      await syncProtocolTarget(protocol, target_videos);

      // Log activity
      await logActivity({
        actorId: user.userId,
        action: 'UPDATE',
        entityType: 'monthly_video_protocol',
        entityId: protocol.numeric_id.toString(),
        description: `Monthly target updated from ${protocol.target_videos} to ${target_videos}`,
        metadata: { old_target: protocol.target_videos, new_target: target_videos },
        request,
      });

      return NextResponse.json({ success: true, target_videos });
    } catch (error) {
      return handleError(error, 'Update protocol target');
    }
  })(request);
}

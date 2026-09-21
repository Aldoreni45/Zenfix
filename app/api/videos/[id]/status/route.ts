import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { VideoModel } from '@/lib/mongodb/models/video';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { VideoStage } from '@/lib/types/models';

async function handler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const videoDoc = await VideoModel.findByNumericId(numericId);
    
    if (!videoDoc) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(VideoStage).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status.' },
        { status: 400 }
      );
    }

    const oldStatus = videoDoc.status;
    const updatedVideo = await VideoModel.update(numericId, { status });
    
    if (!updatedVideo) {
      return NextResponse.json(
        { error: 'Failed to update video status' },
        { status: 500 }
      );
    }

    // Log activity
    await ActivityLogModel.create({
      actor_id: user.userId,
      action: ActivityAction.STATUS_CHANGE,
      entity_type: 'video',
      entity_id: updatedVideo.numeric_id.toString(),
      description: `Video '${updatedVideo.title}' status changed from ${oldStatus} to ${status}`,
      metadata: { from: oldStatus, to: status },
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      user_agent: request.headers.get('user-agent')?.substring(0, 300) || '',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update video status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => handler(req, user, id))(request);
}

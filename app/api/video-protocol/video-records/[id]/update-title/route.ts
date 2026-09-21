import { NextRequest, NextResponse } from 'next/server';
import { VideoRecordModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth } from '@/lib/auth/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const recordId = parseInt(id);
      const body = await request.json();
      const { title } = body;

      if (!title) {
        return NextResponse.json(
          { error: 'title is required' },
          { status: 400 }
        );
      }

      const updated = await VideoRecordModel.update(recordId, { title });
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating video record title:', error);
      return NextResponse.json(
        { error: 'Failed to update video record title' },
        { status: 500 }
      );
    }
  })(request);
}

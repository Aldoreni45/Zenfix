import { NextRequest, NextResponse } from 'next/server';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth } from '@/lib/auth/middleware';
import { buildProtocolDashboard } from '@/lib/api-helpers/video-protocol';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const protocolId = parseInt(id);

      const protocol = await VideoProtocolModel.findByNumericId(protocolId);
      if (!protocol) {
        return NextResponse.json(
          { error: 'Protocol not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(await buildProtocolDashboard(protocol));
    } catch (error) {
      console.error('Error fetching protocol dashboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch protocol dashboard' },
        { status: 500 }
      );
    }
  })(request);
}
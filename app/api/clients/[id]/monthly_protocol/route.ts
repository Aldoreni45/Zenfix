import { NextRequest, NextResponse } from 'next/server';
import { ClientModel } from '@/lib/mongodb/models/client';
import { VideoProtocolModel } from '@/lib/mongodb/models/video-protocol';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const clientId = parseInt(id);
      
      const client = await ClientModel.findByNumericId(clientId);
      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Get monthly protocol
      const protocols = await VideoProtocolModel.findAll({
        client_id: client.numeric_id,
        month: currentMonth,
        year: currentYear,
      });
      
      const protocol = protocols[0] || null;

      if (!protocol) {
        return NextResponse.json(
          { error: 'No monthly protocol found for this client' },
          { status: 404 }
        );
      }

      return NextResponse.json(protocol);
    } catch (error) {
      console.error('Error fetching monthly protocol:', error);
      return NextResponse.json(
        { error: 'Failed to fetch monthly protocol' },
        { status: 500 }
      );
    }
  })(request);
}

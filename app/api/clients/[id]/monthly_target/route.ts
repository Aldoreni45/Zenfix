import { NextRequest, NextResponse } from 'next/server';
import { ClientModel } from '@/lib/mongodb/models/client';
import { MonthlyTargetModel } from '@/lib/mongodb/models/monthly-target';
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

      // Get monthly target
      const targets = await MonthlyTargetModel.findAll({
        client_id: client.numeric_id,
        month: currentMonth,
        year: currentYear,
      });
      
      const target = targets[0] || null;

      if (!target) {
        // Return default target from client
        return NextResponse.json({
          client_id: client.numeric_id,
          client_name: client.name,
          month: currentMonth,
          year: currentYear,
          target_videos: client.monthly_video_target || 0,
          completed_videos: 0,
          posted_videos: 0,
          pending_videos: 0,
          in_production_videos: 0,
          waiting_approval_videos: 0,
          remaining_videos: client.monthly_video_target || 0,
          progress_percentage: 0,
        });
      }

      return NextResponse.json(target);
    } catch (error) {
      console.error('Error fetching monthly target:', error);
      return NextResponse.json(
        { error: 'Failed to fetch monthly target' },
        { status: 500 }
      );
    }
  })(request);
}

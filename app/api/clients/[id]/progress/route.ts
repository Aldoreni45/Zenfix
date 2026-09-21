import { NextRequest, NextResponse } from 'next/server';
import { ClientModel } from '@/lib/mongodb/models/client';
import { MonthlyTargetModel } from '@/lib/mongodb/models/monthly-target';
import { VideoModel } from '@/lib/mongodb/models/video';
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
      const targetVideos = target?.target_videos || client.monthly_video_target || 0;
      
      // Get videos
      const videos = await VideoModel.findAll({
        client_id: client.numeric_id,
      });
      
      const completedVideos = videos.filter(v => 
        v.status === 'posted' || v.status === 'approved'
      ).length;
      
      const pendingVideos = videos.filter(v => 
        (v.status === 'shooting' || v.status === 'editing')
      ).length;
      
      const progressPercentage = targetVideos > 0 
        ? Math.round((completedVideos / targetVideos) * 100) 
        : 0;

      return NextResponse.json({
        client: {
          numeric_id: client.numeric_id,
          name: client.name,
          company_name: client.company_name,
        },
        target_videos: targetVideos,
        completed_videos: completedVideos,
        pending_videos: pendingVideos,
        progress_percentage: progressPercentage,
        remaining_videos: Math.max(0, targetVideos - completedVideos),
      });
    } catch (error) {
      console.error('Error fetching client progress:', error);
      return NextResponse.json(
        { error: 'Failed to fetch client progress' },
        { status: 500 }
      );
    }
  })(request);
}

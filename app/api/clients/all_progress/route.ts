import { NextRequest, NextResponse } from 'next/server';
import { ClientModel } from '@/lib/mongodb/models/client';
import { MonthlyTargetModel } from '@/lib/mongodb/models/monthly-target';
import { VideoModel } from '@/lib/mongodb/models/video';
import { requireOwnerOrManager } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireOwnerOrManager(async (req, user) => {
    try {
      const clients = await ClientModel.findAll({ status: 'active' });
      
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const progressData = await Promise.all(
        clients.map(async (client) => {
          // Get monthly target
          const targets = await MonthlyTargetModel.findAll({
            client_id: client.numeric_id,
            month: currentMonth,
            year: currentYear,
          });
          
          const target = targets[0] || null;
          const targetVideos = target?.target_videos || client.monthly_video_target || 0;
          
          // Get completed videos this month
          const videos = await VideoModel.findAll({
            client_id: client.numeric_id,
          });
          
          const completedVideos = videos.filter(v => 
            v.status === 'posted' || v.status === 'approved'
          ).length;
          
          const progressPercentage = targetVideos > 0 
            ? Math.round((completedVideos / targetVideos) * 100) 
            : 0;

          return {
            numeric_id: client.numeric_id,
            name: client.name,
            company_name: client.company_name,
            target_videos: targetVideos,
            completed_videos: completedVideos,
            progress_percentage: progressPercentage,
            remaining_videos: Math.max(0, targetVideos - completedVideos),
          };
        })
      );

      return NextResponse.json(progressData);
    } catch (error) {
      console.error('Error fetching all client progress:', error);
      return NextResponse.json(
        { error: 'Failed to fetch client progress' },
        { status: 500 }
      );
    }
  })(request);
}

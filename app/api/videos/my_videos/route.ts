import { NextRequest, NextResponse } from 'next/server';
import { VideoModel } from '@/lib/mongodb/models/video';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const videos = await VideoModel.findAll({
        assigned_to_id: user.userId,
      });

      // Enrich with client names
      const enrichedVideos = await Promise.all(
        videos.map(async (video) => {
          let client_name = null;
          if (video.client_id) {
            const ClientModel = (await import('@/lib/mongodb/models/client')).ClientModel;
            const client = await ClientModel.findByNumericId(video.client_id);
            if (client) {
              client_name = client.name;
            }
          }
          return {
            ...video,
            client_name,
          };
        })
      );

      return NextResponse.json(enrichedVideos);
    } catch (error) {
      console.error('Error fetching my videos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch my videos' },
        { status: 500 }
      );
    }
  })(request);
}

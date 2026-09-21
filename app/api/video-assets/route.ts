import { NextRequest, NextResponse } from 'next/server';
import { VideoAssetModel } from '@/lib/mongodb/models/video';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const videoId = searchParams.get('video');

      const filters: any = {};
      if (videoId) {
        filters.video_id = parseInt(videoId);
      }

      const assets = await VideoAssetModel.findAllAssets(filters);
      return NextResponse.json(assets);
    } catch (error) {
      console.error('Error fetching video assets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch video assets' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { video, file_url, kind } = body;

      if (!video || !file_url) {
        return NextResponse.json(
          { error: 'video and file_url are required' },
          { status: 400 }
        );
      }

      const asset = await VideoAssetModel.createAsset({
        video_id: video,
        uploaded_by_id: user.userId,
        file_url,
        kind: kind || 'file',
      });

      return NextResponse.json(asset, { status: 201 });
    } catch (error) {
      console.error('Error creating video asset:', error);
      return NextResponse.json(
        { error: 'Failed to create video asset' },
        { status: 500 }
      );
    }
  })(request);
}

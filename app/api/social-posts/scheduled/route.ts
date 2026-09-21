import { NextRequest, NextResponse } from 'next/server';
import { SocialPostModel } from '@/lib/mongodb/models/video';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const posts = await SocialPostModel.findAll({
        status: 'scheduled',
      });

      return NextResponse.json(posts);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scheduled posts' },
        { status: 500 }
      );
    }
  })(request);
}

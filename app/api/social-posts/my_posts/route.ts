import { NextRequest, NextResponse } from 'next/server';
import { SocialPostModel } from '@/lib/mongodb/models/video';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const posts = await SocialPostModel.findAll({
        created_by_id: user.userId,
      });

      return NextResponse.json(posts);
    } catch (error) {
      console.error('Error fetching my posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch my posts' },
        { status: 500 }
      );
    }
  })(request);
}

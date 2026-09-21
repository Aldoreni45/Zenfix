import { NextRequest, NextResponse } from 'next/server';
import { SocialPostModel } from '@/lib/mongodb/models/video';
import { requireAuth } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const postId = parseInt(id);
      const body = await request.json();
      const { instagram_url, engagement_stats } = body;

      const post = await SocialPostModel.findByNumericId(postId);
      if (!post) {
        return NextResponse.json(
          { error: 'Social post not found' },
          { status: 404 }
        );
      }

      // Update post as posted
      await SocialPostModel.update(postId, {
        status: 'posted',
        post_url: body.instagram_url || post.post_url,
        posted_date: new Date(),
        created_by_id: user.userId,
      });

      // Log activity
      await ActivityLogModel.create({
        actor_id: user.userId,
        action: ActivityAction.SUBMIT,
        entity_type: 'social_post',
        entity_id: String(postId),
        description: `Social post marked as posted`,
        metadata: { post_id: postId, instagram_url },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error marking post as posted:', error);
      return NextResponse.json(
        { error: 'Failed to mark post as posted' },
        { status: 500 }
      );
    }
  })(request);
}

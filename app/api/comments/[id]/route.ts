import { NextRequest, NextResponse } from 'next/server';
import { TaskCommentModel } from '@/lib/mongodb/models/task';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const commentId = parseInt(id);
      const comment = await TaskCommentModel.findByNumericId(commentId);

      if (!comment) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      // Enrich with author name
      const UserModel = (await import('@/lib/mongodb/models/user')).UserModel;
      const author = await UserModel.findByNumericId(comment.author_id);
      const enrichedComment = {
        ...comment,
        author_name: author ? `${author.first_name} ${author.last_name}` : 'Unknown',
      };

      return NextResponse.json(enrichedComment);
    } catch (error) {
      console.error('Error fetching comment:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comment' },
        { status: 500 }
      );
    }
  })(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const commentId = parseInt(id);
      const body = await request.json();

      const comment = await TaskCommentModel.findByNumericId(commentId);
      if (!comment) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      // Only author can update their own comment
      if (comment.author_id !== user.userId) {
        return NextResponse.json(
          { error: 'You can only update your own comments' },
          { status: 403 }
        );
      }

      const updated = await TaskCommentModel.update(commentId, body);
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const commentId = parseInt(id);

      const comment = await TaskCommentModel.findByNumericId(commentId);
      if (!comment) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

 // Only author can delete their own comment
      if (comment.author_id !== user.userId) {
        return NextResponse.json(
          { error: 'You can only delete your own comments' },
          { status: 403 }
        );
      }

      await TaskCommentModel.delete(commentId);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }
  })(request);
}

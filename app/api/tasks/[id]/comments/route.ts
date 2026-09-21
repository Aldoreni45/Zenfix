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
      const taskId = parseInt(id);

      const comments = await TaskCommentModel.findByTask(taskId);

      // Enrich with author names
      const enrichedComments = await Promise.all(
        comments.map(async (comment) => {
          const UserModel = (await import('@/lib/mongodb/models/user')).UserModel;
          const author = await UserModel.findByNumericId(comment.author_id);
          return {
            ...comment,
            author_name: author ? `${author.first_name} ${author.last_name}` : 'Unknown',
          };
        })
      );

      return NextResponse.json(enrichedComments);
    } catch (error) {
      console.error('Error fetching task comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch task comments' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const taskId = parseInt(id);
      const body = await request.json();
      const { comment } = body;

      if (!comment) {
        return NextResponse.json(
          { error: 'comment is required' },
          { status: 400 }
        );
      }

      const newComment = await TaskCommentModel.create({
        task_id: taskId,
        author_id: user.userId,
        comment,
      });

      return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
      console.error('Error creating task comment:', error);
      return NextResponse.json(
        { error: 'Failed to create task comment' },
        { status: 500 }
      );
    }
  })(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { TaskCommentModel } from '@/lib/mongodb/models/task';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const { searchParams } = new URL(request.url);
      const taskId = searchParams.get('task');

      const filters: any = {};
      if (taskId) {
        filters.task_id = parseInt(taskId);
      }

      // TaskCommentModel doesn't have findAll, use findByTask if task_id provided
      let comments: any[] = [];
      if (taskId) {
        comments = await TaskCommentModel.findByTask(parseInt(taskId));
      }

      // Enrich with author names
      const enrichedComments = await Promise.all(
        comments.map(async (comment: any) => {
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
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { task_id, comment } = body;

      if (!task_id || !comment) {
        return NextResponse.json(
          { error: 'task_id and comment are required' },
          { status: 400 }
        );
      }

      const newComment =	await TaskCommentModel.create({
        task_id: parseInt(task_id),
        author_id: user.userId,
        comment,
      });

      return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }
  })(request);
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Comment from '@/models/Comment';
import Notification from '@/models/Notification';
import ActivityLog from '@/models/ActivityLog';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const userId = (session.user as any).id;

    const comment = await Comment.create({
      taskId: id,
      userId,
      message: message.trim(),
    });

    // Populate user info for the response
    await comment.populate('userId', 'name email avatar role');

    // Notify other participants
    const participants = [task.assignedBy, task.assignedTo];
    for (const participantId of participants) {
      if (participantId.toString() !== userId) {
        await Notification.create({
          receiver: participantId,
          title: 'New Comment',
          message: `New comment on task "${task.title}"`,
          type: 'task_updated',
          read: false,
        });
      }
    }

    await ActivityLog.create({
      user: userId,
      action: 'task_updated',
      entity: 'task',
      entityId: task._id,
      details: { comment: 'added', taskTitle: task.title },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const comments = await Comment.find({ taskId: id })
      .populate('userId', 'name email avatar role')
      .sort({ createdAt: 1 });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Comment from '@/models/Comment';

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

    const task = await Task.findById(id)
      .populate('assignedBy', 'name email avatar role')
      .populate('assignedTo', 'name email avatar role');

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const comments = await Comment.find({ taskId: id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });

    return NextResponse.json({ task, comments });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

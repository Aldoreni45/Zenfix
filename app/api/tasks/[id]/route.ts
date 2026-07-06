import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Comment from '@/models/Comment';
import ActivityLog from '@/models/ActivityLog';
import Notification from '@/models/Notification';

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
      .populate('assignedBy', 'name email avatar role department')
      .populate('assignedTo', 'name email avatar role department');

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const comments = await Comment.find({ taskId: id })
      .populate('userId', 'name email avatar role')
      .sort({ createdAt: 1 });

    return NextResponse.json({ task, comments });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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

    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Permission checks based on action
    const { action } = body;

    if (action === 'start') {
      // Only the assigned worker can start
      if (task.assignedTo.toString() !== userId) {
        return NextResponse.json({ error: 'Only the assigned worker can start this task' }, { status: 403 });
      }
      if (task.status !== 'pending') {
        return NextResponse.json({ error: 'Task must be in pending status to start' }, { status: 400 });
      }

      task.status = 'in_progress';
      await task.save();

      await ActivityLog.create({
        user: userId,
        action: 'task_updated',
        entity: 'task',
        entityId: task._id,
        details: { status: 'in_progress', taskTitle: task.title },
      });

      return NextResponse.json({ success: true, task });
    }

    if (action === 'complete') {
      // Only the assigned worker can complete
      if (task.assignedTo.toString() !== userId) {
        return NextResponse.json({ error: 'Only the assigned worker can complete this task' }, { status: 403 });
      }
      if (task.status !== 'in_progress') {
        return NextResponse.json({ error: 'Task must be in progress to complete' }, { status: 400 });
      }

      task.status = 'completed';
      task.completionNotes = body.completionNotes || '';
      task.completedAt = new Date();
      await task.save();

      // Notify the manager/admin who assigned the task
      await Notification.create({
        recipient: task.assignedBy,
        title: 'Task Completed',
        message: `Task "${task.title}" has been marked as completed and is awaiting your approval.`,
        type: 'task',
        read: false,
      });

      await ActivityLog.create({
        user: userId,
        action: 'task_completed',
        entity: 'task',
        entityId: task._id,
        details: { taskTitle: task.title },
      });

      return NextResponse.json({ success: true, task });
    }

    if (action === 'not_completed') {
      if (task.assignedTo.toString() !== userId) {
        return NextResponse.json({ error: 'Only the assigned worker can update this task' }, { status: 403 });
      }
      if (!['pending', 'in_progress'].includes(task.status)) {
        return NextResponse.json({ error: 'Task cannot be marked as not completed in its current state' }, { status: 400 });
      }
      if (!body.reason || body.reason.length < 30) {
        return NextResponse.json({ error: 'Reason must be at least 30 characters' }, { status: 400 });
      }

      task.status = 'not_completed';
      task.notCompletedReason = body.reason;
      await task.save();

      await Notification.create({
        recipient: task.assignedBy,
        title: 'Task Cannot Be Completed',
        message: `Task "${task.title}" has been marked as not completed. Reason: ${body.reason}`,
        type: 'task',
        read: false,
      });

      await ActivityLog.create({
        user: userId,
        action: 'task_updated',
        entity: 'task',
        entityId: task._id,
        details: { status: 'not_completed', reason: body.reason, taskTitle: task.title },
      });

      return NextResponse.json({ success: true, task });
    }

    if (action === 'approve') {
      if (!['manager', 'admin'].includes(userRole)) {
        return NextResponse.json({ error: 'Only managers and admins can approve tasks' }, { status: 403 });
      }
      if (task.status !== 'completed') {
        return NextResponse.json({ error: 'Task must be completed before approving' }, { status: 400 });
      }

      task.status = 'completed';
      await task.save();

      await Notification.create({
        recipient: task.assignedTo,
        title: 'Task Approved',
        message: `Your task "${task.title}" has been approved.`,
        type: 'task',
        read: false,
      });

      await ActivityLog.create({
        user: userId,
        action: 'task_updated',
        entity: 'task',
        entityId: task._id,
        details: { status: 'approved', taskTitle: task.title },
      });

      return NextResponse.json({ success: true, task });
    }

    if (action === 'reject') {
      if (!['manager', 'admin'].includes(userRole)) {
        return NextResponse.json({ error: 'Only managers and admins can reject tasks' }, { status: 403 });
      }
      if (!['completed', 'not_completed'].includes(task.status)) {
        return NextResponse.json({ error: 'Task must be completed or not_completed to reject' }, { status: 400 });
      }

      task.status = 'rejected';
      await task.save();

      await Notification.create({
        recipient: task.assignedTo,
        title: 'Task Rejected',
        message: `Your task "${task.title}" has been rejected and needs to be redone.`,
        type: 'task',
        read: false,
      });

      await ActivityLog.create({
        user: userId,
        action: 'task_rejected',
        entity: 'task',
        entityId: task._id,
        details: { taskTitle: task.title },
      });

      return NextResponse.json({ success: true, task });
    }

    // Generic field update (admin/manager only)
    if (!['manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const allowedFields = ['title', 'description', 'priority', 'deadline', 'estimatedHours', 'status', 'tags', 'checklist'];
    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    Object.assign(task, updates);
    await task.save();

    await ActivityLog.create({
      user: userId,
      action: 'task_updated',
      entity: 'task',
      entityId: task._id,
      details: { updatedFields: Object.keys(updates), taskTitle: task.title },
    });

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['manager', 'admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const { id } = await params;
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const userId = (session.user as any).id;

    // Managers can only delete tasks they created
    if (userRole === 'manager' && task.assignedBy.toString() !== userId) {
      return NextResponse.json({ error: 'You can only delete tasks you created' }, { status: 403 });
    }

    await Task.findByIdAndDelete(id);

    await ActivityLog.create({
      user: userId,
      action: 'task_deleted',
      entity: 'task',
      entityId: task._id,
      details: { taskTitle: task.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

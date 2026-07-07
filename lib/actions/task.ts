'use server';

import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Comment from '@/models/Comment';
import Notification from '@/models/Notification';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { taskSchema, updateTaskSchema, completeTaskSchema, notCompletedTaskSchema, commentSchema } from '@/lib/schemas/task';
import { revalidatePath } from 'next/cache';

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session || !['manager', 'admin'].includes((session.user as any).role)) {
    return { error: 'Unauthorized. Only managers and admins can create tasks.' };
  }

  const validatedFields = taskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    assignedTo: formData.get('assignedTo'),
    deadline: formData.get('deadline'),
    estimatedHours: formData.get('estimatedHours') ? Number(formData.get('estimatedHours')) : undefined,
    department: formData.get('department'),
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : undefined,
    checklist: formData.get('checklist') ? JSON.parse(formData.get('checklist') as string) : undefined,
  });

  if (!validatedFields.success) {
    console.error('Validation errors:', validatedFields.error.issues);
    return { error: 'Invalid fields. Please check all required fields.' };
  }

  await connectDB();

  // Verify the assigned user exists and is a worker
  const assignedUser = await User.findById(validatedFields.data.assignedTo);
  if (!assignedUser) {
    return { error: 'Assigned user not found' };
  }

  if (assignedUser.role !== 'worker') {
    return { error: 'Tasks can only be assigned to workers' };
  }

  // If manager, verify they are assigning to someone in their department (if department is specified)
  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;
  
  if (userRole === 'manager' && validatedFields.data.department) {
    const manager = await User.findById(userId);
    if (manager && manager.department !== validatedFields.data.department && manager.department !== 'All') {
      return { error: 'Managers can only assign tasks within their department' };
    }
  }

  try {
    const task = await Task.create({
      ...validatedFields.data,
      assignedBy: userId,
      status: 'pending',
    });

    // Create notification for the assigned user
    await Notification.create({
      receiver: validatedFields.data.assignedTo,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${validatedFields.data.title}`,
      type: 'task_assigned',
      read: false,
      link: `/adminzenfix/tasks/${task._id}`,
    });

    // Log the activity
    await ActivityLog.create({
      user: userId,
      action: 'task_created',
      entity: 'task',
      entityId: task._id.toString(),
      details: { 
        title: task.title, 
        assignedTo: assignedUser.name,
        assignedToEmail: assignedUser.email,
        priority: task.priority,
        department: task.department,
      },
    });

    revalidatePath('/adminzenfix/tasks');
    revalidatePath('/adminzenfix/dashboard');
    
    return { success: true, taskId: task._id.toString() };
  } catch (error) {
    console.error('Error creating task:', error);
    return { error: 'Failed to create task. Please try again.' };
  }
}

export async function updateTask(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = updateTaskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    priority: formData.get('priority'),
    assignedTo: formData.get('assignedTo'),
    deadline: formData.get('deadline'),
    estimatedHours: formData.get('estimatedHours') ? Number(formData.get('estimatedHours')) : undefined,
    status: formData.get('status'),
    department: formData.get('department'),
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : undefined,
    checklist: formData.get('checklist') ? JSON.parse(formData.get('checklist') as string) : undefined,
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await connectDB();

  const task = await Task.findById(taskId);
  if (!task) {
    return { error: 'Task not found' };
  }

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  if (userRole === 'worker' && task.assignedTo.toString() !== userId) {
    return { error: 'Unauthorized' };
  }

  if (userRole === 'manager' && task.assignedBy.toString() !== userId && task.assignedTo.toString() !== userId) {
    return { error: 'Unauthorized' };
  }

  Object.assign(task, validatedFields.data);
  await task.save();

  if (validatedFields.data.assignedTo && validatedFields.data.assignedTo !== task.assignedTo.toString()) {
    await Notification.create({
      receiver: validatedFields.data.assignedTo,
      title: 'Task Reassigned',
      message: `Task "${task.title}" has been reassigned to you`,
      type: 'task_updated',
      link: `/adminzenfix/tasks/${task._id}`,
    });
  }

  await ActivityLog.create({
    user: userId,
    action: 'task_updated',
    entity: 'task',
    entityId: task._id,
    details: validatedFields.data,
  });

  revalidatePath(`/adminzenfix/tasks/${taskId}`);
  revalidatePath('/adminzenfix/tasks');
  return { success: true };
}

export async function startTask(taskId: string) {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  await connectDB();

  const task = await Task.findById(taskId);
  if (!task) {
    return { error: 'Task not found' };
  }

  if (task.assignedTo.toString() !== (session.user as any).id) {
    return { error: 'Unauthorized' };
  }

  task.status = 'in_progress';
  await task.save();

  await ActivityLog.create({
    user: (session.user as any).id,
    action: 'task_updated',
    entity: 'task',
    entityId: task._id,
    details: { status: 'in_progress' },
  });

  revalidatePath(`/adminzenfix/tasks/${taskId}`);
  return { success: true };
}

export async function completeTask(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = completeTaskSchema.safeParse({
    completionNotes: formData.get('completionNotes'),
    attachments: formData.get('attachments') ? JSON.parse(formData.get('attachments') as string) : undefined,
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await connectDB();

  const task = await Task.findById(taskId);
  if (!task) {
    return { error: 'Task not found' };
  }

  if (task.assignedTo.toString() !== (session.user as any).id) {
    return { error: 'Unauthorized' };
  }

  task.status = 'completed';
  task.completionNotes = validatedFields.data.completionNotes;
  task.attachments = validatedFields.data.attachments || [];
  task.completedAt = new Date();
  await task.save();

  await Notification.create({
    receiver: task.assignedBy,
    title: 'Task Completed',
    message: `Task "${task.title}" has been completed`,
    type: 'task_completed',
    link: `/adminzenfix/tasks/${task._id}`,
  });

  await ActivityLog.create({
    user: (session.user as any).id,
    action: 'task_completed',
    entity: 'task',
    entityId: task._id,
  });

  revalidatePath(`/adminzenfix/tasks/${taskId}`);
  revalidatePath('/adminzenfix/dashboard');
  return { success: true };
}

export async function markNotCompleted(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = notCompletedTaskSchema.safeParse({
    reason: formData.get('reason'),
    reasonType: formData.get('reasonType'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await connectDB();

  const task = await Task.findById(taskId);
  if (!task) {
    return { error: 'Task not found' };
  }

  if (task.assignedTo.toString() !== (session.user as any).id) {
    return { error: 'Unauthorized' };
  }

  task.status = 'not_completed';
  task.notCompletedReason = validatedFields.data.reason;
  await task.save();

  await Notification.create({
    receiver: task.assignedBy,
    title: 'Task Cannot Be Completed',
    message: `Task "${task.title}" cannot be completed. Reason: ${validatedFields.data.reason}`,
    type: 'task_rejected',
    link: `/adminzenfix/tasks/${task._id}`,
  });

  await ActivityLog.create({
    user: (session.user as any).id,
    action: 'task_updated',
    entity: 'task',
    entityId: task._id,
    details: { status: 'not_completed', reason: validatedFields.data.reason },
  });

  revalidatePath(`/adminzenfix/tasks/${taskId}`);
  return { success: true };
}

export async function approveTask(taskId: string) {
  const session = await auth();
  if (!session || !['manager', 'admin'].includes((session.user as any).role)) {
    return { error: 'Unauthorized' };
  }

  await connectDB();

  const task = await Task.findById(taskId);
  if (!task) {
    return { error: 'Task not found' };
  }

  task.status = 'completed';
  await task.save();

  await Notification.create({
    receiver: task.assignedTo,
    title: 'Task Approved',
    message: `Your task "${task.title}" has been approved`,
    type: 'task_updated',
    link: `/adminzenfix/tasks/${task._id}`,
  });

  await ActivityLog.create({
    user: (session.user as any).id,
    action: 'task_updated',
    entity: 'task',
    entityId: task._id,
    details: { status: 'approved' },
  });

  revalidatePath(`/adminzenfix/tasks/${taskId}`);
  return { success: true };
}

export async function rejectTask(taskId: string) {
  const session = await auth();
  if (!session || !['manager', 'admin'].includes((session.user as any).role)) {
    return { error: 'Unauthorized' };
  }

  await connectDB();

  const task = await Task.findById(taskId);
  if (!task) {
    return { error: 'Task not found' };
  }

  task.status = 'rejected';
  await task.save();

  await Notification.create({
    receiver: task.assignedTo,
    title: 'Task Rejected',
    message: `Your task "${task.title}" has been rejected`,
    type: 'task_rejected',
    link: `/adminzenfix/tasks/${task._id}`,
  });

  await ActivityLog.create({
    user: (session.user as any).id,
    action: 'task_updated',
    entity: 'task',
    entityId: task._id,
    details: { status: 'rejected' },
  });

  revalidatePath(`/adminzenfix/tasks/${taskId}`);
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session || !['admin', 'manager'].includes((session.user as any).role)) {
    return { error: 'Unauthorized' };
  }

  await connectDB();

  const task = await Task.findById(taskId);
  if (!task) {
    return { error: 'Task not found' };
  }

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  // Managers can only delete tasks they created
  if (userRole === 'manager' && task.assignedBy.toString() !== userId) {
    return { error: 'Unauthorized' };
  }

  await Task.findByIdAndDelete(taskId);

  await ActivityLog.create({
    user: userId,
    action: 'task_deleted',
    entity: 'task',
    entityId: task._id,
  });

  revalidatePath('/adminzenfix/tasks');
  return { success: true };
}

export async function addComment(taskId: string, formData: FormData) {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const validatedFields = commentSchema.safeParse({
    message: formData.get('message'),
    attachments: formData.get('attachments') ? JSON.parse(formData.get('attachments') as string) : undefined,
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields' };
  }

  await connectDB();

  const task = await Task.findById(taskId);
  if (!task) {
    return { error: 'Task not found' };
  }

  const comment = await Comment.create({
    taskId,
    userId: (session.user as any).id,
    ...validatedFields.data,
  });

  const participants = [task.assignedBy, task.assignedTo];
  for (const participantId of participants) {
    if (participantId.toString() !== (session.user as any).id) {
      await Notification.create({
        receiver: participantId,
        title: 'New Comment',
        message: `New comment on task "${task.title}"`,
        type: 'task_updated',
        link: `/adminzenfix/tasks/${taskId}`,
      });
    }
  }

  revalidatePath(`/adminzenfix/tasks/${taskId}`);
  return { success: true };
}

export async function getTasks(filters?: {
  status?: string;
  priority?: string;
  assignedTo?: string;
  department?: string;
}) {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  await connectDB();

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  let query: any = {};

  if (userRole === 'worker') {
    query.assignedTo = userId;
  } else if (userRole === 'manager') {
    query.$or = [{ assignedBy: userId }, { assignedTo: userId }];
  }

  if (filters?.status) query.status = filters.status;
  if (filters?.priority) query.priority = filters.priority;
  if (filters?.assignedTo) query.assignedTo = filters.assignedTo;
  if (filters?.department) query.department = filters.department;

  const tasks = await Task.find(query)
    .populate('assignedBy', 'name email avatar')
    .populate('assignedTo', 'name email avatar')
    .sort({ createdAt: -1 });

  return { tasks };
}

export async function getTaskById(taskId: string) {
  const session = await auth();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  await connectDB();

  const task = await Task.findById(taskId)
    .populate('assignedBy', 'name email avatar role')
    .populate('assignedTo', 'name email avatar role');

  if (!task) {
    return { error: 'Task not found' };
  }

  const comments = await Comment.find({ taskId })
    .populate('userId', 'name email avatar')
    .sort({ createdAt: 1 });

  return { task, comments };
}

import { NotificationModel } from '@/lib/mongodb/models/notification';

/**
 * Create a notification
 */
export async function createNotification(params: {
  recipientId: number;
  type: string;
  title: string;
  message: string;
  relatedObjectType?: string;
  relatedObjectId?: string;
  link?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}): Promise<void> {
  const {
    recipientId,
    type,
    title,
    message,
    relatedObjectType = '',
    relatedObjectId = '',
    link = '',
    priority = 'normal',
  } = params;
  
  await NotificationModel.create({
    recipient_id: recipientId,
    notification_type: type,
    title,
    message,
    is_read: false,
    related_object_type: relatedObjectType,
    related_object_id: relatedObjectId,
    link,
    priority,
  });
}

/**
 * Send task assignment notification
 */
export async function sendTaskAssignmentNotification(
  recipientId: number,
  taskTitle: string,
  taskId: string
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `You have been assigned a new task: ${taskTitle}`,
    relatedObjectType: 'task',
    relatedObjectId: taskId,
    link: `/tasks/${taskId}`,
    priority: 'normal',
  });
}

/**
 * Send approval notification
 */
export async function sendApprovalNotification(
  recipientId: number,
  approvalType: string,
  approvalId: string
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'approval_requested',
    title: 'Approval Requested',
    message: `A new approval request for ${approvalType} requires your review`,
    relatedObjectType: 'approval',
    relatedObjectId: approvalId,
    link: `/approvals/${approvalId}`,
    priority: 'high',
  });
}

/**
 * Send approval approved notification
 */
export async function sendApprovalApprovedNotification(
  recipientId: number,
  approvalType: string,
  approvalId: string
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'approval_approved',
    title: 'Approval Approved',
    message: `Your approval for ${approvalType} has been approved`,
    relatedObjectType: 'approval',
    relatedObjectId: approvalId,
    link: `/approvals/${approvalId}`,
    priority: 'normal',
  });
}

/**
 * Send approval rejected notification
 */
export async function sendApprovalRejectedNotification(
  recipientId: number,
  approvalType: string,
  approvalId: string
): Promise<void> {
  await createNotification({
    recipientId,
    type: 'approval_rejected',
    title: 'Approval Rejected',
    message: `Your approval for ${approvalType} has been rejected`,
    relatedObjectType: 'approval',
    relatedObjectId: approvalId,
    link: `/approvals/${approvalId}`,
    priority: 'high',
  });
}

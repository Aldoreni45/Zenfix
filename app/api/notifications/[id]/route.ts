import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { UserModel } from '@/lib/mongodb/models/user';
import { formatUserName, formatNotificationTypeName, formatPriorityName } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError } from '@/lib/api-helpers/error-handler';

async function getHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const notificationDoc = await NotificationModel.findByNumericId(numericId);
    
    if (!notificationDoc) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notificationDoc.recipient_id !== user.userId) {
      return NextResponse.json(
        { error: 'You can only view your own notifications.' },
        { status: 403 }
      );
    }

    const recipient = await UserModel.findByNumericId(notificationDoc.recipient_id);

    const notificationResponse = {
      id: notificationDoc.numeric_id,
      receiver: notificationDoc.recipient_id,
      receiver_email: recipient?.email || '',
      receiver_name: recipient ? `${recipient.first_name} ${recipient.last_name}`.trim() || recipient.username : '',
      title: notificationDoc.title,
      message: notificationDoc.message,
      type: notificationDoc.notification_type,
      type_name: notificationDoc.notification_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      priority: notificationDoc.priority,
      priority_name: notificationDoc.priority.charAt(0).toUpperCase() + notificationDoc.priority.slice(1),
      read: notificationDoc.is_read,
      link: notificationDoc.link,
      related_entity_type: notificationDoc.related_object_type,
      related_entity_id: notificationDoc.related_object_id,
      created_at: notificationDoc.created_at.toISOString(),
      read_at: notificationDoc.read_at?.toISOString(),
    };

    return NextResponse.json(notificationResponse);
  } catch (error) {
    return handleError(error, 'Get notification');
  }
}

async function patchHandler(request: NextRequest, user: any, id: string) {
  try {
    const numericId = parseInt(id);
    const notificationDoc = await NotificationModel.findByNumericId(numericId);
    
    if (!notificationDoc) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notificationDoc.recipient_id !== user.userId) {
      return NextResponse.json(
        { error: 'You can only update your own notifications.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { read } = body;

    if (read !== undefined) {
      await NotificationModel.markAsRead(numericId);
    }

    const updatedNotification = await NotificationModel.findByNumericId(numericId);
    
    if (!updatedNotification) {
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    const recipient = await UserModel.findByNumericId(updatedNotification.recipient_id);

    const notificationResponse = {
      id: updatedNotification.numeric_id,
      receiver: updatedNotification.recipient_id,
      receiver_email: recipient?.email || '',
      receiver_name: recipient ? `${recipient.first_name} ${recipient.last_name}`.trim() || recipient.username : '',
      title: updatedNotification.title,
      message: updatedNotification.message,
      type: updatedNotification.notification_type,
      type_name: updatedNotification.notification_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      priority: updatedNotification.priority,
      priority_name: updatedNotification.priority.charAt(0).toUpperCase() + updatedNotification.priority.slice(1),
      read: updatedNotification.is_read,
      link: updatedNotification.link,
      related_entity_type: updatedNotification.related_object_type,
      related_entity_id: updatedNotification.related_object_id,
      created_at: updatedNotification.created_at.toISOString(),
      read_at: updatedNotification.read_at?.toISOString(),
    };

    return NextResponse.json(notificationResponse);
  } catch (error) {
    return handleError(error, 'Update notification');
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => getHandler(req, user, id))(request);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return requireAuth((req, user) => patchHandler(req, user, id))(request);
}

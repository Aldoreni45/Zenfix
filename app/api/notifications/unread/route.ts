import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { UserModel } from '@/lib/mongodb/models/user';
import { formatUserName, formatNotificationTypeName, formatPriorityName } from '@/lib/api-helpers/data-enrichment';
import { formatDate } from '@/lib/api-helpers/response-formatter';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const notifications = await NotificationModel.findUnreadByRecipient(user.userId);

    const notificationsWithDetails = await Promise.all(
      notifications.map(async (n) => {
        const recipient = await UserModel.findByNumericId(n.recipient_id);
        
        return {
          id: n.numeric_id,
          receiver: n.recipient_id,
          receiver_email: recipient?.email || '',
          receiver_name: recipient ? `${recipient.first_name} ${recipient.last_name}`.trim() || recipient.username : '',
          title: n.title,
          message: n.message,
          type: n.notification_type,
          type_name: n.notification_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          priority: n.priority,
          priority_name: n.priority.charAt(0).toUpperCase() + n.priority.slice(1),
          read: n.is_read,
          link: n.link,
          related_entity_type: n.related_object_type,
          related_entity_id: n.related_object_id,
          created_at: n.created_at.toISOString(),
          read_at: n.read_at?.toISOString(),
        };
      })
    );

    return NextResponse.json(notificationsWithDetails);
  } catch (error) {
    return handleError(error, 'Unread notifications');
  }
}

export const GET = requireAuth(handler);

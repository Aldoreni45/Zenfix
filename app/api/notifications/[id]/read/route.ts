import { NextRequest, NextResponse } from 'next/server';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { requireAuth } from '@/lib/auth/middleware';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(async (req, user) => {
    try {
      const { id } = await params;
      const notificationId = parseInt(id);

      const notification = await NotificationModel.findByNumericId(notificationId);
      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      // Only recipient can mark their own notification as read
      if (notification.recipient_id !== user.userId) {
        return NextResponse.json(
          { error: 'You can only mark your own notifications as read' },
          { status: 403 }
        );
      }

      await NotificationModel.markAsRead(notificationId);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }
  })(request);
}

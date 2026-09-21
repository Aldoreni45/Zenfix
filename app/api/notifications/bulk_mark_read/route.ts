import { NextRequest, NextResponse } from 'next/server';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { requireAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      const body = await request.json();
      const { notification_ids } = body;

      if (!notification_ids || !Array.isArray(notification_ids)) {
        return NextResponse.json(
          { error: 'notification_ids array is required' },
          { status: 400 }
        );
      }

      // Mark each notification as read
      await Promise.all(
        notification_ids.map(async (id: number) => {
          const notification = await NotificationModel.findByNumericId(id);
          if (notification && notification.recipient_id === user.userId) {
            await NotificationModel.markAsRead(id);
          }
        })
      );

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error bulk marking notifications as read:', error);
      return NextResponse.json(
        { error: 'Failed to bulk mark notifications as read' },
        { status: 500 }
      );
    }
  })(request);
}

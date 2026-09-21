import { NextRequest, NextResponse } from 'next/server';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { requireAuth } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return requireAuth(async (req, user) => {
    try {
      await NotificationModel.markAllAsReadForRecipient(user.userId);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read' },
        { status: 500 }
      );
    }
  })(request);
}

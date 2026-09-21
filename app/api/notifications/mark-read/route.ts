import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { handleValidationError } from '@/lib/api-helpers/error-handler';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return handleValidationError('ids array is required');
    }

    for (const id of ids) {
      const numericId = parseInt(id);
      const notification = await NotificationModel.findByNumericId(numericId);
      if (notification && notification.recipient_id === user.userId) {
        await NotificationModel.markAsRead(numericId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error, 'Mark read');
  }
}

export const POST = requireAuth(handler);

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { NotificationModel } from '@/lib/mongodb/models/notification';
import { handleError } from '@/lib/api-helpers/error-handler';

async function handler(request: NextRequest, user: any) {
  try {
    const total = await NotificationModel.findAll({ recipient_id: user.userId }).then(n => n.length);
    const unread = await NotificationModel.countUnread(user.userId);
    const urgent = await NotificationModel.countUrgentUnread(user.userId);

    return NextResponse.json({
      total,
      unread,
      urgent,
    });
  } catch (error) {
    return handleError(error, 'Notification count');
  }
}

export const GET = requireAuth(handler);

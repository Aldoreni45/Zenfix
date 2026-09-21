import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    if (user) {
      // Log logout activity
      await ActivityLogModel.create({
        actor_id: user.userId,
        action: ActivityAction.LOGOUT,
        entity_type: 'user',
        entity_id: user.userId.toString(),
        description: 'User logged out',
        metadata: {},
        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        user_agent: request.headers.get('user-agent')?.substring(0, 300) || '',
      });
    }

    const response = NextResponse.json({ success: true });

    // Clear cookies
    response.cookies.delete('zenfix_access_token');
    response.cookies.delete('zenfix_refresh_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

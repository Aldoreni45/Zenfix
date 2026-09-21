import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { UserModel } from '@/lib/mongodb/models/user';
import { verifyPassword, validatePasswordStrength } from '@/lib/auth/password';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';

async function handler(request: NextRequest, user: any) {
  try {
    const body = await request.json();
    const { old_password, new_password } = body;

    if (!old_password || !new_password) {
      return NextResponse.json(
        { error: 'Old password and new password are required' },
        { status: 400 }
      );
    }

    const userDoc = await UserModel.findByNumericId(user.userId);
    
    if (!userDoc) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isValidPassword = await verifyPassword(old_password, userDoc.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: { old_password: 'Current password is incorrect.' } },
        { status: 400 }
      );
    }

    const strengthCheck = validatePasswordStrength(new_password);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { error: { new_password: strengthCheck.errors } },
        { status: 400 }
      );
    }

    await UserModel.setPassword(user.userId, new_password);

    // Log password change activity
    await ActivityLogModel.create({
      actor_id: user.userId,
      action: ActivityAction.PASSWORD_CHANGE,
      entity_type: 'user',
      entity_id: user.userId.toString(),
      description: 'Password changed',
      metadata: {},
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      user_agent: request.headers.get('user-agent')?.substring(0, 300) || '',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = requireAuth(handler);

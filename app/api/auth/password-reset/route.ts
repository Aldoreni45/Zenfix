import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/mongodb/models/user';
import { PasswordResetTokenModel } from '@/lib/mongodb/models/password-reset-token';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { checkRateLimit, clientIp, tooManyRequests } from '@/lib/api-helpers/rate-limit';
import { logError } from '@/lib/logger';

const RESET_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RESET_MAX_REQUESTS = 5; // per IP + email

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit(
      `password-reset:${clientIp(request)}:${email.toLowerCase()}`,
      RESET_MAX_REQUESTS,
      RESET_WINDOW_MS
    );
    if (!rateLimit.allowed) {
      return tooManyRequests(rateLimit.retryAfterSeconds);
    }

    const user = await UserModel.findByEmail(email);

    if (user) {
      // Generate a single-use token stored as a hash in MongoDB with a 1 hour
      // expiry. The raw token is only returned/emailed, never persisted.
      const uid = String(user.numeric_id);
      const token = await PasswordResetTokenModel.create(user.numeric_id);

      // In production this token must be delivered by email (nodemailer etc.).
      // It is only printed to the console in development so the flow is
      // testable locally; logging it in production would let anyone with log
      // access take over accounts.
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(
          `[password-reset] Use uid=${uid} token=${token} with POST /api/auth/password-reset-confirm/`
        );
      }

      await ActivityLogModel.create({
        actor_id: user.numeric_id,
        action: ActivityAction.PASSWORD_RESET,
        entity_type: 'user',
        entity_id: user.numeric_id.toString(),
        description: 'Password reset requested',
        metadata: {},
        ip_address: clientIp(request),
        user_agent: request.headers.get('user-agent')?.substring(0, 300) || '',
      });
    }

    // Always return success to prevent email enumeration (Django parity).
    return NextResponse.json({
      success: true,
      message: 'If the account exists, reset instructions were sent.'
    });
  } catch (error) {
    logError('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset' },
      { status: 500 }
    );
  }
}

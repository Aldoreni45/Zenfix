import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/mongodb/models/user';
import { PasswordResetTokenModel } from '@/lib/mongodb/models/password-reset-token';
import { validatePasswordStrength } from '@/lib/auth/password';
import { checkRateLimit, clientIp, tooManyRequests } from '@/lib/api-helpers/rate-limit';
import { logError } from '@/lib/logger';

const CONFIRM_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const CONFIRM_MAX_ATTEMPTS = 10; // per IP

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit(
      `password-reset-confirm:${clientIp(request)}`,
      CONFIRM_MAX_ATTEMPTS,
      CONFIRM_WINDOW_MS
    );
    if (!rateLimit.allowed) {
      return tooManyRequests(rateLimit.retryAfterSeconds);
    }

    const body = await request.json();
    const { uid, token, new_password } = body;

    if (!uid || !token || !new_password) {
      return NextResponse.json(
        { error: 'uid, token, and new_password are required.' },
        { status: 400 }
      );
    }

    const numericId = parseInt(String(uid), 10);
    if (!Number.isFinite(numericId)) {
      return NextResponse.json(
        { error: 'Invalid reset token.' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(new_password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(' ') },
        { status: 400 }
      );
    }

    // Find user by numeric_id
    const user = await UserModel.findByNumericId(numericId);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid reset token.' },
        { status: 400 }
      );
    }

    // Verify and consume the single-use, unexpired reset token. The token is
    // stored hashed in MongoDB (shared across instances and restarts).
    const validToken = await PasswordResetTokenModel.consume(String(token), user.numeric_id);
    if (!validToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token.' },
        { status: 400 }
      );
    }

    // Update user password (hashing happens inside setPassword)
    await UserModel.setPassword(user.numeric_id, new_password);

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Password reset confirm error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

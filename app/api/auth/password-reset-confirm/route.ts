import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/mongodb/models/user';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

// Token storage (shared with password-reset route)
const resetTokens = new Map<string, { userId: number; expiresAt: Date }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, token, new_password } = body;

    if (!uid || !token || !new_password) {
      return NextResponse.json(
        { error: 'uid, token, and new_password are required.' },
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
    const user = await UserModel.findByNumericId(parseInt(uid));
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid reset token.' },
        { status: 400 }
      );
    }

    // Django: Verify token and check expiry
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token.' },
        { status: 400 }
      );
    }

    if (tokenData.userId !== user.numeric_id) {
      return NextResponse.json(
        { error: 'Invalid reset token.' },
        { status: 400 }
      );
    }

    if (tokenData.expiresAt < new Date()) {
      resetTokens.delete(token);
      return NextResponse.json(
        { error: 'Invalid or expired reset token.' },
        { status: 400 }
      );
    }

    // Delete used token
    resetTokens.delete(token);

    // Update user password
    await UserModel.setPassword(user.numeric_id, new_password);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

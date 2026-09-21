import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/mongodb/models/user';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import crypto from 'crypto';

// Simple token generator for password reset (Django parity)
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Store reset tokens in memory (in production, use Redis or database with expiry)
const resetTokens = new Map<string, { userId: number; expiresAt: Date }>();

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

    const user = await UserModel.findByEmail(email);

    if (user) {
      // Django: Generate uid and token for password reset
      const uid = String(user.numeric_id);
      const token = generateResetToken();
      
      // Store token with 1 hour expiry
      resetTokens.set(token, {
        userId: user.numeric_id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      // Log the reset request for development (Django behavior)
      console.log(`Password reset requested for email: ${email}`);
      console.log(`Use uid=${uid} token=${token} with POST /api/auth/password-reset-confirm/`);

      // In production, send email here
      // Django uses Django's email backend, we would use nodemailer or similar
    }

    // Django: Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If the account exists, reset instructions were sent.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset' },
      { status: 500 }
    );
  }
}

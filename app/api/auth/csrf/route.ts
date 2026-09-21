import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Django: Generate a CSRF token for form submissions
// Since we're using JWT with cookies, this is mainly for compatibility
export async function GET() {
  // Generate a random CSRF token (Django parity)
  const csrfToken = crypto.randomBytes(32).toString('hex');
  
  return NextResponse.json({ csrfToken });
}

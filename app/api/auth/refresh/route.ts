import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie or body
    const cookieToken = request.cookies.get('zenfix_refresh_token')?.value;
    let bodyToken;
    try {
      bodyToken = (await request.json()).refresh;
    } catch {
      // Body might be empty, that's okay
      bodyToken = undefined;
    }
    
    const refresh_token = cookieToken || bodyToken;

    if (!refresh_token) {
      const response = NextResponse.json(
        { error: 'Refresh token not provided in cookie or request body.' },
        { status: 401 }
      );
      response.cookies.delete('zenfix_refresh_token');
      return response;
    }

    try {
      const payload = await verifyRefreshToken(refresh_token);
      
      // Generate new tokens
      const access = await signAccessToken({
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      });

      const new_refresh = await signRefreshToken({
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      });

      const response = NextResponse.json({ access });

      // Update cookies with new tokens
      response.cookies.set('zenfix_access_token', access, {
        maxAge: 60 * 60, // 1 hour
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      response.cookies.set('zenfix_refresh_token', new_refresh, {
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return response;
    } catch (error) {
      const response = NextResponse.json(
        { error: 'Invalid or expired refresh token.' },
        { status: 401 }
      );
      response.cookies.delete('zenfix_refresh_token');
      return response;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { UserModel } from '@/lib/mongodb/models/user';
import { verifyPassword } from '@/lib/auth/password';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { ActivityLogModel } from '@/lib/mongodb/models/activity-log';
import { ActivityAction } from '@/lib/types/models';
import { UserStatus } from '@/lib/types/models';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await UserModel.findByUsername(username);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (user.status !== UserStatus.ACTIVE || !user.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive or suspended. Contact your administrator.' },
        { status: 403 }
      );
    }

    // Log login activity
    await ActivityLogModel.create({
      actor_id: user.numeric_id,
      action: ActivityAction.LOGIN,
      entity_type: 'user',
      entity_id: user.numeric_id.toString(),
      description: 'User logged in',
      metadata: {},
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      user_agent: request.headers.get('user-agent')?.substring(0, 300) || '',
    });

    // Generate JWT tokens
    const access = await signAccessToken({
      userId: user.numeric_id,
      username: user.username,
      role: user.role,
    });

    const refresh = await signRefreshToken({
      userId: user.numeric_id,
      username: user.username,
      role: user.role,
    });

    // Prepare user response (exclude password)
    const userResponse = {
      id: user.numeric_id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`.trim() || user.username,
      phone: user.phone,
      role: user.role,
      role_name: user.role.charAt(0).toUpperCase() + user.role.slice(1),
      department_id: user.department_id,
      avatar: user.avatar,
      status: user.status,
      status_name: user.status.charAt(0).toUpperCase() + user.status.slice(1),
      is_active: user.is_active,
      last_login: user.last_login?.toISOString(),
      reports_to_id: user.reports_to_id,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };

    // Set cookies
    const response = NextResponse.json({
      user: userResponse,
      access,
    });

    // Access token: 1 hour, NOT HttpOnly so JavaScript can read it
    response.cookies.set('zenfix_access_token', access, {
      maxAge: 60 * 60, // 1 hour
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Refresh token: 7 days, NOT HttpOnly so frontend can read it
    response.cookies.set('zenfix_refresh_token', refresh, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

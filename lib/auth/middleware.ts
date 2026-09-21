import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from './jwt';
import { UserRole } from '../types/models';

export interface AuthUser {
  userId: number;
  username: string;
  role: UserRole;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    // First try Authorization header (case-insensitive)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await verifyAccessToken(token);
      
      return {
        userId: payload.userId,
        username: payload.username,
        role: payload.role as UserRole,
      };
    }

    // Fallback to cookie-based authentication
    const token = request.cookies.get('zenfix_access_token')?.value;
    
    if (token) {
      const payload = await verifyAccessToken(token);
      
      return {
        userId: payload.userId,
        username: payload.username,
        role: payload.role as UserRole,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}

export function requireRole(allowedRoles: UserRole[]) {
  return function(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const user = await authenticateRequest(request);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(request, user);
    };
  };
}

export function requireOwner(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return requireRole(['owner'])(handler);
}

export function requireOwnerOrManager(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return requireRole(['owner', 'manager'])(handler);
}

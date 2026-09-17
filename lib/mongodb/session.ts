import 'server-only';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export const ACCESS_COOKIE = 'zenfix_access_token';
export const REFRESH_COOKIE = 'zenfix_refresh_token';

const ACCESS_TTL_SECONDS = 60 * 15; // 15 minutes
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET?.trim() || fallbackSecret('JWT_ACCESS_SECRET')
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET?.trim() || fallbackSecret('JWT_REFRESH_SECRET')
);

/**
 * Development only fallback. In production the JWT_*_SECRET env vars are
 * required; if they are missing we refuse to silently use a weak key.
 */
function fallbackSecret(name: string): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} environment variable is not set`);
  }
  return `zenfix-dev-${name}-change-me`;
}

export interface SessionUser {
  id: string;
  username: string;
  role: 'owner' | 'manager' | 'employee';
}

interface SessionClaims extends JWTPayload {
  uid?: string;
  username?: string;
  role?: string;
  type?: 'access' | 'refresh';
}

export async function signSessionTokens(
  user: SessionUser
): Promise<{ access: string; refresh: string }> {
  const now = Math.floor(Date.now() / 1000);

  const access = await new SignJWT({ uid: user.id, username: user.username, role: user.role, type: 'access' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + ACCESS_TTL_SECONDS)
    .setSubject(user.id)
    .sign(ACCESS_SECRET);

  const refresh = await new SignJWT({ uid: user.id, username: user.username, role: user.role, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + REFRESH_TTL_SECONDS)
    .setSubject(user.id)
    .sign(REFRESH_SECRET);

  return { access, refresh };
}

export async function verifyAccessToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    if (payload.type !== 'access') return null;
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    if (payload.type !== 'refresh') return null;
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export async function setSessionCookies(access: string, refresh: string): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, access, { ...cookieOptions, maxAge: ACCESS_TTL_SECONDS });
  store.set(REFRESH_COOKIE, refresh, { ...cookieOptions, maxAge: REFRESH_TTL_SECONDS });
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function readSessionCookies():
  Promise<{ access?: string; refresh?: string }> {
  const store = await cookies();
  return {
    access: store.get(ACCESS_COOKIE)?.value,
    refresh: store.get(REFRESH_COOKIE)?.value,
  };
}

/** Resolve the best available access token: Authorization header, cookie, then body. */
export function resolveAccessToken(req: NextRequest, body?: Record<string, unknown>): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7).trim();
  const cookie = req.cookies.get(ACCESS_COOKIE)?.value;
  if (cookie) return cookie;
  if (body && typeof body.access === 'string') return body.access;
  return null;
}
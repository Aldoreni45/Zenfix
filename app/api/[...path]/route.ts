import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || 'http://127.0.0.1:8000';
const ACCESS_TOKEN_KEY = 'zenfix_access_token';
const REFRESH_TOKEN_KEY = 'zenfix_refresh_token';

const ACCESS_COOKIE_MAX_AGE = 60 * 60; // 1 hour

function extractAccessToken(body: ArrayBuffer): string | null {
  try {
    const text = new TextDecoder().decode(body);
    const json = JSON.parse(text);
    // Handle both { access: "..." } and { data: { access: "..." } } and { data: { user: {...}, access: "..." } }
    const access = json?.access || json?.data?.access;
    return typeof access === 'string' ? access : null;
  } catch {
    return null;
  }
}

function extractRefreshTokenFromCookies(setCookies: string[]): string | null {
  for (const raw of setCookies) {
    const lower = raw.toLowerCase();
    if (lower.startsWith(`${REFRESH_TOKEN_KEY.toLowerCase()}=`) || lower.includes(`${REFRESH_TOKEN_KEY.toLowerCase()}=`)) {
      const valuePart = raw.split(';')[0]?.split('=').slice(1).join('=');
      return valuePart || null;
    }
  }
  return null;
}

async function proxy(req: NextRequest, path: string[]): Promise<NextResponse> {
  const incoming = new URL(req.url);
  const joined = path.map((segment) => encodeURIComponent(segment)).join('/');
  const target = `${DJANGO_BACKEND_URL}/api/${joined}${incoming.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (['host', 'connection', 'content-length', 'transfer-encoding'].includes(lower)) return;
    headers.set(key, value);
  });
  
  // Explicitly forward cookies to Django backend
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }

  const method = req.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await req.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      redirect: 'manual',
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: 'The API server is not reachable. Start the Django backend on port 8000.',
          details: {},
        },
      },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie') return;
    if (lower === 'location') return;
    responseHeaders.set(key, value);
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : [];
  for (const cookie of setCookies) {
    responseHeaders.append('set-cookie', cookie);
  }

  const responsePayload = await upstream.arrayBuffer();
  const response = new NextResponse(responsePayload, {
    status: upstream.status,
    headers: responseHeaders,
  });

  const pathStr = joined.toLowerCase();

  // Pass through Django's cookies as-is - don't override them
  // Django sets httponly=False so JavaScript can read the tokens
  // Logout endpoint still needs to clear cookies
  if (pathStr === 'auth/logout') {
    response.cookies.delete(ACCESS_TOKEN_KEY);
    response.cookies.delete(REFRESH_TOKEN_KEY);
  }

  return response;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
export async function OPTIONS(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}

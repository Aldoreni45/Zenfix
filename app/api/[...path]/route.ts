import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DJANGO_BACKEND_URL = process.env.DJANGO_BACKEND_URL || 'http://127.0.0.1:8000';

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
    if (key.toLowerCase() === 'set-cookie') return;
    responseHeaders.set(key, value);
  });

  const payload = await upstream.arrayBuffer();
  const response = new NextResponse(payload, {
    status: upstream.status,
    headers: responseHeaders,
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function' ? upstream.headers.getSetCookie() : [];
  for (const cookie of setCookies) {
    response.headers.append('set-cookie', cookie);
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

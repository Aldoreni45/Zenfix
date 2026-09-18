import { NextRequest, NextResponse } from 'next/server';

const ACCESS_TOKEN_KEY = 'zenfix_access_token';

function hasAccessToken(request: NextRequest): boolean {
  const cookie = request.cookies.get(ACCESS_TOKEN_KEY);
  return !!(cookie && cookie.value && cookie.value.length > 10);
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/adminzenfix/login') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/adminzenfix')) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const authenticated = hasAccessToken(request);

  if (pathname === '/adminzenfix' || pathname === '/adminzenfix/') {
    if (authenticated) {
      return NextResponse.redirect(
        new URL('/adminzenfix/dashboard', request.url)
      );
    }
    return NextResponse.redirect(
      new URL('/adminzenfix/login', request.url)
    );
  }

  if (pathname.startsWith('/adminzenfix/login')) {
    if (authenticated) {
      return NextResponse.redirect(
        new URL('/adminzenfix/dashboard', request.url)
      );
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL('/adminzenfix/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/adminzenfix/:path*'],
};

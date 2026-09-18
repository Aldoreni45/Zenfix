import { NextRequest, NextResponse } from 'next/server';

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

  // NOTE: Authentication is now handled client-side by the AuthProvider
  // Middleware only handles basic route protection
  // The AuthProvider will verify tokens with the backend and redirect if needed
  
  // Allow all admin routes to pass through - client-side auth will handle protection
  return NextResponse.next();
}

export const config = {
  matcher: ['/adminzenfix/:path*'],
};

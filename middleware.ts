import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');
  
  const isAuthenticated = !!token;

  // Public routes (login page)
  const publicRoutes = ['/adminzenfix', '/adminzenfix/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Admin routes
  const isAdminRoute = pathname.startsWith('/adminzenfix');

  // If trying to access admin routes
  if (isAdminRoute) {
    // If not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      return NextResponse.redirect(new URL('/adminzenfix/login', req.url));
    }

    // If authenticated but on login page, redirect to dashboard
    if (isAuthenticated && isPublicRoute) {
      return NextResponse.redirect(new URL('/adminzenfix/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/adminzenfix/:path*'],
};

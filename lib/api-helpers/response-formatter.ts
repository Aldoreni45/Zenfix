import { NextResponse } from 'next/server';

/**
 * Format date to ISO string
 */
export function formatDate(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

/**
 * Format date to ISO string (required)
 */
export function formatDateRequired(date: Date): string {
  return date.toISOString();
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Get user agent from request headers
 */
export function getUserAgent(request: Request): string {
  const userAgent = request.headers.get('user-agent') || '';
  return userAgent.substring(0, 300);
}

/**
 * Create success response
 */
export function successResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create paginated response
 */
export function paginatedResponse(items: any[], count: number, page: number, pageSize: number): NextResponse {
  return NextResponse.json({
    count,
    page,
    page_size: pageSize,
    items,
  });
}

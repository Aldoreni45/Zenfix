import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight in-memory fixed-window rate limiter for authentication
 * endpoints. It protects against credential stuffing / brute force without
 * adding a required external dependency.
 *
 * Scope/limits:
 *  - state lives in the Node process, so it is per-instance. A single Next.js
 *    server (the deployment target) gets full protection; horizontally scaled
 *    deployments get "N attempts per instance" which is still a large
 *    improvement over no limit at all.
 *  - it fails open: any unexpected condition allows the request through, so a
 *    limiter bug can never lock users out of the application.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  _zenfixRateLimitBuckets?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> =
  globalForRateLimit._zenfixRateLimitBuckets ?? new Map<string, Bucket>();
globalForRateLimit._zenfixRateLimitBuckets = buckets;

const MAX_TRACKED_KEYS = 10_000;

/** Best-effort client IP behind the platform proxy. */
export function clientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  try {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      if (buckets.size >= MAX_TRACKED_KEYS) {
        for (const [existingKey, existing] of buckets) {
          if (existing.resetAt <= now) buckets.delete(existingKey);
        }
      }
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (bucket.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      };
    }

    bucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  } catch {
    // Fail open — never block legitimate traffic because of a limiter error.
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many attempts. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.max(1, retryAfterSeconds)) },
    }
  );
}

/**
 * Clear a limiter bucket. Used after a successful authentication so that
 * legitimate logins never count towards the failure budget.
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

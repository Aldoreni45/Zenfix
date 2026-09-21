# Frontend API Client Audit

## Critical Finding: Frontend Designed for Django Backend

### lib/api.ts Analysis

**File:** `lib/api.ts`
**Line 1 Comment:** "API client for the Django REST backend, reached via the Next.js /api proxy."

**Base URL:**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
```

**Issue:** The frontend API client is designed to call Django endpoints, not Next.js endpoints.

### Endpoint Definitions

The `apiEndpoints` object in lib/api.ts defines many endpoints that **do not exist in Next.js**:

#### Missing from Next.js (Django-only endpoints):

**Video Actions:**
- `/videos/my_videos` - Missing
- `/videos/{id}/update_status` - Missing
- `/videos/{id}/advance_workflow` - Missing
- `/videos/{id}/reject` - Missing
- `/videos/workflow_stats` - Missing

**Video Assets:**
- `/video-assets` - Missing (model exists, no endpoints)
- `/video-assets/{id}` - Missing
- `/video-assets/my_uploads` - Missing

**Task Actions:**
- `/tasks/upcoming` - Missing
- `/tasks/{id}/assign` - Missing
- `/tasks/{id}/carry_forward` - Missing
- `/tasks/{id}/reject` - Missing
- `/tasks/carry_forward_all_pending` - Missing

**Client Actions:**
- `/clients/{id}/progress` - Missing
- `/clients/{id}/monthly_target` - Missing
- `/clients/{id}/monthly_protocol` - Missing
- `/clients/all_progress` - Missing

**Social Posts:**
- `/social-posts` - Missing (model exists, no endpoints)
- `/social-posts/{id}` - Missing
- `/social-posts/{id}/mark_posted` - Missing
- `/social-posts/scheduled` - Missing
- `/social-posts/my_posts` - Missing

**Approval Actions:**
- `/approvals/{id}/request_changes` - Missing

**Notification Actions:**
- `/notifications/{id}/mark_read` - Missing (different endpoint exists)
- `/notifications/mark_all_read` - Missing
- `/notifications/bulk_mark_read` - Missing

**Dashboard Actions:**
- `/dashboard/task-summary` - Missing
- `/dashboard/company-overview` - Missing

**Video Protocol Actions:**
- `/video-protocol/protocols/{id}/dashboard` - Missing
- `/video-protocol/protocols/{id}/update-target` - Missing
- `/video-protocol/protocols/{id}/reports` - Missing
- `/video-protocol/video-records` - Missing (model exists, no endpoints)
- `/video-protocol/video-stages` - Missing (model exists, no endpoints)
- `/video-protocol/video-stages/{id}/start` - Missing
- `/video-protocol/video-stages/{id}/complete` - Missing
- `/video-protocol/video-stages/{id}/reject` - Missing
- `/video-protocol/video-stages/{id}/assign` - Missing
- `/video-protocol/video-stages/my_tasks` - Missing

### Token Refresh Logic

**lib/api.ts lines 247-298:**
```typescript
public async refreshToken(): Promise<string | null> {
  // ...
  let response = await fetch(`${this.baseUrl}/auth/token/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    // Fallback to /auth/refresh if needed
    response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  // ...
}
```

**Issue:** The frontend tries `/auth/token/refresh` first (Django path), then falls back to `/auth/refresh` (Next.js path).

### Cookie Handling

**lib/api.ts lines 6-13:**
```typescript
const ACCESS_TOKEN_KEY = 'zenfix_access_token';
const REFRESH_TOKEN_KEY = 'zenfix_refresh_token';
const ACCESS_TOKEN_MAX_AGE = 60 * 60; // 1 hour
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
```

**Status:** ✅ Matches both Django and Next.js cookie settings

### CSRF Token Handling

**lib/api.ts lines 215-245:**
```typescript
private ensureCsrf(): Promise<string | null> {
  // ...
  const response = await fetch(`${this.baseUrl}/auth/csrf`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  // ...
}
```

**Status:** ⚠️ CSRF endpoint exists in Next.js but may not be enforced

### Proxy Configuration

**proxy.ts:**
```typescript
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/adminzenfix')) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // NOTE: Authentication is handled client-side by the AuthProvider
  // Proxy only handles basic route protection
  // The AuthProvider will verify tokens with the backend and redirect if needed
  
  // Allow all admin routes to pass through - client-side auth will handle protection
  return NextResponse.next();
}
```

**Status:** ⚠️ Proxy does not enforce authentication, relies on client-side AuthProvider

## Critical Issues

### 1. Frontend Calls Django Endpoints (CRITICAL)

**Issue:** The frontend API client is designed for Django backend, not Next.js backend.

**Impact:**
- Frontend calls endpoints that don't exist in Next.js
- Many features will fail if Django backend is removed
- The application is not actually using the Next.js backend

**Evidence:**
- lib/api.ts comment: "API client for the Django REST backend"
- 40+ endpoints defined in lib/api.ts that don't exist in Next.js
- Refresh token logic uses Django path first

### 2. Authentication Duplication (CRITICAL)

**Current State:**
- Django backend has authentication endpoints
- Next.js backend has authentication endpoints
- Frontend may be calling either

**Issue:** Unclear which backend the frontend is actually using for authentication.

**Impact:**
- If frontend uses Django auth, Next.js auth is unused
- If frontend uses Next.js auth, Django auth is unused
- Password hashing incompatibility between backends

### 3. Missing Next.js Endpoints (CRITICAL)

**Issue:** Frontend expects 40+ endpoints that don't exist in Next.js.

**Impact:**
- Features will fail when called
- Video protocol workflow completely broken
- Social posting completely broken
- Task carry-forward broken
- Client progress tracking broken

## Recommendations

### Immediate Actions (Critical)

1. **Determine which backend is actually being used**
   - Check environment variables (NEXT_PUBLIC_API_URL)
   - Check network requests in browser dev tools
   - Verify which backend is responding to API calls

2. **If using Django backend:**
   - Next.js backend is redundant
   - Consider removing Next.js backend entirely
   - Or migrate frontend to use Next.js backend

3. **If using Next.js backend:**
   - Frontend API client needs complete rewrite
   - All missing endpoints must be implemented
   - Password hashing issue must be resolved

### High Priority

4. **Implement missing Next.js endpoints**
   - Video protocol endpoints (16 endpoints)
   - Video asset endpoints (6 endpoints)
   - Social post endpoints (8 endpoints)
   - Task action endpoints (5 endpoints)
   - Client action endpoints (5 endpoints)

5. **Fix authentication duplication**
   - Choose one backend for authentication
   - Remove authentication from the other backend
   - Update frontend to use chosen backend

### Medium Priority

6. **Update frontend API client**
   - Remove Django-specific endpoints
   - Add Next.js-specific endpoints
   - Update refresh token logic
   - Update type definitions

7. **Fix proxy configuration**
   - Add proper authentication enforcement
   - Remove client-side auth dependency
   - Add route protection

## Summary

**Current State:** ⚠️ Frontend is designed for Django backend, not Next.js backend

**Critical Issues:**
1. Frontend API client designed for Django
2. 40+ endpoints expected by frontend don't exist in Next.js
3. Authentication duplication between backends
4. Unclear which backend is actually being used

**Recommendation:** Determine which backend is actually being used before proceeding with any migration work. The frontend may need complete rewrite to work with Next.js backend.

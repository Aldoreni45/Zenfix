# Authentication Implementation Audit

## Django vs Next.js Authentication Comparison

### JWT Configuration

**Django (SIMPLE_JWT):**
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_COOKIE': 'zenfix_access_token',
    'REFRESH_COOKIE': 'zenfix_refresh_token',
}
```

**Next.js (lib/auth/jwt.ts):**
```typescript
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
```

**Status:** ✅ Match

### Cookie Settings

**Django:**
- zenfix_access_token: 60 min, NOT HttpOnly, SameSite=Lax
- zenfix_refresh_token: 7 days, NOT HttpOnly, SameSite=Lax

**Next.js (app/api/auth/login/route.ts):**
```typescript
response.cookies.set('zenfix_access_token', access, {
  maxAge: 60 * 60, // 1 hour
  path: '/',
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});

response.cookies.set('zenfix_refresh_token', refresh, {
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
});
```

**Status:** ✅ Match

### JWT Library

**Django:** Uses djangorestframework-simple-jwt (built on PyJWT)
**Next.js:** Uses jose (JavaScript JWT library)

**Status:** ⚠️ Different libraries but compatible

### JWT Payload Structure

**Django:**
```python
{
  'user_id': user.numeric_id,
  'username': user.username,
  'role': user.role,
  'token_type': 'access' | 'refresh'
}
```

**Next.js:**
```typescript
{
  userId: number,
  username: string,
  role: string,
  type: 'access' | 'refresh'
}
```

**Issue:** ⚠️ Field naming difference (snake_case vs camelCase)
- Django: `user_id`, `token_type`
- Next.js: `userId`, `type`

**Impact:** Frontend must handle different field names if switching between backends

### Authentication Middleware

**Django:** Uses DRF authentication classes
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

**Next.js:** Custom middleware (lib/auth/middleware.ts)
```typescript
export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);
  return {
    userId: payload.userId,
    username: payload.username,
    role: payload.role as UserRole,
  };
}
```

**Status:** ✅ Functionally equivalent

### Password Hashing

**Django:** Uses Django's built-in password hashing (PBKDF2)
**Next.js:** Uses bcryptjs

**Issue:** ⚠️ Different hashing algorithms

**Impact:** 
- Passwords hashed in Django cannot be verified in Next.js
- Passwords hashed in Next.js cannot be verified in Django
- **Critical:** If users were created in Django, they cannot login to Next.js without password reset

### Password Validation

**Django:** Uses Django validators
**Next.js:** Custom validation (lib/auth/password.ts)
```typescript
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { valid: errors.length === 0, errors };
}
```

**Status:** ⚠️ May differ from Django validation

### Login Flow

**Django:**
1. POST /api/auth/login with username/password
2. Verify password using Django's verify()
3. Check user status (ACTIVE)
4. Log activity
5. Generate JWT tokens
6. Set cookies
7. Return user data + access token

**Next.js:**
1. POST /api/auth/login with username/password
2. Verify password using bcrypt.compare()
3. Check user status (ACTIVE)
4. Log activity
5. Generate JWT tokens
6. Set cookies
7. Return user data + access token

**Status:** ✅ Flow matches

### Token Refresh Flow

**Django:**
1. POST /api/auth/token/refresh with refresh token
2. Verify refresh token
3. Generate new access token
4. Generate new refresh token (rotation)
5. Set cookies
6. Return access token

**Next.js:**
1. POST /api/auth/refresh with refresh token
2. Verify refresh token
3. Generate new access token
4. Generate new refresh token (rotation)
5. Set cookies
6. Return access token

**Status:** ✅ Flow matches

### Logout Flow

**Django:**
1. POST /api/auth/logout
2. Blacklist refresh token (if using blacklist)
3. Clear cookies
4. Return success

**Next.js:**
1. POST /api/auth/logout
2. Clear cookies
3. Return success

**Issue:** ⚠️ Next.js does not implement token blacklisting

**Impact:** Refresh tokens remain valid until expiry even after logout

### User Status Check

**Django:**
```python
if user.status != UserStatus.ACTIVE or not user.is_active:
    return Response({'error': 'Account is inactive or suspended'}, status=403)
```

**Next.js:**
```typescript
if (user.status !== UserStatus.ACTIVE || !user.is_active) {
  return NextResponse.json(
    { error: 'Account is inactive or suspended. Contact your administrator.' },
    { status: 403 }
  );
}
```

**Status:** ✅ Match

### Activity Logging

**Django:** Logs LOGIN action on successful login
**Next.js:** Logs LOGIN action on successful login

**Status:** ✅ Match

## Critical Issues

### 1. Password Hashing Incompatibility (CRITICAL)

**Issue:** Django uses PBKDF2, Next.js uses bcryptjs

**Impact:** 
- Users created in Django cannot login to Next.js
- Users created in Next.js cannot login to Django
- **This is a blocking issue for migration**

**Solution Options:**
1. Re-hash all passwords with bcrypt during migration
2. Implement dual hashing support (verify both algorithms)
3. Require all users to reset passwords after migration

### 2. JWT Payload Field Naming (MEDIUM)

**Issue:** Django uses snake_case, Next.js uses camelCase

**Impact:** Frontend must handle different field names

**Solution:** Standardize on one naming convention (recommend camelCase for Next.js)

### 3. Token Blacklisting Missing (MEDIUM)

**Issue:** Next.js does not implement token blacklisting on logout

**Impact:** Refresh tokens remain valid after logout (security concern)

**Solution:** Implement token blacklisting or use short refresh token expiry

### 4. Duplicate Refresh Endpoints (LOW)

**Issue:** Next.js has both `/api/auth/refresh` and `/api/auth/token/refresh`

**Impact:** Confusion, potential inconsistency

**Solution:** Remove one endpoint (recommend keeping `/api/auth/refresh`)

## Recommendations

### Immediate Actions (Critical)

1. **Fix password hashing incompatibility**
   - Implement password re-hashing during migration
   - Or require password reset for all users
   - This is blocking for production use

2. **Standardize JWT payload field names**
   - Choose camelCase (Next.js standard)
   - Update Django to use camelCase if needed
   - Or update Next.js to use snake_case

### High Priority

3. **Implement token blacklisting**
   - Add blacklist collection to MongoDB
   - Blacklist refresh tokens on logout
   - Check blacklist on token refresh

4. **Remove duplicate refresh endpoint**
   - Keep `/api/auth/refresh`
   - Remove `/api/auth/token/refresh`

### Medium Priority

5. **Add password reset endpoint**
   - Implement `/api/auth/password-reset`
   - Implement `/api/auth/password-reset/confirm`
   - Required if forcing password reset

6. **Add CSRF protection**
   - `/api/auth/csrf` exists but not used
   - Implement CSRF token validation for state-changing requests

### Low Priority

7. **Add rate limiting**
   - Prevent brute force attacks on login
   - Implement rate limiting on auth endpoints

8. **Add 2FA support**
   - Optional but recommended for security
   - Implement TOTP-based 2FA

## Authentication Duplication Check

**Current State:**
- Django backend has authentication
- Next.js backend has authentication
- Frontend may be calling either

**Issue:** Potential authentication duplication if both backends are active

**Solution:** 
- Ensure frontend only calls Next.js authentication endpoints
- Disable Django authentication endpoints if not needed
- Or use Django as auth provider and Next.js as proxy (not recommended)

## Summary

**Authentication Status:** ⚠️ Partially Compatible

**Blocking Issues:**
1. Password hashing incompatibility (CRITICAL)

**Non-Blocking Issues:**
2. JWT payload field naming difference
3. Missing token blacklisting
4. Duplicate refresh endpoints

**Recommendation:** Fix password hashing incompatibility before proceeding with migration. This is the only critical issue blocking production use.

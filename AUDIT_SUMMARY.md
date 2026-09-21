# Zenfix Backend Migration Audit Summary

## Audit Overview

**Objective:** Review API routes and compare Django vs Next.js backends for migration assessment.

**Completed Phases:** 1-9
- Phase 1: Safe checkpoint (git status, branch, commits) ✅
- Phase 2: Inspect Django backend completely ✅
- Phase 3: Build Django API inventory ✅
- Phase 4: Inspect current Next.js backend ✅
- Phase 5: Django vs Next.js endpoint comparison ✅
- Phase 6: Django model vs MongoDB comparison ✅
- Phase 7: Audit authentication implementation ✅
- Phase 8: Remove authentication duplication ✅
- Phase 9: Compare RBAC implementation ✅

## Critical Findings

### 1. Frontend Designed for Django Backend (CRITICAL)

**File:** `lib/api.ts`
**Line 1 Comment:** "API client for the Django REST backend, reached via the Next.js /api proxy."

**Issue:** The frontend API client is designed to call Django endpoints, not Next.js endpoints.

**Impact:**
- Frontend calls 40+ endpoints that don't exist in Next.js
- Features will fail if Django backend is removed
- The application may not be using the Next.js backend at all

**Missing Next.js Endpoints (40+):**
- Video protocol workflow (16 endpoints)
- Video assets (6 endpoints)
- Social posts (8 endpoints)
- Task actions (5 endpoints)
- Client actions (5 endpoints)
- Video actions (5 endpoints)
- Approval actions (1 endpoint)
- Notification actions (2 endpoints)
- Dashboard actions (2 endpoints)

### 2. Password Hashing Incompatibility (CRITICAL)

**Django:** Uses PBKDF2 password hashing
**Next.js:** Uses bcryptjs password hashing

**Impact:**
- Users created in Django cannot login to Next.js
- Users created in Next.js cannot login to Django
- **Blocking issue for migration**

**Solution Required:**
- Re-hash all passwords with bcrypt during migration
- Or require all users to reset passwords
- Or implement dual hashing support

### 3. Authentication Duplication (HIGH)

**Current State:**
- Django backend has authentication endpoints
- Next.js backend has authentication endpoints
- Frontend may be calling either

**Issue:** Unclear which backend the frontend is actually using.

**Impact:**
- Potential authentication confusion
- Token refresh logic tries Django path first

### 4. Duplicate Refresh Endpoints (LOW)

**Next.js:** Both `/api/auth/refresh` and `/api/auth/token/refresh` exist

**Issue:** Confusion, potential inconsistency

**Recommendation:** Remove `/api/auth/token/refresh`

## Endpoint Comparison Summary

**Django:** ~120+ endpoints across 15 ViewSets
**Next.js:** ~65+ endpoints across 12 resource groups
**Gap:** ~55+ endpoints missing from Next.js

### Critical Missing Endpoints

1. **Comment System** - 7 endpoints missing
2. **Video Protocol Workflow** - 16 endpoints missing
3. **Video Assets** - 6 endpoints missing
4. **Social Posts** - 8 endpoints missing
5. **Task Carry Forward** - 3 endpoints missing
6. **Video Workflow Actions** - 5 endpoints missing
7. **Client Progress Tracking** - 5 endpoints missing

## Model Comparison Summary

**Django:** 11 models with django-mongodb-backend
**MongoDB:** 10 model classes (with 3 embedded models without endpoints)

### Key Differences

1. **Foreign Keys vs Numeric IDs**
   - Django: Uses ForeignKey for relationships
   - MongoDB: Uses numeric_id (number) for relationships

2. **JSONField vs TypeScript Types**
   - Django: Uses JSONField for arrays
   - MongoDB: Uses string[] or specific TypeScript types

3. **Properties vs Fields**
   - Django: Uses @property for computed fields
   - MongoDB: Stores as fields in document

4. **Missing API Endpoints**
   - TaskCommentModel - No endpoints
   - VideoAssetModel - No endpoints
   - SocialPostModel - No endpoints
   - VideoRecordModel - No endpoints
   - VideoStageModel - No endpoints

## Authentication Comparison

### Matching Features
- JWT configuration (1 hour access, 7 days refresh)
- Cookie settings (NOT HttpOnly, SameSite=Lax)
- Login flow
- Token refresh flow
- User status check
- Activity logging

### Differences
1. **JWT Library:** PyJWT (Django) vs jose (Next.js)
2. **JWT Payload:** snake_case (Django) vs camelCase (Next.js)
3. **Password Hashing:** PBKDF2 (Django) vs bcryptjs (Next.js) - CRITICAL
4. **Token Blacklisting:** Django has it, Next.js missing
5. **Duplicate Refresh Endpoints:** Next.js has both paths

## RBAC Comparison

### Matching Features
- Role definitions (owner, manager, employee)
- Authentication requirement
- Owner-only restriction
- Owner-or-manager restriction
- Role-based data filtering

### Missing in Next.js
1. ReadOnlyOrOwnerManager permission
2. IsAuthenticatedAndActive permission

### Extra in Next.js
1. Flexible requireRole function

**Status:** ✅ Mostly Compatible

## Generated Audit Documents

1. **DJANGO_API_INVENTORY.md** - Complete Django endpoint inventory
2. **NEXTJS_API_INVENTORY.md** - Complete Next.js endpoint inventory
3. **ENDPOINT_COMPARISON.md** - Detailed endpoint comparison
4. **MODEL_COMPARISON.md** - Detailed model comparison
5. **AUTHENTICATION_AUDIT.md** - Authentication implementation audit
6. **FRONTEND_API_CLIENT_AUDIT.md** - Frontend API client analysis
7. **RBAC_COMPARISON.md** - RBAC implementation comparison

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
   - All 40+ missing endpoints must be implemented
   - Password hashing issue must be resolved

### High Priority

4. **Fix password hashing incompatibility**
   - Implement password re-hashing during migration
   - Or require password reset for all users

5. **Implement missing Next.js endpoints** (if migrating)
   - Video protocol endpoints (16 endpoints)
   - Video asset endpoints (6 endpoints)
   - Social post endpoints (8 endpoints)
   - Task action endpoints (5 endpoints)
   - Client action endpoints (5 endpoints)

6. **Fix authentication duplication**
   - Choose one backend for authentication
   - Remove authentication from the other backend

### Medium Priority

7. **Remove duplicate refresh endpoint**
   - Keep `/api/auth/refresh`
   - Remove `/api/auth/token/refresh`

8. **Implement token blacklisting**
   - Add blacklist collection to MongoDB
   - Blacklist refresh tokens on logout

## Conclusion

**Current State:** ⚠️ Critical Issues Found

**Blocking Issues:**
1. Frontend designed for Django backend, not Next.js
2. 40+ endpoints expected by frontend don't exist in Next.js
3. Password hashing incompatibility between backends
4. Unclear which backend is actually being used

**Recommendation:** 
**Stop migration work until backend usage is clarified.** The frontend may need complete rewrite to work with Next.js backend, or the Next.js backend may be redundant if Django is being used.

**Next Steps:**
1. Determine which backend is actually being used
2. Based on findings, either:
   - Remove Next.js backend (if Django is used)
   - Implement all missing endpoints in Next.js (if Next.js is used)
3. Resolve password hashing incompatibility
4. Complete migration only after backend decision is made

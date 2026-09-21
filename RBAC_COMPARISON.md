# RBAC Implementation Comparison

## Role Definitions

### Django Roles

**File:** `backend/users/models.py - User.Role`

```python
class Role(models.TextChoices):
    OWNER = 'owner', 'Owner'
    MANAGER = 'manager', 'Manager'
    EMPLOYEE = 'employee', 'Employee'
```

### Next.js Roles

**File:** `lib/types/models.ts - UserRole`

```typescript
export const UserRole = {
  OWNER: 'owner',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
```

**Status:** ✅ Match (same values, same naming)

## Permission Classes

### Django Permissions

**File:** `backend/common/permissions.py`

#### IsOwnerRole

```python
class IsOwnerRole(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == user.Role.OWNER)
```

**Usage:** Restricts access to owner role only

#### IsOwnerOrManager

```python
class IsOwnerOrManager(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in {user.Role.OWNER, user.Role.MANAGER})
```

**Usage:** Restricts access to owner or manager roles

#### ReadOnlyOrOwnerManager

```python
class ReadOnlyOrOwnerManager(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.role in {user.Role.OWNER, user.Role.MANAGER}
```

**Usage:** Read-only for authenticated users, write access for owner/manager

#### IsAuthenticatedAndActive

```python
class IsAuthenticatedAndActive(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and user.status == "active")
```

**Usage:** Requires authenticated, active, and status=active

### Next.js Middleware

**File:** `lib/auth/middleware.ts`

#### requireAuth

```typescript
export function requireAuth(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}
```

**Usage:** Requires authentication (any role)

#### requireRole

```typescript
export function requireRole(allowedRoles: UserRole[]) {
  return function(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      const user = await authenticateRequest(request);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      return handler(request, user);
    };
  };
}
```

**Usage:** Requires specific roles (flexible)

#### requireOwner

```typescript
export function requireOwner(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return requireRole(['owner'])(handler);
}
```

**Usage:** Requires owner role only

#### requireOwnerOrManager

```typescript
export function requireOwnerOrManager(handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>) {
  return requireRole(['owner', 'manager'])(handler);
}
```

**Usage:** Requires owner or manager role

## Comparison

| Permission | Django | Next.js | Status |
|------------|--------|---------|--------|
| Authenticated only | IsAuthenticated | requireAuth | ✅ Match |
| Owner only | IsOwnerRole | requireOwner | ✅ Match |
| Owner or Manager | IsOwnerOrManager | requireOwnerOrManager | ✅ Match |
| Read-only + Write for Owner/Manager | ReadOnlyOrOwnerManager | ❌ Missing | ⚠️ Missing |
| Authenticated + Active + Status=Active | IsAuthenticatedAndActive | ❌ Missing | ⚠️ Missing |
| Flexible role check | ❌ Missing | requireRole | ✅ Next.js has |

## Missing in Next.js

### 1. ReadOnlyOrOwnerManager

**Django:** Read-only for authenticated users, write access for owner/manager

**Next.js:** Not implemented

**Impact:** Cannot have read-only access for employees with write access restricted to owners/managers

**Workaround:** Must implement custom logic in each endpoint

### 2. IsAuthenticatedAndActive

**Django:** Requires authenticated, active, and status=active

**Next.js:** Not implemented

**Impact:** Status check is done manually in endpoints (e.g., login endpoint)

**Workaround:** Manual status check in each endpoint

## Extra in Next.js

### requireRole (Flexible)

**Next.js:** Allows specifying any combination of roles

**Django:** Would need custom permission class for each combination

**Benefit:** More flexible than Django

## RBAC Implementation in Endpoints

### Django Example

```python
class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsOwnerRole()]
        elif self.action in ['update', 'partial_update']:
            return [IsOwnerOrManager()]
        return [IsAuthenticated]
```

### Next.js Example

```typescript
export async function GET(request: NextRequest) {
  return requireAuth((req, user) => getHandler(req, user))(request);
}

export async function POST(request: NextRequest) {
  return requireOwner((req, user) => postHandler(req, user))(request);
}

export async function PATCH(request: NextRequest) {
  return requireOwnerOrManager((req, user) => patchHandler(req, user))(request);
}
```

**Status:** ✅ Similar implementation pattern

## Role-Based Data Filtering

### Django Example

```python
def get_queryset(self):
    user = self.request.user
    if user.role == user.Role.EMPLOYEE:
        return Task.objects.filter(assigned_to=user)
    elif user.role == user.Role.MANAGER:
        return Task.objects.filter(Q(assigned_to=user) | Q(assigned_manager=user))
    return Task.objects.all()
```

### Next.js Example

```typescript
async function handler(request: NextRequest, user: any) {
  const filters: any = {};
  
  if (user.role === 'employee') {
    filters.assigned_to_id = user.userId;
  } else if (user.role === 'manager') {
    filters.$or = [
      { assigned_to_id: user.userId },
      { assigned_manager_id: user.userId }
    ];
  }
  
  const tasks = await TaskModel.findAll(filters);
  return NextResponse.json(tasks);
}
```

**Status:** ✅ Similar implementation pattern

## Summary

**RBAC Status:** ✅ Mostly Compatible

**Matching Features:**
- Role definitions (owner, manager, employee)
- Authentication requirement
- Owner-only restriction
- Owner-or-manager restriction
- Role-based data filtering

**Missing in Next.js:**
1. ReadOnlyOrOwnerManager permission
2. IsAuthenticatedAndActive permission

**Extra in Next.js:**
1. Flexible requireRole function

**Recommendation:**
- The missing permissions can be implemented as custom middleware functions
- The flexible requireRole is a benefit over Django
- Overall RBAC implementation is functionally equivalent

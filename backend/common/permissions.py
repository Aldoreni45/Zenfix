from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwnerRole(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == user.Role.OWNER)


class IsOwnerOrManager(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in {user.Role.OWNER, user.Role.MANAGER})


class ReadOnlyOrOwnerManager(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.role in {user.Role.OWNER, user.Role.MANAGER}


class IsAuthenticatedAndActive(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and user.status == "active")

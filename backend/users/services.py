from __future__ import annotations

import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied, ValidationError

from activity_logs.models import ActivityLog
from activity_logs.services import ActivityLogService
from users.models import User

logger = logging.getLogger("users.auth")


class AuthService:
    MAX_FAILURES = 5
    LOCK_SECONDS = 15 * 60

    @classmethod
    def _lock_key(cls, username: str, ip: str) -> str:
        return f"login-lock:{username.lower()}:{ip}"

    @classmethod
    def login(cls, request, username: str, password: str) -> User:
        ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or request.META.get("REMOTE_ADDR", "local")
        key = cls._lock_key(username, ip)
        failures = cache.get(key, 0)
        if failures >= cls.MAX_FAILURES:
            raise AuthenticationFailed("Too many failed attempts. Try again in 15 minutes.")
        user = authenticate(request, username=username, password=password)
        if user is None:
            cache.set(key, failures + 1, cls.LOCK_SECONDS)
            logger.info("Failed login for %s", username)
            raise AuthenticationFailed("Invalid username or password.")
        if user.status != User.Status.ACTIVE or not user.is_active:
            raise PermissionDenied("Account is inactive or suspended. Contact your administrator.")
        cache.delete(key)
        login(request, user)
        ActivityLogService.log(
            actor=user,
            action=ActivityLog.Action.LOGIN,
            entity_type="user",
            entity_id=str(user.numeric_id),
            description="User logged in",
            request=request,
        )
        return user

    @classmethod
    def logout(cls, request) -> None:
        user = request.user if request.user.is_authenticated else None
        logout(request)
        if user:
            ActivityLogService.log(
                actor=user,
                action=ActivityLog.Action.LOGOUT,
                entity_type="user",
                entity_id=str(user.numeric_id),
                description="User logged out",
                request=request,
            )

    @classmethod
    def change_password(cls, user: User, old_password: str, new_password: str, request=None) -> None:
        if not user.check_password(old_password):
            raise ValidationError({"old_password": "Current password is incorrect."})
        try:
            validate_password(new_password, user)
        except DjangoValidationError as exc:
            raise ValidationError({"new_password": list(exc.messages)}) from exc
        user.set_password(new_password)
        user.save()
        ActivityLogService.log(
            actor=user,
            action=ActivityLog.Action.PASSWORD_CHANGE,
            entity_type="user",
            entity_id=str(user.numeric_id),
            description="Password changed",
            request=request,
        )

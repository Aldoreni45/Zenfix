from django.contrib.auth.tokens import default_token_generator
from django.middleware.csrf import get_token
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from activity_logs.models import ActivityLog
from activity_logs.services import ActivityLogService
from common.permissions import IsAuthenticatedAndActive, IsOwnerRole
from common.throttling import LoginRateThrottle, PasswordResetThrottle
from common.viewsets import NumericIdViewSetMixin
from notifications.services import NotificationService
from users.models import User
from users.serializers import LoginSerializer, PasswordChangeSerializer, UserSerializer
from users.services import AuthService


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    @method_decorator(ensure_csrf_cookie)
    @action(detail=False, methods=["get"])
    def csrf(self, request):
        token = get_token(request)
        return Response({"csrfToken": token})

    @action(detail=False, methods=["post"], throttle_classes=[LoginRateThrottle], permission_classes=[AllowAny])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.login(request, serializer.validated_data["username"], serializer.validated_data["password"])
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        data = UserSerializer(user).data
        response = Response({
            "user": data,
            "access": str(access),
            "refresh": str(refresh),
        })
        
        # Set cookies with HttpOnly, Secure, SameSite flags
        # Access token: 60 minutes
        response.set_cookie(
            'zenfix_access_token',
            str(access),
            max_age=60 * 60,  # 1 hour
            path='/',
            secure=False,  # Set to True in production with HTTPS
            httponly=True,
            samesite='lax'
        )
        
        # Refresh token: 7 days
        response.set_cookie(
            'zenfix_refresh_token',
            str(refresh),
            max_age=7 * 24 * 60 * 60,  # 7 days
            path='/',
            secure=False,  # Set to True in production with HTTPS
            httponly=True,
            samesite='lax'
        )
        
        return response

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated])
    def logout(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            # Blacklisting disabled for MongoDB compatibility
            pass
        
        response = Response({"success": True})
        
        # Clear cookies
        response.delete_cookie('zenfix_access_token', path='/')
        response.delete_cookie('zenfix_refresh_token', path='/')
        
        return response

    @action(detail=False, methods=["post"], permission_classes=[AllowAny])
    def refresh(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            raise ValidationError({"refresh": "This field is required."})
        
        try:
            refresh = RefreshToken(refresh_token)
            access = refresh.access_token
            
            response = Response({
                "access": str(access),
                "refresh": str(refresh),  # Return rotated refresh token
            })
            
            # Update cookies with new tokens
            response.set_cookie(
                'zenfix_access_token',
                str(access),
                max_age=60 * 60,  # 1 hour
                path='/',
                secure=False,  # Set to True in production with HTTPS
                httponly=True,
                samesite='lax'
            )
            
            response.set_cookie(
                'zenfix_refresh_token',
                str(refresh),
                max_age=7 * 24 * 60 * 60,  # 7 days
                path='/',
                secure=False,  # Set to True in production with HTTPS
                httponly=True,
                samesite='lax'
            )
            
            return response
        except Exception as e:
            raise ValidationError({"refresh": "Invalid or expired refresh token."})

    @action(detail=False, methods=["post"], permission_classes=[IsAuthenticated], url_path="password-change")
    def password_change(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.change_password(request.user, serializer.validated_data["old_password"], serializer.validated_data["new_password"], request)
        return Response({"success": True})

    @action(detail=False, methods=["post"], throttle_classes=[PasswordResetThrottle], url_path="password-reset")
    def password_reset(self, request):
        email = (request.data.get("email") or "").strip()
        if not email:
            raise ValidationError({"email": "Email is required."})
        user = User.objects.filter(email__iexact=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            # Architecture only: console email backend in development.
            from django.core.mail import send_mail

            send_mail(
                "ZenFix password reset",
                f"Use uid={uid} token={token} with POST /api/auth/password-reset-confirm/",
                None,
                [email],
                fail_silently=True,
            )
        return Response({"success": True, "message": "If the account exists, reset instructions were sent."})

    @action(detail=False, methods=["post"], throttle_classes=[PasswordResetThrottle], url_path="password-reset-confirm")
    def password_reset_confirm(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        password = request.data.get("new_password")
        if not all([uid, token, password]):
            raise ValidationError("uid, token, and new_password are required.")
        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except Exception as exc:  # noqa: BLE001
            raise ValidationError("Invalid reset token.") from exc
        if not default_token_generator.check_token(user, token):
            raise ValidationError("Invalid or expired reset token.")
        user.set_password(password)
        user.save()
        return Response({"success": True})


class UserViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticatedAndActive]
    search_fields = ("username", "email", "first_name", "last_name")
    filterset_fields = ("role", "status", "department")
    ordering_fields = ("username", "created_at", "role")
    queryset = User.objects.none()

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.all().select_related("department", "reports_to")
        if user.role == User.Role.OWNER:
            return qs
        if user.role == User.Role.MANAGER:
            return qs.filter(role__in=[User.Role.MANAGER, User.Role.EMPLOYEE])
        return qs.filter(pk=user.pk)

    def perform_create(self, serializer):
        if self.request.user.role != User.Role.OWNER:
            raise PermissionDenied("Only the owner can create users.")
        role = serializer.validated_data.get("role", User.Role.EMPLOYEE)
        if role == User.Role.OWNER and self.request.user.role != User.Role.OWNER:
            raise PermissionDenied("Cannot create an owner.")
        instance = serializer.save()
        ActivityLogService.log(
            actor=self.request.user,
            action=ActivityLog.Action.CREATE,
            entity_type="user",
            entity_id=str(instance.numeric_id),
            description=f"Created user {instance.username}",
            request=self.request,
        )
        NotificationService.notify(
            recipient=instance,
            title="Account created",
            message="Your ZenFix account is ready.",
            notification_type="user_assigned",
        )

    def perform_update(self, serializer):
        actor = self.request.user
        instance = self.get_object()
        if actor.role != User.Role.OWNER and instance.pk != actor.pk:
            raise PermissionDenied("You can only update your own profile.")
        if "role" in serializer.validated_data and actor.role != User.Role.OWNER:
            raise PermissionDenied("Only the owner can change roles.")
        if instance.role == User.Role.OWNER and actor.pk != instance.pk and actor.role != User.Role.OWNER:
            raise PermissionDenied("Cannot modify the owner.")
        if serializer.validated_data.get("role") == User.Role.OWNER and actor.role != User.Role.OWNER:
            raise PermissionDenied("Managers cannot create owners.")
        serializer.save()

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        return Response(UserSerializer(request.user).data)

    def perform_destroy(self, instance):
        if self.request.user.role != User.Role.OWNER:
            raise PermissionDenied("Only the owner can delete users.")
        if instance.role == User.Role.OWNER:
            raise PermissionDenied("Cannot delete the owner.")
        instance.delete()

    @action(detail=False, methods=["post"], url_path="change_password")
    def change_password(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AuthService.change_password(request.user, serializer.validated_data["old_password"], serializer.validated_data["new_password"], request)
        return Response({"success": True})

    @action(detail=False, methods=["get"])
    def managers(self, request):
        qs = self.get_queryset().filter(role=User.Role.MANAGER)
        return Response(UserSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def employees(self, request):
        qs = self.get_queryset().filter(role=User.Role.EMPLOYEE)
        return Response(UserSerializer(qs, many=True).data)

    @action(detail=True, methods=["patch"], permission_classes=[IsOwnerRole])
    def status(self, request, pk=None):
        user = self.get_object()
        new_status = request.data.get("status")
        if new_status not in User.Status.values:
            raise ValidationError({"status": "Invalid status."})
        user.status = new_status
        user.save()
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=["patch"], permission_classes=[IsOwnerRole])
    def role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get("role")
        if new_role not in User.Role.values:
            raise ValidationError({"role": "Invalid role."})
        if user.pk == request.user.pk and new_role != User.Role.OWNER:
            raise PermissionDenied("You cannot demote yourself.")
        user.role = new_role
        user.save()
        ActivityLogService.log(
            actor=request.user,
            action=ActivityLog.Action.ROLE_CHANGE,
            entity_type="user",
            entity_id=str(user.numeric_id),
            description=f"Role changed to {new_role}",
            request=request,
        )
        return Response(UserSerializer(user).data)

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from common.permissions import IsAuthenticatedAndActive, IsOwnerOrManager
from common.viewsets import NumericIdViewSetMixin
from targets.models import MonthlyTarget
from targets.serializers import MonthlyTargetSerializer
from users.models import User


class MonthlyTargetViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    serializer_class = MonthlyTargetSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ("year", "month", "target_type", "user", "department", "client")
    queryset = MonthlyTarget.objects.none()

    def get_queryset(self):
        user = self.request.user
        qs = MonthlyTarget.objects.all()
        if user.role == User.Role.OWNER:
            return qs
        if user.role == User.Role.MANAGER:
            return qs.filter(user=user) | qs.filter(department=user.department) | qs.filter(client__assigned_manager=user)
        return qs.filter(user=user)

    def perform_create(self, serializer):
        if self.request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot create targets.")
        data = serializer.validated_data
        exists = MonthlyTarget.objects.filter(
            user=data.get("user"),
            department=data.get("department"),
            client=data.get("client"),
            month=data["month"],
            year=data["year"],
            target_type=data.get("target_type", MonthlyTarget.TargetType.VIDEOS),
        ).exists()
        if exists:
            raise ValidationError("A target already exists for this user/department/month/type.")
        serializer.save(created_by=self.request.user)

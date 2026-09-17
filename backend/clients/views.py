from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from activity_logs.models import ActivityLog
from activity_logs.services import ActivityLogService
from clients.models import Client
from clients.serializers import ClientSerializer
from common.permissions import IsAuthenticatedAndActive
from common.viewsets import NumericIdViewSetMixin
from notifications.services import NotificationService
from targets.models import MonthlyTarget
from targets.serializers import MonthlyTargetSerializer
from users.models import User


class ClientViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticatedAndActive]
    search_fields = ("name", "company_name", "email", "contact_person")
    filterset_fields = ("status", "assigned_manager")
    ordering_fields = ("created_at", "name")
    queryset = Client.objects.none()

    def get_queryset(self):
        user = self.request.user
        qs = Client.objects.all()
        if user.role == User.Role.OWNER:
            return qs
        if user.role == User.Role.MANAGER:
            return qs.filter(Q(assigned_manager=user) | Q(assigned_team_ids__contains=user.numeric_id) | Q(created_by=user))
        return qs.filter(Q(assigned_team_ids__contains=user.numeric_id) | Q(tasks__assigned_to=user)).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot create clients.")
        instance = serializer.save(created_by=user)
        ActivityLogService.log(actor=user, action=ActivityLog.Action.CREATE, entity_type="client", entity_id=str(instance.numeric_id), description=f"Created client {instance.name}", request=self.request)
        if instance.assigned_manager:
            NotificationService.notify(recipient=instance.assigned_manager, title="Client assigned", message=f"You were assigned {instance.name}.", notification_type="client_assigned", related_object_type="client", related_object_id=str(instance.numeric_id))

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot modify clients.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != User.Role.OWNER:
            raise PermissionDenied("Only the owner can delete clients.")
        instance.delete()

    @action(detail=False, methods=["get"])
    def active(self, request):
        qs = self.get_queryset().filter(status=Client.Status.ACTIVE)
        return Response(ClientSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def all_progress(self, request):
        result = []
        for client in self.get_queryset():
            target = client.monthly_targets.order_by("-year", "-month").first()
            data = ClientSerializer(client).data
            data["current_progress"] = target.progress_percentage if target else 0
            data["current_month_target"] = MonthlyTargetSerializer(target).data if target else None
            result.append(data)
        return Response(result)

    @action(detail=True, methods=["get"])
    def progress(self, request, pk=None):
        client = self.get_object()
        target = client.monthly_targets.order_by("-year", "-month").first()
        data = ClientSerializer(client).data
        data["current_progress"] = target.progress_percentage if target else 0
        data["monthly_target"] = MonthlyTargetSerializer(target).data if target else {}
        return Response(data)

    @action(detail=True, methods=["get"])
    def monthly_target(self, request, pk=None):
        client = self.get_object()
        target = client.monthly_targets.order_by("-year", "-month").first()
        return Response(MonthlyTargetSerializer(target).data if target else {})

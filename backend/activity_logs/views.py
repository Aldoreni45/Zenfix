from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from activity_logs.models import ActivityLog
from activity_logs.serializers import ActivityLogSerializer
from common.permissions import IsAuthenticatedAndActive
from common.viewsets import NumericIdViewSetMixin
from users.models import User


class ActivityLogViewSet(NumericIdViewSetMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ("action", "entity_type", "actor")
    ordering_fields = ("created_at",)
    queryset = ActivityLog.objects.none()

    def get_queryset(self):
        user = self.request.user
        qs = ActivityLog.objects.all()
        if user.role == User.Role.OWNER:
            return qs
        if user.role == User.Role.MANAGER:
            return qs.filter(actor__in=[user, *list(User.objects.filter(reports_to=user))])
        return qs.filter(actor=user)

    def list(self, request, *args, **kwargs):
        if request.user.role == User.Role.EMPLOYEE:
            self.queryset = self.get_queryset()
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def my_logs(self, request):
        qs = ActivityLog.objects.filter(actor=request.user)
        return Response(ActivityLogSerializer(qs[:200], many=True).data)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        if request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot view system-wide logs.")
        limit = min(int(request.query_params.get("limit") or 10), 100)
        qs = self.get_queryset()[:limit]
        return Response(ActivityLogSerializer(qs, many=True).data)

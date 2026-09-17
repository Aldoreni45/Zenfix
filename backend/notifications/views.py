from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAuthenticatedAndActive
from common.viewsets import NumericIdViewSetMixin
from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from notifications.services import NotificationService


class NotificationViewSet(NumericIdViewSetMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticatedAndActive]
    queryset = Notification.objects.none()

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=False, methods=["get"])
    def unread(self, request):
        qs = self.get_queryset().filter(is_read=False)
        return Response(NotificationSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def count(self, request):
        qs = self.get_queryset()
        unread = qs.filter(is_read=False).count()
        urgent = qs.filter(priority__in=["urgent", "high"], is_read=False).count()
        return Response({"total": qs.count(), "unread": unread, "urgent": urgent})

    @action(detail=False, methods=["get"])
    def urgent(self, request):
        qs = self.get_queryset().filter(priority__in=["urgent", "high"])
        return Response(NotificationSerializer(qs, many=True).data)

    @action(detail=True, methods=["post", "patch"], url_path="mark_read")
    def mark_read(self, request, pk=None):
        notification = NotificationService.mark_read(self.get_object())
        return Response(NotificationSerializer(notification).data)

    @action(detail=True, methods=["patch"], url_path="read")
    def read(self, request, pk=None):
        return self.mark_read(request, pk)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        now = timezone.now()
        self.get_queryset().filter(is_read=False).update(is_read=True, read_at=now)
        return Response({"success": True})

    @action(detail=False, methods=["post"])
    def bulk_mark_read(self, request):
        ids = request.data.get("ids") or []
        qs = self.get_queryset().filter(numeric_id__in=ids)
        qs.update(is_read=True, read_at=timezone.now())
        return Response({"success": True})

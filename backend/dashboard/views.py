from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAuthenticatedAndActive
from dashboard.services import DashboardService


class DashboardResponseSerializer(serializers.Serializer):
    role = serializers.CharField()
    today_tasks = serializers.IntegerField()
    completed_today = serializers.IntegerField()
    in_progress_today = serializers.IntegerField()
    pending_today = serializers.IntegerField()
    pending_previous = serializers.IntegerField()
    pending_tasks = serializers.IntegerField()
    overdue_tasks = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    waiting_approval = serializers.IntegerField(allow_null=True)
    videos_completed = serializers.IntegerField(allow_null=True)
    videos_posted = serializers.IntegerField(allow_null=True)
    videos_remaining = serializers.IntegerField(allow_null=True)


class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticatedAndActive]
    serializer_class = DashboardResponseSerializer
    queryset = []  # Required for drf-spectacular schema generation

    def list(self, request):
        return Response(DashboardService.build(request.user))

    @action(detail=False, methods=["get"], url_path="task-summary")
    def task_summary(self, request):
        return Response(DashboardService.task_summary(request.user))

    @action(detail=False, methods=["get"], url_path="company-overview")
    def company_overview(self, request):
        data = DashboardService.build(request.user)
        return Response(data)

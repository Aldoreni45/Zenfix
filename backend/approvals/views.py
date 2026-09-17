from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from approvals.models import Approval
from approvals.serializers import ApprovalSerializer
from approvals.services import ApprovalService
from common.permissions import IsAuthenticatedAndActive
from common.viewsets import NumericIdViewSetMixin
from users.models import User


class ApprovalViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    serializer_class = ApprovalSerializer
    permission_classes = [IsAuthenticatedAndActive]
    filterset_fields = ("status", "requested_by", "reviewed_by")
    http_method_names = ["get", "post", "patch", "head", "options"]
    queryset = Approval.objects.none()

    def get_queryset(self):
        user = self.request.user
        qs = Approval.objects.all()
        if user.role == User.Role.OWNER:
            return qs
        if user.role == User.Role.MANAGER:
            return qs.filter(Q(requested_by=user) | Q(reviewed_by=user) | Q(requested_by__reports_to=user) | Q(status=Approval.Status.PENDING))
        return qs.filter(requested_by=user)

    def perform_create(self, serializer):
        instance = serializer.save(requested_by=self.request.user, status=Approval.Status.PENDING)
        from activity_logs.models import ActivityLog
        from activity_logs.services import ActivityLogService
        from notifications.services import NotificationService

        ActivityLogService.log(actor=self.request.user, action=ActivityLog.Action.SUBMIT, entity_type="approval", entity_id=str(instance.numeric_id), description="Approval requested", request=self.request)
        if instance.video and instance.video.created_by:
            NotificationService.notify(recipient=instance.video.created_by, title="Approval requested", message="A review was requested.", notification_type="approval_requested", related_object_type="approval", related_object_id=str(instance.numeric_id))

    @action(detail=False, methods=["get"])
    def pending(self, request):
        if request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied("Employees cannot list all pending approvals.")
        qs = self.get_queryset().filter(status=Approval.Status.PENDING)
        return Response(ApprovalSerializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def my_approvals(self, request):
        qs = Approval.objects.filter(requested_by=request.user)
        return Response(ApprovalSerializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        approval = ApprovalService.decide(self.get_object(), actor=request.user, status=Approval.Status.APPROVED, comments=request.data.get("comments", ""), request=request)
        return Response(ApprovalSerializer(approval).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        approval = ApprovalService.decide(self.get_object(), actor=request.user, status=Approval.Status.REJECTED, comments=request.data.get("reason") or request.data.get("comments", ""), request=request)
        return Response(ApprovalSerializer(approval).data)

    @action(detail=True, methods=["post"])
    def request_changes(self, request, pk=None):
        approval = ApprovalService.decide(self.get_object(), actor=request.user, status=Approval.Status.CHANGES_REQUESTED, comments=request.data.get("comments", ""), change_requests=request.data.get("change_requests") or [], request=request)
        return Response(ApprovalSerializer(approval).data)

from __future__ import annotations

from django.utils import timezone

from activity_logs.models import ActivityLog
from activity_logs.services import ActivityLogService
from approvals.models import Approval
from notifications.services import NotificationService
from videos.models import Video
from videos.services import VideoWorkflowService


class ApprovalService:
    @staticmethod
    def decide(approval: Approval, *, actor, status: str, comments: str = "", change_requests=None, request=None) -> Approval:
        if actor.role == actor.Role.EMPLOYEE:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Employees cannot review approvals.")
        approval.status = status
        approval.reviewed_by = actor
        approval.reviewer = actor
        approval.reviewed_at = timezone.now()
        approval.reviewer_comments = comments
        if change_requests is not None:
            approval.change_requests = change_requests
        approval.save()
        action = ActivityLog.Action.APPROVE if status == Approval.Status.APPROVED else ActivityLog.Action.REJECT
        ActivityLogService.log(
            actor=actor,
            action=action,
            entity_type="approval",
            entity_id=str(approval.numeric_id),
            description=f"Approval {status}",
            metadata={"comments": comments},
            request=request,
        )
        NotificationService.notify(
            recipient=approval.requested_by,
            title=f"Approval {status}",
            message=comments or f"Your request was {status}.",
            notification_type="task_approved" if status == Approval.Status.APPROVED else "task_rejected",
            related_object_type="approval",
            related_object_id=str(approval.numeric_id),
        )
        if approval.video_id:
            video = approval.video
            if status == Approval.Status.APPROVED:
                VideoWorkflowService.transition(video, Video.Stage.APPROVED, actor=actor, request=request)
            elif status == Approval.Status.REJECTED:
                VideoWorkflowService.transition(video, Video.Stage.REJECTED, actor=actor, request=request)
            elif status == Approval.Status.CHANGES_REQUESTED:
                VideoWorkflowService.transition(video, Video.Stage.REVISION, actor=actor, request=request)
        return approval

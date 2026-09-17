from __future__ import annotations

from rest_framework.exceptions import PermissionDenied, ValidationError

from activity_logs.models import ActivityLog
from activity_logs.services import ActivityLogService
from notifications.services import NotificationService
from videos.models import Video

EMPLOYEE_TRANSITIONS = {
    Video.Stage.IDEA: {Video.Stage.SCRIPT},
    Video.Stage.SCRIPT: {Video.Stage.SHOOTING},
    Video.Stage.SHOOTING: {Video.Stage.EDITING},
    Video.Stage.EDITING: {Video.Stage.INTERNAL_REVIEW},
    Video.Stage.REVISION: {Video.Stage.EDITING, Video.Stage.INTERNAL_REVIEW},
    Video.Stage.SCHEDULED: {Video.Stage.SHOOTING, Video.Stage.IN_PROGRESS},
    Video.Stage.IN_PROGRESS: {Video.Stage.INTERNAL_REVIEW, Video.Stage.OWNER_REVIEW, Video.Stage.EDITING},
}

MANAGER_TRANSITIONS = {
    **EMPLOYEE_TRANSITIONS,
    Video.Stage.INTERNAL_REVIEW: {Video.Stage.CLIENT_REVIEW, Video.Stage.REVISION, Video.Stage.APPROVED, Video.Stage.OWNER_REVIEW},
    Video.Stage.OWNER_REVIEW: {Video.Stage.CLIENT_REVIEW, Video.Stage.APPROVED, Video.Stage.REVISION},
    Video.Stage.CLIENT_REVIEW: {Video.Stage.APPROVED, Video.Stage.REVISION, Video.Stage.REJECTED},
    Video.Stage.APPROVED: {Video.Stage.PUBLISHED, Video.Stage.POSTED},
}

WORKFLOW_ORDER = [
    Video.Stage.IDEA,
    Video.Stage.SCRIPT,
    Video.Stage.SHOOTING,
    Video.Stage.EDITING,
    Video.Stage.INTERNAL_REVIEW,
    Video.Stage.CLIENT_REVIEW,
    Video.Stage.REVISION,
    Video.Stage.APPROVED,
    Video.Stage.PUBLISHED,
]


class VideoWorkflowService:
    @staticmethod
    def allowed_map(user) -> dict:
        if user.role == user.Role.OWNER:
            return None
        if user.role == user.Role.MANAGER:
            return MANAGER_TRANSITIONS
        return EMPLOYEE_TRANSITIONS

    @classmethod
    def transition(cls, video: Video, new_stage: str, *, actor, request=None, reason: str = "") -> Video:
        current = video.stage or video.status
        allowed = cls.allowed_map(actor)
        if allowed is not None:
            next_set = allowed.get(current, set())
            if new_stage not in next_set:
                raise PermissionDenied("This workflow stage change is not allowed for your role.")
        if new_stage not in Video.Stage.values:
            raise ValidationError({"stage": "Unknown video stage."})
        video.stage = new_stage
        video.status = new_stage
        if new_stage == Video.Stage.REJECTED:
            video.rejection_reason = reason
            video.rejection_count = (video.rejection_count or 0) + 1
        video.save()
        ActivityLogService.log(
            actor=actor,
            action=ActivityLog.Action.STATUS_CHANGE,
            entity_type="video",
            entity_id=str(video.numeric_id),
            description=f"Video moved from {current} to {new_stage}",
            metadata={"from": current, "to": new_stage},
            request=request,
        )
        NotificationService.notify(
            recipient=video.assigned_to or video.created_by,
            title="Video stage changed",
            message=f'"{video.title}" is now {new_stage}.',
            notification_type="video_stage_changed",
            related_object_type="video",
            related_object_id=str(video.numeric_id),
        )
        return video

    @classmethod
    def advance(cls, video: Video, *, actor, request=None) -> Video:
        current = video.stage or video.status
        if current in WORKFLOW_ORDER:
            idx = WORKFLOW_ORDER.index(current)
            nxt = WORKFLOW_ORDER[min(idx + 1, len(WORKFLOW_ORDER) - 1)]
        else:
            nxt = Video.Stage.EDITING
        return cls.transition(video, nxt, actor=actor, request=request)

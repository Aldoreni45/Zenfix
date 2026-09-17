from __future__ import annotations

from activity_logs.models import ActivityLog


class ActivityLogService:
    @staticmethod
    def log(*, actor, action: str, entity_type: str, entity_id: str = "", description: str = "", metadata=None, request=None) -> ActivityLog:
        ip = ""
        ua = ""
        if request is not None:
            ip = request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip() or request.META.get("REMOTE_ADDR", "")
            ua = (request.META.get("HTTP_USER_AGENT") or "")[:300]
        return ActivityLog.objects.create(
            actor=actor,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id or ""),
            description=description,
            metadata=metadata or {},
            ip_address=ip,
            user_agent=ua,
        )

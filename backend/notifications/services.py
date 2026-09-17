from __future__ import annotations

from django.utils import timezone

from notifications.models import Notification


class NotificationService:
    @staticmethod
    def notify(*, recipient, title: str, message: str, notification_type: str = "info", related_object_type: str = "", related_object_id: str = "", link: str = "", priority: str = "normal") -> Notification | None:
        if recipient is None:
            return None
        return Notification.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            related_object_type=related_object_type,
            related_object_id=str(related_object_id or ""),
            link=link,
            priority=priority,
        )

    @staticmethod
    def mark_read(notification: Notification) -> Notification:
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at", "updated_at"])
        return notification

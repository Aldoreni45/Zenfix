from django.conf import settings
from django.db import models

from common.models import NumericIdModel


class Notification(NumericIdModel):
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    notification_type = models.CharField(max_length=60, default="info")
    title = models.CharField(max_length=250)
    message = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    related_object_type = models.CharField(max_length=60, blank=True)
    related_object_id = models.CharField(max_length=64, blank=True)
    link = models.CharField(max_length=250, blank=True)
    priority = models.CharField(max_length=20, default="normal")
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "zf_notifications"
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
        ]
        ordering = ["-created_at"]

from django.conf import settings
from django.db import models

from common.models import NumericIdModel


class Approval(NumericIdModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CHANGES_REQUESTED = "changes_requested", "Changes Requested"

    content_type = models.CharField(max_length=40, default="video")
    object_id = models.CharField(max_length=64, blank=True)
    video = models.ForeignKey("videos.Video", null=True, blank=True, on_delete=models.CASCADE, related_name="approvals")
    task = models.ForeignKey("tasks.Task", null=True, blank=True, on_delete=models.CASCADE, related_name="approvals")
    approval_type = models.CharField(max_length=40, default="internal")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="requested_approvals"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_approvals"
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="approval_reviews"
    )
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING, db_index=True)
    comments = models.TextField(blank=True)
    reviewer_comments = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    client_contact = models.CharField(max_length=200, blank=True)
    client_email = models.EmailField(blank=True)
    change_requests = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "zf_approvals"
        ordering = ["-created_at"]

    @property
    def status_name(self) -> str:
        return self.get_status_display()

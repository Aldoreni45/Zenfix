from django.conf import settings
from django.db import models

from common.models import NumericIdModel


class ActivityLog(NumericIdModel):
    class Action(models.TextChoices):
        LOGIN = "LOGIN", "Login"
        LOGOUT = "LOGOUT", "Logout"
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        ASSIGN = "ASSIGN", "Assign"
        STATUS_CHANGE = "STATUS_CHANGE", "Status Change"
        APPROVE = "APPROVE", "Approve"
        REJECT = "REJECT", "Reject"
        SUBMIT = "SUBMIT", "Submit"
        ROLE_CHANGE = "ROLE_CHANGE", "Role Change"
        PASSWORD_CHANGE = "PASSWORD_CHANGE", "Password Change"
        CARRY_FORWARD = "CARRY_FORWARD", "Carry Forward"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="activity_logs"
    )
    action = models.CharField(max_length=40, choices=Action.choices, db_index=True)
    entity_type = models.CharField(max_length=60, db_index=True)
    entity_id = models.CharField(max_length=64, blank=True, db_index=True)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.CharField(max_length=64, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)

    class Meta:
        db_table = "zf_activity_logs"
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
        ]
        ordering = ["-created_at"]

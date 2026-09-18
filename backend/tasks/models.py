from django.conf import settings
from django.db import models
from django_mongodb_backend.fields import ArrayField

from common.models import NumericIdModel


class Task(NumericIdModel):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ASSIGNED = "assigned", "Assigned"
        IN_PROGRESS = "in_progress", "In Progress"
        BLOCKED = "blocked", "Blocked"
        SUBMITTED = "submitted", "Submitted"
        COMPLETED = "completed", "Completed"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"
        OVERDUE = "overdue", "Overdue"

    task_id = models.CharField(max_length=40, unique=True, blank=True)
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    client = models.ForeignKey("clients.Client", null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks")
    video = models.ForeignKey("videos.Video", null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_tasks"
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="delegated_tasks"
    )
    assigned_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="managed_tasks"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_tasks"
    )
    department = models.ForeignKey(
        "departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks"
    )
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    due_date = models.DateField(null=True, blank=True, db_index=True)
    original_due_date = models.DateField(null=True, blank=True)
    due_time = models.TimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    parent_task = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="subtasks")
    carried_forward_from = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="carry_forwards"
    )
    carry_forward_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    attachments = ArrayField(models.CharField(max_length=500), blank=True, default=list)
    estimated_hours = models.FloatField(default=0)
    actual_hours = models.FloatField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    rejection_count = models.PositiveIntegerField(default=0)
    task_type = models.CharField(max_length=80, blank=True, default="general")
    drive_link = models.URLField(max_length=500, blank=True)
    completion_notes = models.TextField(blank=True)

    class Meta:
        db_table = "zf_tasks"
        indexes = [
            models.Index(fields=["status", "due_date"]),
            models.Index(fields=["assigned_to"]),
            models.Index(fields=["client"]),
            models.Index(fields=["status"]),
            models.Index(fields=["priority"]),
            models.Index(fields=["due_date"]),
            models.Index(fields=["created_at"]),
        ]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        creating = self._state.adding
        super().save(*args, **kwargs)
        if creating and not self.task_id:
            self.task_id = f"T-{self.numeric_id:06d}"
            super().save(update_fields=["task_id"])

    @property
    def status_name(self) -> str:
        return self.get_status_display()

    @property
    def priority_name(self) -> str:
        return self.get_priority_display()

    @property
    def is_overdue(self) -> bool:
        from django.utils import timezone

        if not self.due_date:
            return False
        if self.status in {self.Status.COMPLETED, self.Status.CANCELLED}:
            return False
        return self.due_date < timezone.localdate()


class TaskComment(NumericIdModel):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="task_comments")
    comment = models.TextField()

    class Meta:
        db_table = "zf_task_comments"
        ordering = ["created_at"]

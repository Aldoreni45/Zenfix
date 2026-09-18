from django.conf import settings
from django.db import models
from django_mongodb_backend.fields import ArrayField

from common.models import NumericIdModel


class Client(NumericIdModel):
    class Status(models.TextChoices):
        LEAD = "lead", "Lead"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"
        INACTIVE = "inactive", "Inactive"

    name = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200, blank=True)
    contact_person = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    address = models.TextField(blank=True)
    instagram_username = models.CharField(max_length=120, blank=True)
    instagram_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.LEAD, db_index=True)
    assigned_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_clients",
    )
    assigned_team_ids = ArrayField(models.IntegerField(), blank=True, default=list)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    monthly_video_target = models.PositiveIntegerField(default=5, help_text="Number of videos to post per month")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_clients",
    )

    class Meta:
        db_table = "zf_clients"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.company_name or self.name

    @property
    def status_name(self) -> str:
        return self.get_status_display()

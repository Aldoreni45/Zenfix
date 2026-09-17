from django.conf import settings
from django.db import models

from common.models import NumericIdModel


class MonthlyTarget(NumericIdModel):
    class TargetType(models.TextChoices):
        VIDEOS = "videos_target", "Videos"
        POSTS = "posts_target", "Posts"
        REELS = "reels_target", "Reels"
        SEO = "seo_target", "SEO"
        TASKS = "tasks_target", "Tasks"
        LEADS = "leads_target", "Leads"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="monthly_targets"
    )
    department = models.ForeignKey(
        "departments.Department", null=True, blank=True, on_delete=models.SET_NULL, related_name="monthly_targets"
    )
    client = models.ForeignKey(
        "clients.Client", null=True, blank=True, on_delete=models.CASCADE, related_name="monthly_targets"
    )
    month = models.PositiveSmallIntegerField()
    year = models.PositiveIntegerField()
    target_type = models.CharField(max_length=40, choices=TargetType.choices, default=TargetType.VIDEOS)
    target_value = models.PositiveIntegerField(default=0)
    achieved_value = models.PositiveIntegerField(default=0)
    target_videos = models.PositiveIntegerField(default=0)
    completed_videos = models.PositiveIntegerField(default=0)
    posted_videos = models.PositiveIntegerField(default=0)
    pending_videos = models.PositiveIntegerField(default=0)
    in_production_videos = models.PositiveIntegerField(default=0)
    waiting_approval_videos = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_targets"
    )

    class Meta:
        db_table = "zf_monthly_targets"
        indexes = [
            models.Index(fields=["year", "month"]),
        ]
        unique_together = ("user", "department", "client", "month", "year", "target_type")
        ordering = ["-year", "-month"]

    @property
    def remaining_videos(self) -> int:
        return max((self.target_videos or self.target_value) - self.completed_videos, 0)

    @property
    def progress_percentage(self) -> float:
        total = self.target_videos or self.target_value
        if not total:
            return 0
        return round(100.0 * self.completed_videos / total, 1)

    @property
    def year_month(self) -> str:
        return f"{self.year}-{self.month:02d}"

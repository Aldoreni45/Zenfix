from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from common.models import NumericIdModel


class MonthlyVideoProtocol(NumericIdModel):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="video_protocols",
    )
    month = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    year = models.PositiveIntegerField()
    target_videos = models.PositiveIntegerField(default=5)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_protocols",
    )

    class Meta:
        db_table = "zf_video_protocols"
        ordering = ["-year", "-month"]
        unique_together = [("client", "month", "year")]

    def __str__(self):
        return f"{self.client.name} - {self.month}/{self.year}"

    @property
    def total_stages(self):
        return self.videos.count() * VideoStage.STAGE_COUNT

    @property
    def completed_stages(self):
        return VideoStage.objects.filter(
            video__protocol=self,
            status=VideoStage.Status.COMPLETED,
        ).count()

    @property
    def workflow_progress(self):
        total = self.total_stages
        if total == 0:
            return 0
        return round((self.completed_stages / total) * 100, 1)

    @property
    def fully_completed_videos(self):
        stage_types = list(VideoStage.StageType.values)
        from django.db.models import Count, Q
        videos_with_all_stages = (
            self.videos.annotate(
                completed_count=Count(
                    "stages",
                    filter=Q(stages__status=VideoStage.Status.COMPLETED),
                )
            )
            .filter(completed_count__gte=len(stage_types))
            .count()
        )
        return videos_with_all_stages

    @property
    def stage_counts(self):
        from django.db.models import Count, Q
        result = {}
        for stage_type, _ in VideoStage.StageType.choices:
            completed = VideoStage.objects.filter(
                video__protocol=self,
                stage_type=stage_type,
                status=VideoStage.Status.COMPLETED,
            ).count()
            result[stage_type] = {
                "completed": completed,
                "total": self.videos.count(),
            }
        return result

    @property
    def video_status_counts(self):
        from django.db.models import Count, Q
        counts = {"not_started": 0, "in_progress": 0, "posted": 0}
        for video in self.videos.all():
            status = video.current_status
            if status == "posted":
                counts["posted"] += 1
            elif status == "not_started":
                counts["not_started"] += 1
            else:
                counts["in_progress"] += 1
        return counts


class VideoRecord(NumericIdModel):
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not Started"
        SHOOTING = "shooting", "Shooting"
        EDITING = "editing", "Editing"
        IN_REVIEW = "in_review", "In Review"
        CLIENT_APPROVAL = "client_approval", "Client Approval"
        READY_TO_POST = "ready_to_post", "Ready to Post"
        POSTED = "posted", "Posted"
        BLOCKED = "blocked", "Blocked"

    protocol = models.ForeignKey(
        MonthlyVideoProtocol,
        on_delete=models.CASCADE,
        related_name="videos",
    )
    video_number = models.PositiveIntegerField()
    title = models.CharField(max_length=250, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "zf_video_records"
        ordering = ["video_number"]
        unique_together = [("protocol", "video_number")]

    def __str__(self):
        return f"Video {self.video_number:02d} - {self.protocol.client.name}"

    @property
    def current_status(self):
        stages = list(self.stages.order_by("stage_type"))
        if not stages:
            return "not_started"
        for stage in reversed(stages):
            if stage.status == "completed":
                stage_order = [s[0] for s in VideoStage.StageType.choices]
                idx = stage_order.index(stage.stage_type)
                if idx == len(stage_order) - 1:
                    return "posted"
                next_stage = stages[idx + 1] if idx + 1 < len(stages) else None
                if next_stage and next_stage.status == "in_progress":
                    return stage_order[idx + 1].lower()
                return stage_order[idx + 1].replace("_", " ").lower() if idx + 1 < len(stage_order) else "posted"
            if stage.status == "in_progress":
                return stage.get_stage_type_display().lower().replace(" ", "_")
        return "not_started"

    @property
    def current_stage_name(self):
        stage_order = [s[0] for s in VideoStage.StageType.choices]
        stages = {s.stage_type: s for s in self.stages.all()}
        for stage_type in stage_order:
            stage = stages.get(stage_type)
            if stage and stage.status in ("not_started", "in_progress"):
                return stage.get_stage_type_display()
        return "Completed"

    @property
    def current_stage_type(self):
        stage_order = [s[0] for s in VideoStage.StageType.choices]
        stages = {s.stage_type: s for s in self.stages.all()}
        for stage_type in stage_order:
            stage = stages.get(stage_type)
            if stage and stage.status in ("not_started", "in_progress"):
                return stage_type
        if all(stages.get(st, None) and stages[st].status == "completed" for st in stage_order):
            return "completed"
        return stage_order[0]


class VideoStage(NumericIdModel):
    class StageType(models.TextChoices):
        SHOOT = "shoot", "Shoot Video"
        EDIT = "edit", "Edit Video"
        REVIEW = "review", "Review Video"
        CLIENT_APPROVAL = "client_approval", "Client Approval"
        INSTAGRAM_POST = "instagram_post", "Instagram Post"

    STAGE_COUNT = 5

    STAGE_ORDER = {
        StageType.SHOOT: 0,
        StageType.EDIT: 1,
        StageType.REVIEW: 2,
        StageType.CLIENT_APPROVAL: 3,
        StageType.INSTAGRAM_POST: 4,
    }

    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not Started"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        BLOCKED = "blocked", "Blocked"
        REJECTED = "rejected", "Rejected"

    video = models.ForeignKey(
        VideoRecord,
        on_delete=models.CASCADE,
        related_name="stages",
    )
    stage_type = models.CharField(max_length=30, choices=StageType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="video_stages",
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)
    drive_link = models.URLField(max_length=500, blank=True)
    completion_notes = models.TextField(blank=True)
    instagram_url = models.URLField(max_length=500, blank=True)
    caption = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "zf_video_stages"
        ordering = ["stage_type"]
        unique_together = [("video", "stage_type")]

    def __str__(self):
        return f"{self.get_stage_type_display()} - Video {self.video.video_number:02d}"

    @property
    def is_locked(self):
        if self.status in (self.Status.COMPLETED, self.Status.IN_PROGRESS):
            return False
        stage_order = [s[0] for s in self.StageType.choices]
        current_idx = self.STAGE_ORDER.get(self.stage_type, 0)
        if current_idx == 0:
            return False
        prev_type = stage_order[current_idx - 1]
        prev_stage = VideoStage.objects.filter(
            video=self.video,
            stage_type=prev_type,
        ).first()
        return prev_stage.status != self.Status.COMPLETED if prev_stage else True

    @property
    def is_overdue(self):
        if not self.due_date or self.status == self.Status.COMPLETED:
            return False
        from django.utils import timezone
        return self.due_date < timezone.localdate()

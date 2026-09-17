from django.conf import settings
from django.db import models
from django_mongodb_backend.fields import ArrayField

from common.models import NumericIdModel


class Video(NumericIdModel):
    class Stage(models.TextChoices):
        IDEA = "idea", "Idea"
        SCRIPT = "script", "Script"
        SHOOTING = "shooting", "Shooting"
        EDITING = "editing", "Editing"
        INTERNAL_REVIEW = "internal_review", "Internal Review"
        CLIENT_REVIEW = "client_review", "Client Review"
        REVISION = "revision", "Revision"
        APPROVED = "approved", "Approved"
        PUBLISHED = "published", "Published"
        REJECTED = "rejected", "Rejected"
        SCHEDULED = "scheduled", "Scheduled"
        IN_PROGRESS = "in_progress", "In Progress"
        OWNER_REVIEW = "owner_review", "Owner Review"
        POSTED = "posted", "Posted"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    video_code = models.CharField(max_length=40, unique=True, blank=True)
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    client = models.ForeignKey("clients.Client", null=True, blank=True, on_delete=models.SET_NULL, related_name="videos")
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_videos"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_videos"
    )
    stage = models.CharField(max_length=30, choices=Stage.choices, default=Stage.IDEA, db_index=True)
    status = models.CharField(max_length=30, choices=Stage.choices, default=Stage.IDEA, db_index=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    deadline = models.DateField(null=True, blank=True, db_index=True)
    script = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    thumbnail_url = models.URLField(blank=True)
    feedback = models.TextField(blank=True)
    monthly_target = models.ForeignKey(
        "targets.MonthlyTarget", null=True, blank=True, on_delete=models.SET_NULL, related_name="videos"
    )
    shoot_date = models.DateField(null=True, blank=True)
    edit_due_date = models.DateField(null=True, blank=True)
    approval_date = models.DateField(null=True, blank=True)
    posted_date = models.DateField(null=True, blank=True)
    shooter = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="shot_videos"
    )
    editor = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="edited_videos"
    )
    social_media_handler = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="social_videos"
    )
    raw_footage_urls = ArrayField(models.CharField(max_length=500), blank=True, default=list)
    edited_video_url = models.URLField(blank=True)
    final_video_url = models.URLField(blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True)
    format = models.CharField(max_length=40, blank=True)
    rejection_reason = models.TextField(blank=True)
    rejection_count = models.PositiveIntegerField(default=0)
    instagram_caption = models.TextField(blank=True)
    instagram_hashtags = ArrayField(models.CharField(max_length=80), blank=True, default=list)
    instagram_post_url = models.URLField(blank=True)

    class Meta:
        db_table = "zf_videos"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.status and not self.stage:
            self.stage = self.status
        if self.stage and self.status != self.stage:
            self.status = self.stage
        super().save(*args, **kwargs)
        if not self.video_code:
            self.video_code = f"ZF-{self.numeric_id:04d}"
            super().save(update_fields=["video_code"])

    @property
    def status_name(self) -> str:
        return self.get_status_display()

    @property
    def priority_name(self) -> str:
        return self.get_priority_display()

    @property
    def is_overdue(self) -> bool:
        from django.utils import timezone

        if not self.deadline:
            return False
        if self.stage in {self.Stage.PUBLISHED, self.Stage.POSTED, self.Stage.APPROVED}:
            return False
        return self.deadline < timezone.localdate()


class VideoAsset(NumericIdModel):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="assets")
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="video_uploads"
    )
    file_url = models.CharField(max_length=500)
    kind = models.CharField(max_length=40, default="file")
    uploaded_at = models.DateTimeField(auto_now_add=True)


class SocialPost(NumericIdModel):
    class Platform(models.TextChoices):
        INSTAGRAM = "instagram", "Instagram"
        FACEBOOK = "facebook", "Facebook"
        YOUTUBE = "youtube", "YouTube"
        TIKTOK = "tiktok", "TikTok"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SCHEDULED = "scheduled", "Scheduled"
        POSTED = "posted", "Posted"
        FAILED = "failed", "Failed"

    video = models.ForeignKey(Video, null=True, blank=True, on_delete=models.SET_NULL, related_name="social_posts")
    platform = models.CharField(max_length=40, choices=Platform.choices, default=Platform.INSTAGRAM)
    post_type = models.CharField(max_length=40, default="feed")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    caption = models.TextField(blank=True)
    hashtags = ArrayField(models.CharField(max_length=80), blank=True, default=list)
    mention_users = ArrayField(models.CharField(max_length=80), blank=True, default=list)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    posted_date = models.DateTimeField(null=True, blank=True)
    post_url = models.URLField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="social_posts"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_social_posts"
    )

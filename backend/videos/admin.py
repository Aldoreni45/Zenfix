from django.contrib import admin

from videos.models import SocialPost, Video, VideoAsset


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "video_code", "title", "stage", "client", "assigned_to", "deadline")
    list_filter = ("stage", "priority")
    search_fields = ("title", "video_code")
    readonly_fields = ("numeric_id", "video_code", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(VideoAsset)
class VideoAssetAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "video", "uploaded_by", "kind", "uploaded_at")
    readonly_fields = ("numeric_id", "created_at", "updated_at")


@admin.register(SocialPost)
class SocialPostAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "platform", "status", "scheduled_date")
    list_filter = ("platform", "status")
    readonly_fields = ("numeric_id", "created_at", "updated_at")

from django.contrib import admin

from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "recipient", "title", "is_read", "created_at")
    list_filter = ("is_read", "notification_type")
    search_fields = ("title", "message")
    readonly_fields = ("numeric_id", "created_at", "updated_at", "read_at")
    ordering = ("-created_at",)

from django.contrib import admin

from approvals.models import Approval


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "content_type", "status", "requested_by", "reviewed_by", "created_at")
    list_filter = ("status", "content_type")
    readonly_fields = ("numeric_id", "created_at", "updated_at", "requested_at", "reviewed_at")
    ordering = ("-created_at",)

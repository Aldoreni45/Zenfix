from django.contrib import admin

from activity_logs.models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "actor", "action", "entity_type", "entity_id", "created_at")
    list_filter = ("action", "entity_type")
    search_fields = ("description", "entity_id")
    readonly_fields = (
        "numeric_id",
        "actor",
        "action",
        "entity_type",
        "entity_id",
        "description",
        "metadata",
        "ip_address",
        "user_agent",
        "created_at",
        "updated_at",
    )
    ordering = ("-created_at",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

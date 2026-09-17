from django.contrib import admin

from targets.models import MonthlyTarget


@admin.register(MonthlyTarget)
class MonthlyTargetAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "year", "month", "target_type", "user", "department", "client", "target_value")
    list_filter = ("year", "month", "target_type")
    readonly_fields = ("numeric_id", "created_at", "updated_at")
    ordering = ("-year", "-month")

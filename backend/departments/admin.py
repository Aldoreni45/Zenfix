from django.contrib import admin

from departments.models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "name", "slug", "is_active")
    search_fields = ("name", "slug")
    list_filter = ("is_active",)
    readonly_fields = ("numeric_id", "created_at", "updated_at")
    ordering = ("name",)

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from users.models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("numeric_id", "username", "email", "role", "status", "is_active", "department")
    list_filter = ("role", "status", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)
    readonly_fields = ("numeric_id", "last_login", "date_joined", "created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal", {"fields": ("first_name", "last_name", "email", "phone", "avatar")}),
        ("Role", {"fields": ("role", "status", "department", "reports_to")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Ids", {"fields": ("numeric_id", "last_login", "date_joined", "created_at", "updated_at")}),
    )

from django.contrib import admin

from clients.models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "name", "company_name", "status", "assigned_manager", "created_at")
    list_filter = ("status",)
    search_fields = ("name", "company_name", "email")
    readonly_fields = ("numeric_id", "created_at", "updated_at")
    ordering = ("-created_at",)

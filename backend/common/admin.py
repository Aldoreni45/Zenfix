from django.contrib import admin

from common.models import NumericIdModel


class NumericIdAdmin(admin.ModelAdmin):
    readonly_fields = ("numeric_id", "created_at", "updated_at")

from django.contrib import admin

from tasks.models import Task, TaskComment


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "task_id", "title", "status", "priority", "assigned_to", "due_date")
    list_filter = ("status", "priority")
    search_fields = ("title", "task_id")
    readonly_fields = ("numeric_id", "task_id", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ("numeric_id", "task", "author", "created_at")
    search_fields = ("comment",)
    readonly_fields = ("numeric_id", "created_at", "updated_at")

from rest_framework import serializers

from clients.models import Client
from common.fields import NumericOrPkRelatedField
from django_mongodb_backend.fields import ArrayField
from tasks.models import Task, TaskComment
from users.models import User


class TaskCommentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    author_name = serializers.CharField(source="author.full_name", read_only=True)

    class Meta:
        model = TaskComment
        fields = ("id", "task", "author", "author_name", "comment", "created_at", "updated_at")
        read_only_fields = ("author", "created_at", "updated_at")


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    status_name = serializers.CharField(read_only=True)
    priority_name = serializers.CharField(read_only=True)
    client = NumericOrPkRelatedField(queryset=Client.objects.all(), required=False, allow_null=True)
    assigned_to = NumericOrPkRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    assigned_manager = NumericOrPkRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True, default=None)
    assigned_manager_name = serializers.CharField(source="assigned_manager.full_name", read_only=True, default=None)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    client_name = serializers.CharField(source="client.name", read_only=True, default=None)
    video_code = serializers.CharField(source="video.video_code", read_only=True, default=None)
    is_overdue = serializers.BooleanField(read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "task_id",
            "title",
            "description",
            "client",
            "client_name",
            "video",
            "video_code",
            "assigned_to",
            "assigned_to_name",
            "assigned_by",
            "assigned_manager",
            "assigned_manager_name",
            "created_by",
            "created_by_name",
            "department",
            "priority",
            "priority_name",
            "status",
            "status_name",
            "due_date",
            "original_due_date",
            "due_time",
            "started_at",
            "completed_at",
            "parent_task",
            "carried_forward_from",
            "carry_forward_count",
            "notes",
            "attachments",
            "estimated_hours",
            "actual_hours",
            "rejection_reason",
            "rejection_count",
            "task_type",
            "task_type_name",
            "is_overdue",
            "comments",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "task_id",
            "created_by",
            "assigned_by",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
            "original_due_date",
            "carry_forward_count",
        )

    task_type_name = serializers.SerializerMethodField()

    def get_task_type_name(self, obj: Task) -> str:
        return (obj.task_type or "general").replace("_", " ").title()

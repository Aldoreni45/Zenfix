from rest_framework import serializers

from activity_logs.models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    user = serializers.IntegerField(source="actor.numeric_id", read_only=True, default=None)
    user_email = serializers.EmailField(source="actor.email", read_only=True, default=None)
    user_name = serializers.CharField(source="actor.full_name", read_only=True, default=None)
    action_name = serializers.CharField(source="get_action_display", read_only=True)
    entity = serializers.CharField(source="entity_type")
    entity_name = serializers.CharField(source="entity_type")
    details = serializers.JSONField(source="metadata")
    timestamp = serializers.DateTimeField(source="created_at")

    class Meta:
        model = ActivityLog
        fields = (
            "id",
            "user",
            "user_email",
            "user_name",
            "action",
            "action_name",
            "entity",
            "entity_name",
            "entity_id",
            "details",
            "description",
            "ip_address",
            "user_agent",
            "timestamp",
        )

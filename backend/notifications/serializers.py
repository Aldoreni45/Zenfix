from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    receiver = serializers.IntegerField(source="recipient.numeric_id", read_only=True)
    receiver_email = serializers.EmailField(source="recipient.email", read_only=True)
    receiver_name = serializers.CharField(source="recipient.full_name", read_only=True)
    read = serializers.BooleanField(source="is_read")
    type = serializers.CharField(source="notification_type")
    type_name = serializers.CharField(source="notification_type")
    related_entity_type = serializers.CharField(source="related_object_type")
    related_entity_id = serializers.CharField(source="related_object_id")
    priority_name = serializers.CharField(source="priority")

    class Meta:
        model = Notification
        fields = (
            "id",
            "receiver",
            "receiver_email",
            "receiver_name",
            "title",
            "message",
            "type",
            "type_name",
            "priority",
            "priority_name",
            "read",
            "link",
            "related_entity_type",
            "related_entity_id",
            "created_at",
            "read_at",
        )

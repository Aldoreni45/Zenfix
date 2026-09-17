from rest_framework import serializers

from approvals.models import Approval


class ApprovalSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    status_name = serializers.CharField(read_only=True)
    approval_type_name = serializers.CharField(source="approval_type", read_only=True)
    reviewer_name = serializers.CharField(source="reviewer.full_name", read_only=True, default=None)
    requested_by_name = serializers.CharField(source="requested_by.full_name", read_only=True, default=None)
    video_code = serializers.CharField(source="video.video_code", read_only=True, default=None)
    client_name = serializers.CharField(source="video.client.name", read_only=True, default=None)

    class Meta:
        model = Approval
        fields = "__all__"
        read_only_fields = ("requested_by", "reviewed_by", "reviewer", "reviewed_at", "created_at", "updated_at")

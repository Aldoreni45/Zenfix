from rest_framework import serializers

from django_mongodb_backend.fields import ArrayField
from videos.models import SocialPost, Video, VideoAsset


class VideoAssetSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)

    class Meta:
        model = VideoAsset
        fields = ("id", "video", "uploaded_by", "file_url", "kind", "uploaded_at", "created_at")
        read_only_fields = ("uploaded_by", "uploaded_at", "created_at")


class VideoSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    status_name = serializers.CharField(read_only=True)
    priority_name = serializers.CharField(read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True, default=None)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True, default=None)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)
    shooter_name = serializers.CharField(source="shooter.full_name", read_only=True, default=None)
    editor_name = serializers.CharField(source="editor.full_name", read_only=True, default=None)
    is_overdue = serializers.BooleanField(read_only=True)
    assets = VideoAssetSerializer(many=True, read_only=True)
    raw_footage_urls = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)
    instagram_hashtags = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)

    class Meta:
        model = Video
        fields = "__all__"
        read_only_fields = ("video_code", "created_by", "created_at", "updated_at", "rejection_count")


class SocialPostSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    video_code = serializers.CharField(source="video.video_code", read_only=True, default=None)
    client_name = serializers.CharField(source="video.client.name", read_only=True, default=None)
    platform_name = serializers.CharField(source="get_platform_display", read_only=True)
    status_name = serializers.CharField(source="get_status_display", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.full_name", read_only=True, default=None)
    hashtags = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)
    mention_users = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)

    class Meta:
        model = SocialPost
        fields = "__all__"

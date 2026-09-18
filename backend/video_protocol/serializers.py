from rest_framework import serializers

from .models import MonthlyVideoProtocol, VideoRecord, VideoStage


class UserSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    numeric_id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()


class VideoStageSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSummarySerializer(source="assigned_to", read_only=True)
    stage_display = serializers.CharField(source="get_stage_type_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_locked = serializers.BooleanField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = VideoStage
        fields = [
            "id", "numeric_id", "video", "stage_type", "stage_display",
            "status", "status_display", "assigned_to", "assigned_to_detail",
            "started_at", "completed_at", "due_date", "notes",
            "rejection_reason", "instagram_url", "caption",
            "is_locked", "is_overdue", "created_at", "updated_at",
        ]
        read_only_fields = ["started_at", "completed_at", "rejection_reason"]


class VideoRecordSerializer(serializers.ModelSerializer):
    stages = VideoStageSerializer(many=True, read_only=True)
    current_status = serializers.SerializerMethodField()
    current_stage_name = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = VideoRecord
        fields = [
            "id", "numeric_id", "protocol", "video_number", "title",
            "stages", "current_status", "current_stage_name",
            "completion_percentage", "created_at", "updated_at",
        ]

    def get_current_status(self, obj):
        return obj.current_status

    def get_current_stage_name(self, obj):
        return obj.current_stage_name

    def get_completion_percentage(self, obj):
        completed = obj.stages.filter(status=VideoStage.Status.COMPLETED).count()
        return round((completed / VideoStage.STAGE_COUNT) * 100) if VideoStage.STAGE_COUNT else 0


class MonthlyVideoProtocolSerializer(serializers.ModelSerializer):
    videos = VideoRecordSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    workflow_progress = serializers.FloatField(read_only=True)
    completed_stages = serializers.IntegerField(read_only=True)
    total_stages = serializers.IntegerField(read_only=True)
    fully_completed_videos = serializers.IntegerField(read_only=True)
    stage_counts = serializers.DictField(read_only=True)
    video_status_counts = serializers.DictField(read_only=True)

    class Meta:
        model = MonthlyVideoProtocol
        fields = [
            "id", "numeric_id", "client", "client_name", "month", "year",
            "target_videos", "status", "videos", "workflow_progress",
            "completed_stages", "total_stages", "fully_completed_videos",
            "stage_counts", "video_status_counts", "created_at", "updated_at",
        ]


class MonthlyVideoProtocolListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    workflow_progress = serializers.FloatField(read_only=True)
    fully_completed_videos = serializers.IntegerField(read_only=True)
    video_status_counts = serializers.DictField(read_only=True)
    total_videos = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyVideoProtocol
        fields = [
            "id", "numeric_id", "client", "client_name", "month", "year",
            "target_videos", "status", "workflow_progress",
            "fully_completed_videos", "video_status_counts",
            "total_videos", "created_at", "updated_at",
        ]

    def get_total_videos(self, obj):
        return obj.videos.count()


class StageActionSerializer(serializers.Serializer):
    assigned_to = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    due_date = serializers.DateField(required=False, allow_null=True)
    instagram_url = serializers.URLField(required=False, allow_blank=True, max_length=500)
    caption = serializers.CharField(required=False, allow_blank=True)


class StageRejectSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField()
    reject_to_stage = serializers.ChoiceField(
        choices=VideoStage.StageType.choices,
        required=False,
    )


class ProtocolCreateSerializer(serializers.Serializer):
    client = serializers.IntegerField()
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2024, max_value=2030)
    target_videos = serializers.IntegerField(min_value=1, max_value=100)


class TargetUpdateSerializer(serializers.Serializer):
    target_videos = serializers.IntegerField(min_value=1, max_value=100)
    confirm_reduction = serializers.BooleanField(default=False, required=False)

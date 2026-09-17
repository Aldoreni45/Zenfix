from rest_framework import serializers

from targets.models import MonthlyTarget


class MonthlyTargetSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True, default=None)
    remaining_videos = serializers.IntegerField(read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)
    year_month = serializers.CharField(read_only=True)

    class Meta:
        model = MonthlyTarget
        fields = "__all__"
        read_only_fields = ("created_by", "created_at", "updated_at", "achieved_value")

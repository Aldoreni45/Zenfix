from rest_framework import serializers

from departments.models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)

    class Meta:
        model = Department
        fields = ("id", "name", "slug", "description", "is_active", "created_at", "updated_at")

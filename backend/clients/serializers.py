from rest_framework import serializers

from clients.models import Client
from common.fields import NumericOrPkRelatedField
from users.models import User


class ClientSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    status_name = serializers.CharField(read_only=True)
    assigned_manager = NumericOrPkRelatedField(queryset=User.objects.all(), required=False, allow_null=True)
    manager_name = serializers.CharField(source="assigned_manager.full_name", read_only=True, default=None)
    manager_email = serializers.EmailField(source="assigned_manager.email", read_only=True, default=None)
    manager_id = serializers.IntegerField(source="assigned_manager.numeric_id", read_only=True, default=None)
    assigned_team = serializers.ListField(source="assigned_team_ids", child=serializers.IntegerField(), required=False)

    class Meta:
        model = Client
        fields = (
            "id",
            "name",
            "company_name",
            "contact_person",
            "email",
            "phone",
            "website",
            "industry",
            "description",
            "address",
            "instagram_username",
            "instagram_url",
            "notes",
            "status",
            "status_name",
            "assigned_manager",
            "manager_name",
            "manager_email",
            "manager_id",
            "assigned_team",
            "start_date",
            "end_date",
            "created_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_by", "created_at", "updated_at")

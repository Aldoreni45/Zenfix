from rest_framework import serializers

from departments.models import Department
from users.models import User


class UserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    full_name = serializers.CharField(read_only=True)
    role_name = serializers.CharField(read_only=True)
    status_name = serializers.CharField(read_only=True)
    department_name = serializers.CharField(read_only=True)
    department = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "role",
            "role_name",
            "department",
            "department_name",
            "avatar",
            "status",
            "status_name",
            "is_active",
            "last_login",
            "created_at",
            "updated_at",
            "password",
            "confirm_password",
            "reports_to",
        )
        extra_kwargs = {"password": {"write_only": True}}
        read_only_fields = ("last_login", "is_active", "created_at", "updated_at")

    def validate_department(self, value):
        if value in (None, ""):
            return None
        dept = Department.objects.filter(name__iexact=str(value).strip()).first()
        if dept is None:
            raise serializers.ValidationError(f"Department '{value}' not found.")
        return dept

    def validate(self, attrs):
        password = attrs.get("password")
        confirm = attrs.pop("confirm_password", None)
        if password and confirm is None:
            raise serializers.ValidationError({"confirm_password": "This field is required when setting a password."})
        if password and confirm != password:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        validated_data.pop("confirm_password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        validated_data.pop("confirm_password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop("password", None)
        return data


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

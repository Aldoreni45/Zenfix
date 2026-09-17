from rest_framework import serializers

from users.models import User


class UserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="numeric_id", read_only=True)
    full_name = serializers.CharField(read_only=True)
    role_name = serializers.CharField(read_only=True)
    status_name = serializers.CharField(read_only=True)
    department_name = serializers.CharField(read_only=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)

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
            "reports_to",
        )
        extra_kwargs = {"password": {"write_only": True}}
        read_only_fields = ("last_login", "is_active", "created_at", "updated_at")

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
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

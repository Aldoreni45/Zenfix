from django.db import connection
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    database = serializers.CharField()


class ReadyResponseSerializer(serializers.Serializer):
    status = serializers.CharField()
    database = serializers.CharField()


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []
    serializer_class = HealthResponseSerializer

    def get(self, request):
        try:
            connection.get_database().command("ping")
            return Response({"status": "ok", "database": "connected"})
        except Exception:  # noqa: BLE001
            return Response({"status": "error", "database": "disconnected"}, status=503)


class ReadyView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = []
    serializer_class = ReadyResponseSerializer

    def get(self, request):
        try:
            connection.get_database().command("ping")
            return Response({"status": "ready", "database": "connected"})
        except Exception:  # noqa: BLE001
            return Response({"status": "not_ready", "database": "disconnected"}, status=503)

from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from common.permissions import IsAuthenticatedAndActive
from common.viewsets import NumericIdViewSetMixin
from departments.models import Department
from departments.serializers import DepartmentSerializer


class DepartmentViewSet(NumericIdViewSetMixin, viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticatedAndActive]
    search_fields = ("name", "slug")

    def perform_create(self, serializer):
        if self.request.user.role != self.request.user.Role.OWNER:
            raise PermissionDenied("Only the owner can manage departments.")
        serializer.save()

    def perform_update(self, serializer):
        self.perform_create(serializer)

    def perform_destroy(self, instance):
        if self.request.user.role != self.request.user.Role.OWNER:
            raise PermissionDenied("Only the owner can manage departments.")
        instance.delete()
